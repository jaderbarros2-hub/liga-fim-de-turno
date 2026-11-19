"use server";

import { after } from "next/server";
import { emailIngressoCancelado } from "@/lib/emails";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saldoDaCarteira } from "@/lib/carteira";
import { descreverCupom, validarCupom } from "@/lib/cupons";
import { conferirDeck, lerLista, total } from "@/lib/decklist";
import { ehConstruido, NOME_LIGA } from "@/lib/formatos";
import { reais } from "@/lib/formato";
import { criarPedidoPix, MINUTOS_PIX } from "@/lib/mercadopago";
import { confirmarPagamento, sincronizarPagamento } from "@/lib/pagamentos";
import { buscarCartas } from "@/lib/scryfall";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoInscricao = { erro?: string };
export type EstadoDeckRapido = {
  erro?: string;
  problemas?: string[];
  deck?: { id: string; nome: string };
};

const HORAS_CANCELAMENTO = 24;

/** Deck obrigatório nos construídos: confere dono, formato e legalidade e devolve a cópia que vai para a inscrição. */
async function deckParaInscricao(
  jogadorId: string,
  deckId: string,
  formato: string,
) {
  if (!deckId) return { erro: "Escolha o deck que você vai jogar." };
  const { data: deck } = await criarClienteAdmin()
    .from("decks")
    .select("id, nome, formato, arquetipo_id, principal, sideboard, legal")
    .eq("id", deckId)
    .eq("jogador_id", jogadorId)
    .maybeSingle();
  if (!deck) return { erro: "Deck não encontrado." };
  if (deck.formato !== formato)
    return {
      erro: `Esse deck é de ${NOME_LIGA[deck.formato] ?? deck.formato}. Escolha um deck de ${NOME_LIGA[formato] ?? formato}.`,
    };
  if (!deck.legal)
    return {
      erro: `Esse deck tem cartas fora da lista do ${NOME_LIGA[formato] ?? formato}. Corrija antes de continuar.`,
    };
  return {
    dados: {
      deck_id: deck.id,
      deck_nome: deck.nome,
      arquetipo_id: deck.arquetipo_id,
      deck_principal: deck.principal,
      deck_sideboard: deck.sideboard,
      deck_enviado_em: new Date().toISOString(),
    },
  };
}

/** Cadastra um deck colado na própria tela do ingresso (sem sair do checkout). */
export async function salvarDeckRapido(
  _: EstadoDeckRapido,
  form: FormData,
): Promise<EstadoDeckRapido> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };
  const nome = String(form.get("nome") ?? "").trim();
  const arquetipoId = Number(form.get("arquetipo_id")) || null;
  const formato = form.get("formato") === "premodern" ? "premodern" : "pauper";
  const lista = lerLista(String(form.get("lista") ?? ""));
  if (!nome) return { erro: "Dê um nome ao deck." };
  if (!arquetipoId) return { erro: "Escolha o arquétipo." };
  if (!lista.principal.length)
    return {
      erro: "Não encontrei cartas na lista. Cole o texto exportado do Endstep.",
    };
  const cartas = await buscarCartas(
    [...lista.principal, ...lista.sideboard].map((i) => i.nome),
  );
  if (!cartas.size)
    return {
      erro: "Não foi possível consultar as cartas agora. Tente de novo em instantes.",
    };
  const problemas = conferirDeck(lista, cartas, formato);
  const { data, error } = await criarClienteAdmin()
    .from("decks")
    .insert({
      jogador_id: user.id,
      nome,
      formato,
      arquetipo_id: arquetipoId,
      principal: lista.principal,
      sideboard: lista.sideboard,
      qtd_principal: total(lista.principal),
      qtd_sideboard: total(lista.sideboard),
      legal: problemas.length === 0,
      problemas,
    })
    .select("id, nome")
    .single();
  if (error || !data) return { erro: "Não foi possível salvar o deck." };
  if (problemas.length)
    return { erro: "O deck foi salvo, mas tem pendências:", problemas };
  return { deck: data };
}

