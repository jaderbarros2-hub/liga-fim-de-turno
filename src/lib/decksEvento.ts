import "server-only";
import type { ItemLista } from "@/lib/decklist";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/** Quantas listas ficam públicas depois do resultado (decisão da organização). */
export const TOP_PUBLICO = 8;

export type DeckDoEvento = {
  posicao: number;
  nick: string;
  deckNome: string | null;
  arquetipo: string | null;
  temLista: boolean;
  principal: ItemLista[] | null;
  sideboard: ItemLista[] | null;
};

/**
 * Arquétipo de cada posição da classificação (público depois do resultado, alimenta o metagame).
 * A lista de cartas só vem para o top 8.
 */
export async function decksDaClassificacao(eventoId: string, comListas = false): Promise<DeckDoEvento[]> {
  const db = criarClienteAdmin();
  const { data: evento } = await db.from("eventos").select("status").eq("id", eventoId).single();
  if (evento?.status !== "resultados") return [];

  const [{ data: resultados }, { data: inscricoes }] = await Promise.all([
    db.from("resultados").select("posicao, nick_endstep, jogador_id").eq("evento_id", eventoId).order("posicao"),
    db
      .from("inscricoes")
      .select("jogador_id, deck_nome, deck_principal, deck_sideboard, arquetipo:arquetipos(nome)")
      .eq("evento_id", eventoId)
      .eq("status", "confirmada"),
  ]);
  type Insc = {
    jogador_id: string;
    deck_nome: string | null;
    deck_principal: ItemLista[] | null;
    deck_sideboard: ItemLista[] | null;
    arquetipo: { nome: string } | null;
  };
  const porJogador = new Map(((inscricoes as unknown as Insc[]) ?? []).map((i) => [i.jogador_id, i]));

  return (resultados ?? []).map((r) => {
    const i = r.jogador_id ? porJogador.get(r.jogador_id) : undefined;
    const publica = comListas && r.posicao <= TOP_PUBLICO;
    return {
      posicao: r.posicao,
      nick: r.nick_endstep,
      deckNome: i?.deck_nome ?? null,
      arquetipo: i?.arquetipo?.nome ?? null,
      temLista: Boolean(i?.deck_principal?.length),
      principal: publica ? (i?.deck_principal ?? null) : null,
      sideboard: publica ? (i?.deck_sideboard ?? null) : null,
    };
  });
}
