/**
 * Monta a lista de cartas para baixar artes em alta resolução com o MTG Art Downloader.
 * A busca é feita no Scryfall (só para saber nomes, coleções e artistas); as imagens
 * em si vêm do MTGPics pela ferramenta, no computador do organizador.
 */
import bancoJson from "./artes-banco.json";
import type { ArteBanco } from "./artes";

export type GrupoLista = "pauper" | "premodern" | "limited";

export type ItemLista = {
  carta: string;
  artista: string;
  set: string;
  colecao: string;
  numero: string;
  ano: string;
  grupo: GrupoLista;
};

type CartaScryfall = {
  name: string;
  artist?: string;
  set: string;
  set_name: string;
  collector_number: string;
  released_at: string;
  card_faces?: { name: string; artist?: string }[];
};

const API = "https://api.scryfall.com";
const CABECALHOS = {
  "User-Agent": "LigaFimDeTurno/1.0 (painel de artes)",
  Accept: "application/json",
};

async function buscarJson(url: string) {
  const r = await fetch(url, { headers: CABECALHOS, cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    throw new Error(j?.details ?? `Scryfall respondeu ${r.status}`);
  }
  return j;
}

/** Últimas coleções de expansão já lançadas (para o Limited). */
export async function ultimasColecoes(quantidade = 4): Promise<string[]> {
  const j = await buscarJson(`${API}/sets`);
  const hoje = new Date().toISOString().slice(0, 10);
  return (
    j.data as {
      code: string;
      set_type: string;
      released_at?: string;
      digital: boolean;
    }[]
  )
    .filter(
      (s) =>
        s.set_type === "expansion" &&
        !s.digital &&
        s.released_at &&
        s.released_at <= hoje,
    )
    .sort((a, b) => (b.released_at ?? "").localeCompare(a.released_at ?? ""))
    .slice(0, quantidade)
    .map((s) => s.code);
}

export function consultaDoGrupo(
  grupo: GrupoLista,
  opcoes: { colecoes?: string[]; soEpoca?: boolean; extra?: string },
) {
  const base = "-t:basic -is:digital -is:universesbeyond game:paper";
  const partes =
    grupo === "pauper"
      ? ["f:pauper", base]
      : grupo === "premodern"
        ? ["f:premodern", base, opcoes.soEpoca ? "date<=2003-07-30" : ""]
        : [
            `(${(opcoes.colecoes ?? []).map((c) => `e:${c}`).join(" or ")})`,
            "(r:rare or r:mythic or r:uncommon)",
            base,
          ];
  if (opcoes.extra?.trim()) partes.push(opcoes.extra.trim());
  return partes.filter(Boolean).join(" ");
}

/** Já no banco: mesma carta e mesmo artista (outra ilustração da carta ainda entra). */
function jaNoBanco() {
  const banco = bancoJson as ArteBanco[];
  return new Set(
    banco.map(
      (a) => `${(a.carta ?? "").toLowerCase()}|${a.artista.toLowerCase()}`,
    ),
  );
}

export async function montarLista(
  grupo: GrupoLista,
  quantidade: number,
  opcoes: { colecoes?: string[]; soEpoca?: boolean; extra?: string },
): Promise<{ consulta: string; itens: ItemLista[] }> {
  if (grupo === "limited" && !opcoes.colecoes?.length) {
    opcoes = { ...opcoes, colecoes: await ultimasColecoes() };
  }
  const consulta = consultaDoGrupo(grupo, opcoes);
  const existentes = jaNoBanco();
  const vistos = new Set<string>();
  const itens: ItemLista[] = [];
  let url: string | null =
    `${API}/cards/search?` +
    new URLSearchParams({
      q: consulta,
      unique: "art",
      order: grupo === "limited" ? "rarity" : "edhrec",
    });

  for (
    let pagina = 0;
    url && itens.length < quantidade && pagina < 8;
    pagina++
  ) {
    if (pagina) await new Promise((r) => setTimeout(r, 120));
    const j: { data: CartaScryfall[]; has_more: boolean; next_page?: string } =
      await buscarJson(url);
    for (const c of j.data) {
      const nome = c.card_faces?.[0]?.name ?? c.name;
      const artista = c.artist ?? c.card_faces?.[0]?.artist ?? "";
      const chave = `${nome.toLowerCase()}|${artista.toLowerCase()}`;
      if (!artista || existentes.has(chave) || vistos.has(chave)) continue;
      vistos.add(chave);
      itens.push({
        carta: nome,
        artista,
        set: c.set.toUpperCase(),
        colecao: c.set_name,
        numero: c.collector_number,
        ano: c.released_at.slice(0, 4),
        grupo,
      });
      if (itens.length >= quantidade) break;
    }
    url = j.has_more && j.next_page ? j.next_page : null;
  }
  return { consulta, itens };
}

/** Uma carta por linha, no formato aceito pelo MTG Art Downloader. */
export const textoCardsTxt = (itens: ItemLista[]) =>
  itens.map((i) => `${i.carta} (${i.set}) ${i.numero}`).join("\n") + "\n";
