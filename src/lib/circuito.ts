import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { supabaseConfigurado } from "@/lib/supabase/server";

/**
 * Regras do circuito da liga (valem para Pauper, Premodern e Limited, cada um com o seu circuito):
 * - 4 etapas por mês;
 * - a última etapa de cada trimestre é a Final do Trimestre, que define campeão e vice;
 * - em dezembro, o Player of the Year (top 8) reúne os 4 campeões e os 4 vices trimestrais.
 *   Se alguém se classificar duas vezes, a vaga passa ao melhor do ranking anual ainda fora.
 */
export const ETAPAS_POR_MES = 4;
export const VAGAS_POTY = 8;
const FUSO_OFFSET = "-03:00";

export const TABELA_PONTOS = [
  { faixa: "1º lugar", pontos: 10 },
  { faixa: "2º lugar", pontos: 8 },
  { faixa: "3º e 4º", pontos: 6 },
  { faixa: "5º ao 8º", pontos: 4 },
  { faixa: "Participação", pontos: 1 },
];

export function pontosPorPosicao(posicao: number) {
  if (posicao === 1) return 10;
  if (posicao === 2) return 8;
  if (posicao <= 4) return 6;
  if (posicao <= 8) return 4;
  return 1;
}

export const NOMES_TIPO: Record<string, string> = {
  etapa: "Etapa",
  final_trimestre: "Final do Trimestre",
  player_of_the_year: "Player of the Year",
};

export const TRIMESTRES = [
  { n: 1, nome: "1º trimestre", meses: "Jan · Fev · Mar" },
  { n: 2, nome: "2º trimestre", meses: "Abr · Mai · Jun" },
  { n: 3, nome: "3º trimestre", meses: "Jul · Ago · Set" },
  { n: 4, nome: "4º trimestre", meses: "Out · Nov · Dez" },
];

/** Temporada e trimestre de uma data, no horário de Brasília. */
export function periodo(iso: string) {
  const d = new Date(new Date(iso).getTime() - 3 * 3600e3);
  const mes = d.getUTCMonth() + 1;
  return { temporada: d.getUTCFullYear(), mes, trimestre: Math.ceil(mes / 3) };
}

function limites(temporada: number, trimestre?: number) {
  const ini = trimestre ? (trimestre - 1) * 3 + 1 : 1;
  const fim = trimestre ? trimestre * 3 : 12;
  const de = new Date(
    `${temporada}-${String(ini).padStart(2, "0")}-01T00:00:00${FUSO_OFFSET}`,
  );
  const ate =
    fim === 12
      ? new Date(`${temporada + 1}-01-01T00:00:00${FUSO_OFFSET}`)
      : new Date(
          `${temporada}-${String(fim + 1).padStart(2, "0")}-01T00:00:00${FUSO_OFFSET}`,
        );
  return { de: de.toISOString(), ate: ate.toISOString() };
}

export type EventoCircuito = {
  id: string;
  slug: string;
  titulo: string;
  inicio: string;
  tipo: "etapa" | "final_trimestre" | "player_of_the_year";
  status: string;
  formato: string;
};

export type Resultado = {
  evento_id: string;
  jogador_id: string | null;
  nick_endstep: string;
  posicao: number;
  vitorias: number;
  empates: number;
  derrotas: number;
};

export type Jogador = {
  chave: string;
  id: string | null;
  nick: string;
  avatar: string | null;
};

export type LinhaRanking = Jogador & {
  posicao: number;
  pontos: number;
  etapas: number;
  vitorias: number;
  derrotas: number;
  empates: number;
  top8: number;
  titulos: number;
  melhor: number;
};

async function idDaLiga(slug: string) {
  const { data } = await criarClienteAdmin()
    .from("ligas")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return (data?.id as number | undefined) ?? null;
}

/** Eventos da liga num período (todos os status visíveis). */
export async function eventosDoPeriodo(
  ligaSlug: string,
  temporada: number,
  trimestre?: number,
): Promise<EventoCircuito[]> {
  if (!supabaseConfigurado()) return [];
  const ligaId = await idDaLiga(ligaSlug);
  if (!ligaId) return [];
  const { de, ate } = limites(temporada, trimestre);
  const { data } = await criarClienteAdmin()
    .from("eventos")
    .select("id, slug, titulo, inicio, tipo, status, formato")
    .eq("liga_id", ligaId)
    .gte("inicio", de)
    .lt("inicio", ate)
    .not("status", "in", "(rascunho,cancelado)")
    .order("inicio");
  return (data as EventoCircuito[] | null) ?? [];
}

async function resultadosDe(eventos: EventoCircuito[]) {
  const ids = eventos.filter((e) => e.status === "resultados").map((e) => e.id);
  if (!ids.length)
    return {
      resultados: [] as Resultado[],
      jogadores: new Map<string, { nick: string; avatar: string | null }>(),
    };
  const db = criarClienteAdmin();
  const resultados: Resultado[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await db
      .from("resultados")
      .select(
        "evento_id, jogador_id, nick_endstep, posicao, vitorias, empates, derrotas",
      )
      .in("evento_id", ids.slice(i, i + 100));
    resultados.push(...((data as Resultado[] | null) ?? []));
  }
  const idsJog = [
    ...new Set(resultados.map((r) => r.jogador_id).filter(Boolean)),
  ] as string[];
  const jogadores = new Map<string, { nick: string; avatar: string | null }>();
  for (let i = 0; i < idsJog.length; i += 200) {
    const { data } = await db
      .from("jogadores_publico")
      .select("id, nick_endstep, discord_nome, avatar_url")
      .in("id", idsJog.slice(i, i + 200));
    for (const j of data ?? [])
      jogadores.set(j.id, {
        nick: j.nick_endstep || j.discord_nome || "Jogador",
        avatar: j.avatar_url,
      });
  }
  return { resultados, jogadores };
}

