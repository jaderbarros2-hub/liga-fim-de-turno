"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarPedidoPix, MINUTOS_PIX } from "@/lib/mercadopago";
import { sincronizarPagamento } from "@/lib/pagamentos";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoInscricao = { erro?: string };

const HORAS_CANCELAMENTO = 24;

/** Cria (ou reabre) a inscrição e gera um Pix novo. */
export async function gerarPix(_: EstadoInscricao, form: FormData): Promise<EstadoInscricao> {
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
  if (!jogador?.aceite_termos_em) redirect(`/cadastro?voltar=${encodeURIComponent(caminho)}`);

  const { data: evento } = await db
    .from("eventos")
    .select("id, titulo, status, valor_centavos, vagas, inscricoes_ate")
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) return { erro: "Evento não encontrado." };
  if (evento.status !== "aberto") return { erro: "As inscrições deste evento não estão abertas." };
  if (evento.inscricoes_ate && new Date(evento.inscricoes_ate).getTime() < Date.now())
    return { erro: "O prazo de inscrição deste evento já terminou." };

  if (evento.vagas) {
    const { count } = await db
      .from("inscricoes")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", evento.id)
      .eq("status", "confirmada");
    if ((count ?? 0) >= evento.vagas) return { erro: "As vagas deste evento esgotaram." };
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
      .update({ status: "aguardando_pagamento", cancelado_em: null })
      .eq("id", inscricaoId);
    // Pix antigo ainda pendente: verifica se foi pago antes de gerar outro
    const { data: pendentes } = await db
      .from("pagamentos")
      .select("id")
      .eq("inscricao_id", inscricaoId)
      .eq("status", "pendente");
    for (const p of pendentes ?? []) {
      if ((await sincronizarPagamento(p.id)) === "aprovado") redirect(`/eventos/${slug}`);
      await db.from("pagamentos").update({ status: "cancelado" }).eq("id", p.id).eq("status", "pendente");
    }
    await db.from("inscricoes").update({ status: "aguardando_pagamento" }).eq("id", inscricaoId);
  } else {
    const { data: nova, error } = await db
      .from("inscricoes")
      .insert({ evento_id: evento.id, jogador_id: jogador.id })
      .select("id")
      .single();
    if (error || !nova) return { erro: "Não foi possível registrar a inscrição. Tente de novo." };
    inscricaoId = nova.id;
  }

  const { data: pagamento, error: erroPag } = await db
    .from("pagamentos")
    .insert({
      inscricao_id: inscricaoId,
      valor_centavos: evento.valor_centavos,
      expira_em: new Date(Date.now() + MINUTOS_PIX * 60_000).toISOString(),
    })
    .select("id")
    .single();
  if (erroPag || !pagamento) return { erro: "Não foi possível iniciar o pagamento. Tente de novo." };

  try {
    const pedido = await criarPedidoPix({
      referencia: pagamento.id,
      valorCentavos: evento.valor_centavos,
      descricao: `Inscrição · ${evento.titulo}`.slice(0, 150),
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
    await db.from("pagamentos").update({ status: "cancelado" }).eq("id", pagamento.id);
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
  const { data: evento } = await db.from("eventos").select("id, inicio").eq("slug", slug).maybeSingle();
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
    await db.from("pagamentos").update({ status: "cancelado" }).eq("inscricao_id", insc.id).eq("status", "pendente");
    await db.from("inscricoes").update({ status: "cancelada", cancelado_em: agora }).eq("id", insc.id);
  } else if (insc.status === "confirmada") {
    const limite = new Date(evento.inicio).getTime() - HORAS_CANCELAMENTO * 3600_000;
    if (Date.now() > limite) redirect(`/eventos/${slug}?aviso=prazo`);
    const { data: pago } = await db
      .from("pagamentos")
      .select("valor_centavos")
      .eq("inscricao_id", insc.id)
      .eq("status", "aprovado")
      .maybeSingle();
    await db.from("inscricoes").update({ status: "cancelada", cancelado_em: agora }).eq("id", insc.id);
    if (pago) {
      await db.from("creditos_reembolsos").insert({
        jogador_id: user.id,
        inscricao_id: insc.id,
        tipo: "reembolso",
        valor_centavos: pago.valor_centavos,
      });
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
