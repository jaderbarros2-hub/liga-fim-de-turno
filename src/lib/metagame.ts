import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { supabaseConfigurado } from "@/lib/supabase/server";

export type FatiaMetagame = {
  arquetipo: string;
  decks: number;
  percentual: number;
  top8: number;
  titulos: number;
};

export type Campeao = {
  evento: {
    slug: string;
    titulo: string;
    inicio: string;
    tipo: string;
    formato: string;
    colecao: string | null;
  };
  nick: string;
  arquetipo: string | null;
  temLista: boolean;
};

async function eventosComResultado(ligaSlug: string, limite: number) {
  const db = criarClienteAdmin();
  const { data: liga } = await db
    .from("ligas")
    .select("id")
    .eq("slug", ligaSlug)
    .maybeSingle();
  if (!liga) return [];
  const { data } = await db
    .from("eventos")
    .select("id, slug, titulo, inicio, tipo, formato, colecao")
    .eq("liga_id", liga.id)
    .eq("status", "resultados")
    .order("inicio", { ascending: false })
    .limit(limite);
  return data ?? [];
}

/** Participação e desempenho de cada arquétipo nas últimas etapas com resultado. */
export async function metagame(
  ligaSlug: string,
  ultimasEtapas = 12,
): Promise<{ fatias: FatiaMetagame[]; etapas: number; decks: number }> {
  if (!supabaseConfigurado()) return { fatias: [], etapas: 0, decks: 0 };
  const eventos = await eventosComResultado(ligaSlug, ultimasEtapas);
  if (!eventos.length) return { fatias: [], etapas: 0, decks: 0 };
  const ids = eventos.map((e) => e.id);
  const db = criarClienteAdmin();
  const [{ data: insc }, { data: res }] = await Promise.all([
    db
      .from("inscricoes")
      .select("evento_id, jogador_id, arquetipo:arquetipos(nome)")
      .in("evento_id", ids)
      .eq("status", "confirmada"),
    db
      .from("resultados")
      .select("evento_id, jogador_id, posicao")
      .in("evento_id", ids),
  ]);
  const posicao = new Map(
    (res ?? []).map((r) => [
      `${r.evento_id}:${r.jogador_id}`,
      r.posicao as number,
    ]),
  );
  const mapa = new Map<string, FatiaMetagame>();
  let total = 0;
  for (const i of (insc as unknown as {
    evento_id: string;
    jogador_id: string;
    arquetipo: { nome: string } | null;
  }[]) ?? []) {
    if (!i.arquetipo) continue;
    total++;
    const f = mapa.get(i.arquetipo.nome) ?? {
      arquetipo: i.arquetipo.nome,
      decks: 0,
      percentual: 0,
      top8: 0,
      titulos: 0,
    };
    f.decks++;
    const p = posicao.get(`${i.evento_id}:${i.jogador_id}`);
    if (p && p <= 8) f.top8++;
    if (p === 1) f.titulos++;
    mapa.set(f.arquetipo, f);
  }
  const fatias = [...mapa.values()]
    .map((f) => ({
      ...f,
      percentual: total ? Math.round((f.decks / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.decks - a.decks || b.titulos - a.titulos);
  return { fatias, etapas: eventos.length, decks: total };
}

/** Vencedores das últimas etapas, com o arquétipo usado. */
export async function ultimosCampeoes(
  ligaSlug: string,
  limite = 6,
): Promise<Campeao[]> {
  if (!supabaseConfigurado()) return [];
  const eventos = await eventosComResultado(ligaSlug, limite);
  if (!eventos.length) return [];
  const db = criarClienteAdmin();
  const ids = eventos.map((e) => e.id);
  const { data: res } = await db
    .from("resultados")
    .select("evento_id, jogador_id, nick_endstep")
    .in("evento_id", ids)
    .eq("posicao", 1);
  const jogs = (res ?? []).map((r) => r.jogador_id).filter(Boolean) as string[];
  const { data: insc } = jogs.length
    ? await db
        .from("inscricoes")
        .select(
          "evento_id, jogador_id, deck_principal, arquetipo:arquetipos(nome)",
        )
        .in("evento_id", ids)
        .in("jogador_id", jogs)
    : { data: [] };
  const deck = new Map(
    (
      (insc as unknown as {
        evento_id: string;
        jogador_id: string;
        deck_principal: unknown[] | null;
        arquetipo: { nome: string } | null;
      }[]) ?? []
    ).map((i) => [`${i.evento_id}:${i.jogador_id}`, i]),
  );
  return eventos
    .map((e) => {
      const r = (res ?? []).find((x) => x.evento_id === e.id);
      if (!r) return null;
      const d = deck.get(`${e.id}:${r.jogador_id}`);
      return {
        evento: e,
        nick: r.nick_endstep,
        arquetipo: d?.arquetipo?.nome ?? null,
        temLista: Boolean(d?.deck_principal?.length),
      };
    })
    .filter(Boolean) as Campeao[];
}