/** Cria (ou reabre) a inscrição e gera um Pix novo. */
export async function gerarPix(
  _: EstadoInscricao,
  form: FormData,
): Promise<EstadoInscricao> {
  const slug = String(form.get("slug") ?? "");
  const caminho = `/eventos/${slug}/inscricao`;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?voltar=${encodeURIComponent(caminho)}`);

  const db = criarClienteAdmin();
  const { data: jogador } = await db
    .from("jogadores")
    .select("id, nome, email, cpf, aceite_termos_em")
    .eq("id", user.id)
    .maybeSingle();
  if (!jogador?.aceite_termos_em)
    redirect(`/cadastro?voltar=${encodeURIComponent(caminho)}`);

  const { data: evento } = await db
    .from("eventos")
    .select(
      "id, titulo, status, formato, valor_centavos, vagas, inscricoes_ate",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) return { erro: "Evento não encontrado." };
  if (evento.status !== "aberto")
    return { erro: "As inscrições deste evento não estão abertas." };
  if (form.get("aceite") !== "on")
    return { erro: "Confirme que leu as regras do ingresso." };
  let deck: Record<string, unknown> = {};
  if (ehConstruido(evento.formato)) {
    const r = await deckParaInscricao(
      jogador.id,
      String(form.get("deck_id") ?? ""),
      evento.formato,
    );
    if (r.erro) return { erro: r.erro };
    deck = r.dados!;
  }
  if (
    evento.inscricoes_ate &&
    new Date(evento.inscricoes_ate).getTime() < Date.now()
  )
    return { erro: "O prazo de inscrição deste evento já terminou." };

  // Cupom: desconto ou ingresso gratuito
  let valor = evento.valor_centavos;
  let cupom: { id: string; desconto: number } | null = null;
  const codigo = String(form.get("cupom") ?? "").trim();
  if (codigo) {
    const v = await validarCupom(codigo, evento, jogador.id);
    if ("erro" in v) return { erro: v.erro };
    cupom = { id: v.cupom.id, desconto: v.desconto };
    valor = v.final;
  }

  if (evento.vagas) {
    const { count } = await db
      .from("inscricoes")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", evento.id)
      .eq("status", "confirmada");
    if ((count ?? 0) >= evento.vagas)
      return { erro: "As vagas deste evento esgotaram." };
  }

  // Inscrição: reaproveita a existente (expirada ou cancelada volta a aguardar pagamento)
  const { data: existente } = await db
    .from("inscricoes")
    .select("id, status")
    .eq("evento_id", evento.id)
    .eq("jogador_id", jogador.id)
    .maybeSingle();
  if (existente?.status === "confirmada") redirect(`/eventos/${slug}`);

  let inscricaoId = existente?.id as string | undefined;
  if (inscricaoId) {
    await db
      .from("inscricoes")
      .update({ status: "aguardando_pagamento", cancelado_em: null, ...deck })
      .eq("id", inscricaoId);
    // Pix antigo ainda pendente: verifica se foi pago antes de gerar outro
    const { data: pendentes } = await db
      .from("pagamentos")
      .select("id")
      .eq("inscricao_id", inscricaoId)
      .eq("status", "pendente");
    for (const p of pendentes ?? []) {
      if ((await sincronizarPagamento(p.id)) === "aprovado")
        redirect(`/eventos/${slug}`);
      await db
        .from("pagamentos")
        .update({ status: "cancelado" })
        .eq("id", p.id)
        .eq("status", "pendente");
    }
    await db
      .from("inscricoes")
      .update({ status: "aguardando_pagamento" })
      .eq("id", inscricaoId);
  } else {
    const { data: nova, error } = await db
      .from("inscricoes")
      .insert({ evento_id: evento.id, jogador_id: jogador.id, ...deck })
      .select("id")
      .single();
    if (error || !nova)
      return { erro: "Não foi possível registrar a inscrição. Tente de novo." };
    inscricaoId = nova.id;
  }

  // Cupom de 100%: emite o ingresso sem Pix
  if (valor === 0 && cupom) {
    const { data: gratis } = await db
      .from("pagamentos")
      .insert({
        inscricao_id: inscricaoId,
        provedor: "cupom",
        valor_centavos: 0,
        cupom_id: cupom.id,
        desconto_centavos: cupom.desconto,
      })
      .select("id")
      .single();
    if (!gratis) return { erro: "Não foi possível emitir o ingresso." };
    await confirmarPagamento(gratis.id, undefined, "cupom");
    revalidatePath(caminho);
    redirect(caminho);
  }

  const { data: pagamento, error: erroPag } = await db
    .from("pagamentos")
    .insert({
      inscricao_id: inscricaoId,
      valor_centavos: valor,
      cupom_id: cupom?.id ?? null,
      desconto_centavos: cupom?.desconto ?? 0,
      expira_em: new Date(Date.now() + MINUTOS_PIX * 60_000).toISOString(),
    })
    .select("id")
    .single();
  if (erroPag || !pagamento)
    return { erro: "Não foi possível iniciar o pagamento. Tente de novo." };

  try {
    const pedido = await criarPedidoPix({
      referencia: pagamento.id,
      valorCentavos: valor,
      descricao: `Ingresso · ${evento.titulo}`.slice(0, 150),
      email: jogador.email || user.email || "",
      nome: jogador.nome,
      cpf: jogador.cpf,
    });
    await db
      .from("pagamentos")
      .update({
        id_externo: pedido.idExterno,
        pix_copia_cola: pedido.copiaCola,
        pix_qr_base64: pedido.qrBase64,
        ...(pedido.expiraEm ? { expira_em: pedido.expiraEm } : {}),
      })
      .eq("id", pagamento.id);
  } catch (e) {
    await db
      .from("pagamentos")
      .update({ status: "cancelado" })
      .eq("id", pagamento.id);
    return { erro: e instanceof Error ? e.message : "Falha ao gerar o Pix." };
  }

  revalidatePath(caminho);
  redirect(caminho);
}

/** Cancela a inscrição: pendente a qualquer momento; paga até 24h antes (gera pedido de reembolso). */
export async function cancelarInscricao(form: FormData) {
  const slug = String(form.get("slug") ?? "");
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const db = criarClienteAdmin();
  const { data: evento } = await db
    .from("eventos")
    .select("id, inicio")
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) redirect("/minha-area");

  const { data: insc } = await db
    .from("inscricoes")
    .select("id, status")
    .eq("evento_id", evento.id)
    .eq("jogador_id", user.id)
    .maybeSingle();
  if (!insc) redirect(`/eventos/${slug}`);

  const agora = new Date().toISOString();
  if (insc.status === "aguardando_pagamento") {
    await db
      .from("pagamentos")
      .update({ status: "cancelado" })
      .eq("inscricao_id", insc.id)
      .eq("status", "pendente");
    await db
      .from("inscricoes")
      .update({ status: "cancelada", cancelado_em: agora })
      .eq("id", insc.id);
  } else if (insc.status === "confirmada") {
    const limite =
      new Date(evento.inicio).getTime() - HORAS_CANCELAMENTO * 3600_000;
    if (Date.now() > limite) redirect(`/eventos/${slug}?aviso=prazo`);
    const { data: pago } = await db
      .from("pagamentos")
      .select("valor_centavos")
      .eq("inscricao_id", insc.id)
      .eq("status", "aprovado")
      .maybeSingle();
    await db
      .from("inscricoes")
      .update({ status: "cancelada", cancelado_em: agora })
      .eq("id", insc.id);
    if (pago) {
      // O jogador escolhe: reembolso por Pix (a organização paga) ou crédito para outro ingresso
      const { data: ev } = await db
        .from("eventos")
        .select("titulo")
        .eq("id", evento.id)
        .single();
      await db.from("carteira_movimentos").insert({
        jogador_id: user.id,
        tipo: "credito",
        valor_centavos: pago.valor_centavos,
        descricao: `Ingresso cancelado · ${ev?.titulo ?? ""}`,
        inscricao_id: insc.id,
        concluido_em: agora,
      });
      after(() =>
        emailIngressoCancelado(
          insc.id,
          pago.valor_centavos,
          form.get("destino") === "credito" ? "credito" : "pix",
        ),
      );
      if (form.get("destino") !== "credito") {
        const { data: j } = await db
          .from("jogadores")
          .select("chave_pix")
          .eq("id", user.id)
          .single();
        await db.from("carteira_movimentos").insert({
          jogador_id: user.id,
          tipo: "saque",
          valor_centavos: -pago.valor_centavos,
          status: "pendente",
          descricao: "Reembolso de ingresso",
          inscricao_id: insc.id,
          automatico: true,
          chave_pix: j?.chave_pix ?? null,
        });
      }
    }
  }
  await db.from("registro_atividades").insert({
    ator_id: user.id,
    acao: "inscricao_cancelada",
    entidade: "inscricoes",
    entidade_id: insc.id,
  });
  revalidatePath(`/eventos/${slug}`);
  redirect("/minha-area");
}

/** Saldo disponível na Carteira (prêmios, créditos e ajustes, menos usos e saques). */
export async function saldoDeCredito(jogadorId: string) {
  return { total: await saldoDaCarteira(jogadorId) };
}

/** Paga o ingresso com crédito (sem Pix): confirma na hora. */
export async function pagarComCredito(
  _: EstadoInscricao,
  form: FormData,
): Promise<EstadoInscricao> {
  const slug = String(form.get("slug") ?? "");
  const caminho = `/eventos/${slug}/inscricao`;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?voltar=${encodeURIComponent(caminho)}`);
  if (form.get("aceite") !== "on")
    return { erro: "Confirme que leu as regras do ingresso." };

  const db = criarClienteAdmin();
  const { data: evento } = await db
    .from("eventos")
    .select(
      "id, titulo, status, formato, valor_centavos, vagas, inscricoes_ate",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!evento || evento.status !== "aberto")
    return { erro: "As inscrições deste evento não estão abertas." };
  if (
    evento.inscricoes_ate &&
    new Date(evento.inscricoes_ate).getTime() < Date.now()
  )
    return { erro: "O prazo de inscrição terminou." };
  if (evento.vagas) {
    const { count } = await db
      .from("inscricoes")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", evento.id)
      .eq("status", "confirmada");
    if ((count ?? 0) >= evento.vagas)
      return { erro: "As vagas deste evento esgotaram." };
  }
  let deck: Record<string, unknown> = {};
  if (ehConstruido(evento.formato)) {
    const r = await deckParaInscricao(
      user.id,
      String(form.get("deck_id") ?? ""),
      evento.formato,
    );
    if (r.erro) return { erro: r.erro };
    deck = r.dados!;
  }

  let valor = evento.valor_centavos;
  let cupom: { id: string; desconto: number } | null = null;
  const codigo = String(form.get("cupom") ?? "").trim();
  if (codigo) {
    const v = await validarCupom(codigo, evento, user.id);
    if ("erro" in v) return { erro: v.erro };
    cupom = { id: v.cupom.id, desconto: v.desconto };
    valor = v.final;
  }
  const { total: saldo } = await saldoDeCredito(user.id);
  if (saldo < valor)
    return { erro: "O saldo da sua Carteira não cobre este ingresso." };

  const { data: existente } = await db
    .from("inscricoes")
    .select("id, status")
    .eq("evento_id", evento.id)
    .eq("jogador_id", user.id)
    .maybeSingle();
  if (existente?.status === "confirmada") redirect(caminho);
  let inscricaoId = existente?.id as string | undefined;
  if (inscricaoId) {
    await db
      .from("pagamentos")
      .update({ status: "cancelado" })
      .eq("inscricao_id", inscricaoId)
      .eq("status", "pendente");
    await db
      .from("inscricoes")
      .update({ status: "aguardando_pagamento", cancelado_em: null, ...deck })
      .eq("id", inscricaoId);
  } else {
    const { data: nova } = await db
      .from("inscricoes")
      .insert({ evento_id: evento.id, jogador_id: user.id, ...deck })
      .select("id")
      .single();
    inscricaoId = nova?.id;
  }
  if (!inscricaoId) return { erro: "Não foi possível registrar o ingresso." };

  // Debita da Carteira
  if (valor > 0)
    await db.from("carteira_movimentos").insert({
      jogador_id: user.id,
      tipo: "ingresso",
      valor_centavos: -valor,
      descricao: `Ingresso · ${evento.titulo}`,
      inscricao_id: inscricaoId,
      concluido_em: new Date().toISOString(),
    });
  const { data: pag } = await db
    .from("pagamentos")
    .insert({
      inscricao_id: inscricaoId,
      provedor: "credito",
      valor_centavos: valor,
      status: "pendente",
      cupom_id: cupom?.id ?? null,
      desconto_centavos: cupom?.desconto ?? 0,
    })
    .select("id")
    .single();
  if (pag) await confirmarPagamento(pag.id, undefined, "credito");
  revalidatePath(caminho);
  redirect(caminho);
}

export type ResultadoCupom = {
  erro?: string;
  codigo?: string;
  rotulo?: string;
  desconto?: string;
  final?: number;
  finalTexto?: string;
};

/** Confere o cupom no checkout e devolve o novo total (a validação vale de novo na hora de pagar). */
export async function aplicarCupom(
  slug: string,
  codigo: string,
): Promise<ResultadoCupom> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };
  const { data: evento } = await criarClienteAdmin()
    .from("eventos")
    .select("id, formato, valor_centavos")
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) return { erro: "Evento não encontrado." };
  const v = await validarCupom(codigo, evento, user.id);
  if ("erro" in v) return { erro: v.erro };
  return {
    codigo: v.cupom.codigo,
    rotulo: descreverCupom(v.cupom),
    desconto: reais(v.desconto),
    final: v.final,
    finalTexto: reais(v.final),
  };
}