const chaveDe = (r: Resultado) =>
  r.jogador_id ?? `nick:${r.nick_endstep.toLowerCase()}`;

function jogadorDe(
  r: Resultado,
  jogadores: Map<string, { nick: string; avatar: string | null }>,
): Jogador {
  const j = r.jogador_id ? jogadores.get(r.jogador_id) : undefined;
  return {
    chave: chaveDe(r),
    id: r.jogador_id,
    nick: j?.nick ?? r.nick_endstep,
    avatar: j?.avatar ?? null,
  };
}

/** Ranking por pontos: etapas e Finais do Trimestre contam; o Player of the Year não. */
export async function ranking(
  ligaSlug: string,
  temporada: number,
  trimestre?: number,
): Promise<LinhaRanking[]> {
  const eventos = (
    await eventosDoPeriodo(ligaSlug, temporada, trimestre)
  ).filter((e) => e.tipo !== "player_of_the_year");
  const { resultados, jogadores } = await resultadosDe(eventos);
  const tabela = new Map<string, LinhaRanking>();
  for (const r of resultados) {
    const k = chaveDe(r);
    const l =
      tabela.get(k) ??
      ({
        ...jogadorDe(r, jogadores),
        posicao: 0,
        pontos: 0,
        etapas: 0,
        vitorias: 0,
        derrotas: 0,
        empates: 0,
        top8: 0,
        titulos: 0,
        melhor: 999,
      } as LinhaRanking);
    l.pontos += pontosPorPosicao(r.posicao);
    l.etapas += 1;
    l.vitorias += r.vitorias;
    l.derrotas += r.derrotas;
    l.empates += r.empates;
    if (r.posicao <= 8) l.top8 += 1;
    if (r.posicao === 1) l.titulos += 1;
    l.melhor = Math.min(l.melhor, r.posicao);
    tabela.set(k, l);
  }
  const linhas = [...tabela.values()].sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.titulos - a.titulos ||
      b.top8 - a.top8 ||
      b.vitorias - a.vitorias ||
      a.nick.localeCompare(b.nick),
  );
  linhas.forEach((l, i) => {
    const anterior = linhas[i - 1];
    l.posicao =
      anterior &&
      anterior.pontos === l.pontos &&
      anterior.titulos === l.titulos &&
      anterior.top8 === l.top8 &&
      anterior.vitorias === l.vitorias
        ? anterior.posicao
        : i + 1;
  });
  return linhas;
}

export type Final = {
  trimestre: number;
  evento: EventoCircuito | null;
  campeao: Jogador | null;
  vice: Jogador | null;
};

/** Finais do Trimestre da temporada, com campeão e vice quando já houver resultado. */
export async function finaisDaTemporada(
  ligaSlug: string,
  temporada: number,
): Promise<Final[]> {
  const eventos = await eventosDoPeriodo(ligaSlug, temporada);
  const finais = eventos.filter((e) => e.tipo === "final_trimestre");
  const { resultados, jogadores } = await resultadosDe(finais);
  return TRIMESTRES.map(({ n }) => {
    const evento =
      finais.filter((e) => periodo(e.inicio).trimestre === n).at(-1) ?? null;
    const doEvento = evento
      ? resultados.filter((r) => r.evento_id === evento.id)
      : [];
    const p = (pos: number) => {
      const r = doEvento.find((x) => x.posicao === pos);
      return r ? jogadorDe(r, jogadores) : null;
    };
    return { trimestre: n, evento, campeao: p(1), vice: p(2) };
  });
}

export type Classificado = Jogador & { motivo: string };

/** Top 8 do Player of the Year: campeões, vices e, para vagas repetidas, o ranking anual. */
export async function classificadosPOTY(ligaSlug: string, temporada: number) {
  const [finais, anual] = await Promise.all([
    finaisDaTemporada(ligaSlug, temporada),
    ranking(ligaSlug, temporada),
  ]);
  const vagas: Classificado[] = [];
  const ja = new Set<string>();
  const adicionar = (j: Jogador | null, motivo: string) => {
    if (!j || ja.has(j.chave) || vagas.length >= VAGAS_POTY) return;
    ja.add(j.chave);
    vagas.push({ ...j, motivo });
  };
  for (const f of finais) adicionar(f.campeao, `Campeão T${f.trimestre}`);
  for (const f of finais) adicionar(f.vice, `Vice T${f.trimestre}`);
  const finaisDefinidas = finais.filter((f) => f.campeao).length;
  // Vagas de quem se classificou duas vezes só passam ao ranking quando as 4 finais já aconteceram
  if (finaisDefinidas === 4)
    for (const l of anual) adicionar(l, `Ranking anual (${l.posicao}º)`);
  return { vagas, abertas: VAGAS_POTY - vagas.length, finais, anual };
}

/** Temporadas com eventos (para o seletor do ranking). */
export async function temporadasDisponiveis(): Promise<number[]> {
  if (!supabaseConfigurado()) return [new Date().getFullYear()];
  const { data } = await criarClienteAdmin()
    .from("eventos")
    .select("inicio")
    .not("status", "in", "(rascunho,cancelado)");
  const anos = new Set((data ?? []).map((e) => periodo(e.inicio).temporada));
  anos.add(periodo(new Date().toISOString()).temporada);
  return [...anos].sort((a, b) => b - a);
}
