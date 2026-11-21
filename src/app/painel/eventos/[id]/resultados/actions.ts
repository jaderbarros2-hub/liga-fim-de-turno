"use server";

import { revalidatePath } from "next/cache";
import {
  lerDistribuicao,
  premiosDoEvento,
  type LinhaResultado,
} from "@/lib/resultados";
import type { Partida } from "@/lib/partidas";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoResultados = { erro?: string; ok?: string };

async function exigirOrganizador() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data } = await supabase
    .from("jogadores")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.papel !== "organizador")
    throw new Error("Apenas o organizador pode fazer isso.");
  return user.id;
}

/** Grava a classificação, recalcula os prêmios e (opcionalmente) publica. */
export async function salvarResultados(
  _: EstadoResultados,
  form: FormData,
): Promise<EstadoResultados> {
  let ator: string;
  try {
    ator = await exigirOrganizador();
  } catch (e) {
    return { erro: (e as Error).message };
  }

  const eventoId = String(form.get("evento_id") ?? "");
  const publicar = form.get("publicar") === "sim";
  const distribuicao = lerDistribuicao(String(form.get("distribuicao") ?? ""));
  if (distribuicao === "invalida")
    return {
      erro: "A divisão personalizada precisa somar 100%. Ex.: 50/30/20. Deixe vazio para usar a regra da liga.",
    };

  let linhas: LinhaResultado[];
  try {
    linhas = JSON.parse(String(form.get("linhas") ?? "[]"));
  } catch {
    return { erro: "Classificação inválida." };
  }
  if (!linhas.length) return { erro: "Cole a classificação antes de salvar." };

  const db = criarClienteAdmin();
  const { data: evento } = await db
    .from("eventos")
    .select("id, slug, formato, valor_centavos, percentual_premio")
    .eq("id", eventoId)
    .single();
  if (!evento) return { erro: "Evento não encontrado." };

  // Não recalcula se algum prêmio já foi pago (evita pagar duas vezes)
  const { count: pagos } = await db
    .from("premios")
    .select("id", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .eq("status", "pago");
  if (pagos)
    return {
      erro: "Há prêmios já marcados como pagos neste evento; a classificação não pode mais ser alterada.",
    };

  const { count: confirmados } = await db
    .from("inscricoes")
    .select("id", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .eq("status", "confirmada");

  const total = Math.floor(
    ((evento.valor_centavos ?? 0) *
      (confirmados ?? 0) *
      evento.percentual_premio) /
      100,
  );
  const valores = premiosDoEvento(evento.formato, total, linhas, distribuicao);

  // Posições premiadas precisam estar ligadas a um jogador cadastrado (para saber a chave Pix)
  const semCadastro = linhas.filter((l, i) => valores[i] > 0 && !l.jogadorId);
  if (semCadastro.length)
    return {
      erro: `Associe um jogador cadastrado às posições premiadas: ${semCadastro.map((l) => `${l.posicao}º ${l.nick}`).join(", ")}.`,
    };
  const ids = linhas.map((l) => l.jogadorId).filter(Boolean);
  if (new Set(ids).size !== ids.length)
    return { erro: "O mesmo jogador aparece em mais de uma posição." };

  await db.from("resultados").delete().eq("evento_id", eventoId);
  const { error: erroRes } = await db.from("resultados").insert(
    linhas.map((l, i) => ({
      evento_id: eventoId,
      jogador_id: l.jogadorId,
      nick_endstep: l.nick,
      posicao: i + 1,
      pontos: l.pontos,
      vitorias: l.vitorias,
      empates: l.empates,
      derrotas: l.derrotas,
    })),
  );
  if (erroRes)
    return {
      erro: `Não foi possível gravar a classificação: ${erroRes.message}`,
    };

  // Rodadas (opcional): substitui o histórico de partidas do evento
  let partidas: Partida[] = [];
  try {
    partidas = JSON.parse(String(form.get("partidas") ?? "[]"));
  } catch {
    partidas = [];
  }
  await db.from("partidas").delete().eq("evento_id", eventoId);
  if (partidas.length) {
    const { error } = await db.from("partidas").insert(
      partidas.map((p) => ({
        evento_id: eventoId,
        rodada: p.rodada,
        fase: p.fase,
        rotulo: p.rotulo,
        mesa: p.mesa,
        jogador_a: p.jogadorA,
        jogador_b: p.jogadorB,
        jogador_a_id: p.jogadorAId,
        jogador_b_id: p.jogadorBId,
        vitorias_a: p.vitoriasA,
        vitorias_b: p.vitoriasB,
        empates: p.empates,
      })),
    );
    if (error)
      return {
        erro: `Classificação salva, mas as rodadas não: ${error.message}. Confira se a migração 0019 foi aplicada.`,
      };
  }

  await db.from("premios").delete().eq("evento_id", eventoId);
  const premios = valores
    .map((v, i) => ({
      evento_id: eventoId,
      jogador_id: linhas[i].jogadorId,
      posicao: i + 1,
      valor_centavos: v,
    }))
    .filter((p) => p.valor_centavos > 0);
  if (premios.length) {
    const { error } = await db.from("premios").insert(premios);
    if (error)
      return {
        erro: `Classificação salva, mas os prêmios não: ${error.message}`,
      };
  }

  await db
    .from("eventos")
    .update({
      distribuicao_premio: distribuicao,
      status: publicar ? "resultados" : "encerrado",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", eventoId);

  await db.from("registro_atividades").insert({
    ator_id: ator,
    acao: publicar ? "resultados_publicados" : "resultados_salvos",
    entidade: "eventos",
    entidade_id: eventoId,
    detalhes: {
      jogadores: linhas.length,
      partidas: partidas.length,
      premio_total: total,
    },
  });

  revalidatePath(`/painel/eventos/${eventoId}/resultados`);
  revalidatePath(`/eventos/${evento.slug}`);
  revalidatePath("/resultados");
  return {
    ok: publicar
      ? `Resultados publicados no site${partidas.length ? `, com ${partidas.length} partidas` : ""}.`
      : `Classificação salva${partidas.length ? ` com ${partidas.length} partidas` : ""} (ainda não publicada).`,
  };
}

/** Marca um prêmio como pago (Pix feito pelo organizador). */
export async function marcarPremioPago(form: FormData) {
  const ator = await exigirOrganizador();
  const premioId = String(form.get("premio_id"));
  const eventoId = String(form.get("evento_id"));
  const observacao = String(form.get("observacao") ?? "").trim() || null;
  const db = criarClienteAdmin();
  await db
    .from("premios")
    .update({ status: "pago", pago_em: new Date().toISOString(), observacao })
    .eq("id", premioId);
  await db.from("registro_atividades").insert({
    ator_id: ator,
    acao: "premio_pago",
    entidade: "premios",
    entidade_id: premioId,
  });
  revalidatePath(`/painel/eventos/${eventoId}/resultados`);
}

/** Libera os prêmios do evento na Carteira dos jogadores (uma vez por prêmio). */
export async function liberarPremiosNaCarteira(form: FormData) {
  const ator = await exigirOrganizador();
  const eventoId = String(form.get("evento_id"));
  const db = criarClienteAdmin();
  const { data: evento } = await db
    .from("eventos")
    .select("titulo")
    .eq("id", eventoId)
    .single();
  const { liberarPremios } = await import("@/lib/carteira");
  const n = await liberarPremios(eventoId, evento?.titulo ?? "Etapa");
  await db.from("registro_atividades").insert({
    ator_id: ator,
    acao: "premios_liberados",
    entidade: "eventos",
    entidade_id: eventoId,
    detalhes: { premios: n },
  });
  revalidatePath(`/painel/eventos/${eventoId}/resultados`);
}
