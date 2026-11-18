import "server-only";
import { regraPauper } from "@/lib/resultados";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Regras da Carteira:
 * - Saque mínimo = prêmio do campeão numa etapa padrão com o mínimo de jogadores
 *   (ingresso padrão × mínimo de jogadores × % do prêmio × fatia do 1º lugar).
 * - Saldo parado há 30 dias vira saque automático (sem mínimo).
 * - Reembolso de ingresso cancelado não respeita o mínimo.
 */
export const INGRESSO_PADRAO = 1500;
export const MINIMO_JOGADORES = 8;
export const PERCENTUAL_PREMIO = 80;
export const DIAS_SAQUE_AUTOMATICO = 30;
export const SAQUE_MINIMO = Math.round((INGRESSO_PADRAO * MINIMO_JOGADORES * (PERCENTUAL_PREMIO / 100) * regraPauper(MINIMO_JOGADORES)[0]) / 100);

export type Movimento = {
  id: string;
  tipo: "premio" | "credito" | "ajuste" | "ingresso" | "saque" | "envio_loja";
  valor_centavos: number;
  status: "concluido" | "pendente" | "cancelado";
  descricao: string | null;
  automatico: boolean;
  codigo_loja: string | null;
  concluido_em: string | null;
  criado_em: string;
  parceiro: { nome: string } | null;
};

export const NOMES_MOVIMENTO: Record<Movimento["tipo"], string> = {
  premio: "Prêmio",
  credito: "Crédito",
  ajuste: "Ajuste",
  ingresso: "Ingresso",
  saque: "Saque por Pix",
  envio_loja: "Envio para loja",
};

export async function saldoDaCarteira(jogadorId: string) {
  const { data } = await criarClienteAdmin().rpc("saldo_carteira", { p_jogador: jogadorId });
  return (data as number | null) ?? 0;
}

export async function movimentosDaCarteira(jogadorId: string): Promise<Movimento[]> {
  const { data } = await criarClienteAdmin()
    .from("carteira_movimentos")
    .select("id, tipo, valor_centavos, status, descricao, automatico, codigo_loja, concluido_em, criado_em, parceiro:parceiros(nome)")
    .eq("jogador_id", jogadorId)
    .order("criado_em", { ascending: false });
  return (data as unknown as Movimento[]) ?? [];
}

/** Credita na carteira os prêmios de um evento (uma vez por prêmio). */
export async function liberarPremios(eventoId: string, titulo: string) {
  const db = criarClienteAdmin();
  const { data: premios } = await db.from("premios").select("id, jogador_id, valor_centavos, posicao").eq("evento_id", eventoId).neq("status", "pago");
  const agora = new Date().toISOString();
  for (const p of premios ?? []) {
    if (!p.valor_centavos) continue;
    const { error } = await db.from("carteira_movimentos").insert({
      jogador_id: p.jogador_id,
      tipo: "premio",
      valor_centavos: p.valor_centavos,
      descricao: `${p.posicao ? `${p.posicao}º lugar · ` : ""}${titulo}`,
      premio_id: p.id,
      concluido_em: agora,
    });
    if (!error || error.code === "23505") await db.from("premios").update({ status: "pago", pago_em: agora, observacao: "Creditado na Carteira" }).eq("id", p.id);
  }
  return (premios ?? []).length;
}
