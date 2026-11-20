/**
 * Monta a lista de cartas para baixar artes em alta resolução com o MTG Art Downloader.
 * A busca é feita no Scryfall (só para saber nomes, coleções e artistas); as imagens
 * em si vêm do MTGPics pela ferramenta, no computador do organizador.
 */
import bancoJson from "./artes-banco.json";
import type { ArteBanco } from "./artes";
import { STAPLES } from "./staples";

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

/** Impressões que não servem: Secret Lair, promos, Universes Beyond, digitais, coleções de brincadeira. */
const SEM_ESPECIAIS =
  "-t:basic -is:digital -is:universesbeyond -is:promo -st:box -st:promo -st:funny -st:memorabilia -st:masterpiece -st:token game:paper" +
  // The List, Mystery Booster e Jumpstart: reimpressões com numeração própria que o MTGPics não acha.
  " -e:plst -e:mb1 -e:mb2 -e:fmb1 -e:j22 -e:j25 -e:jmp" +
  // Só coleções "de verdade" (básicas, expansões, masters, draft especiais e Commander).
  " (st:core or st:expansion or st:masters or st:draft_innovation or st:commander)";

/** Já no banco: mesma carta (uma ilustração por carta). */
function cartasNoBanco() {
  const banco = bancoJson as ArteBanco[];
  return new Set(banco.map((a) => (a.carta ?? "").toLowerCase()));
}

const aspas = (nome: string) => `!"${nome.replace(/"/g, "")}"`;

/**
 * Pauper e Premodern: as cartas mais jogadas do formato (lista em staples.ts).
 * Limited: raras e míticas das últimas coleções.
 * Uma ilustração por carta: a impressão normal mais recente (maior chance de arte em alta no MTGPics).
 */
export async function montarLista(
  grupo: GrupoLista,
  quantidade: number,
  opcoes: { colecoes?: string[]; soEpoca?: boolean; extra?: string },
): Promise<{ consulta: string; itens: ItemLista[] }> {
  const noBanco = cartasNoBanco();
  const consultas: string[] = [];
  const extra = opcoes.extra?.trim() ?? "";

  if (grupo === "limited") {
    const colecoes = opcoes.colecoes?.length
      ? opcoes.colecoes
      : await ultimasColecoes();
    consultas.push(
      [
        `(${colecoes.map((c) => `e:${c}`).join(" or ")})`,
        "(r:rare or r:mythic)",
        SEM_ESPECIAIS,
        extra,
      ]
        .filter(Boolean)
        .join(" "),
    );
  } else {
    const nomes = STAPLES[grupo]
      .filter((n) => !noBanco.has(n.toLowerCase()))
      .slice(0, quantidade);
    const epoca =
      grupo === "premodern" && opcoes.soEpoca ? "date<=2003-07-30" : "";
    for (let k = 0; k < nomes.length; k += 20) {
      consultas.push(
        [
          `(${nomes
            .slice(k, k + 20)
            .map(aspas)
            .join(" or ")})`,
          SEM_ESPECIAIS,
          epoca,
          extra,
        ]
          .filter(Boolean)
          .join(" "),
      );
    }
  }

  const porCarta = new Map<string, ItemLista>();
  for (const [n, q] of consultas.entries()) {
    let url: string | null =
      `${API}/cards/search?` +
      new URLSearchParams({
        q: `${q} prefer:newest`,
        unique: "cards",
        order: grupo === "limited" ? "rarity" : "name",
      });
    for (let pagina = 0; url && pagina < 4; pagina++) {
      if (n || pagina) await new Promise((r) => setTimeout(r, 120));
      const j: {
        data: CartaScryfall[];
        has_more: boolean;
        next_page?: string;
      } = await buscarJson(url);
      for (const c of j.data) {
        const nome = c.card_faces?.[0]?.name ?? c.name;
        const artista = c.artist ?? c.card_faces?.[0]?.artist ?? "";
        // A busca por nome exato também acha cartas de duas faces com a staple no verso: ignora.
        if (
          grupo !== "limited" &&
          !STAPLES[grupo].some((x) => x.toLowerCase() === nome.toLowerCase())
        )
          continue;
        if (
          !artista ||
          noBanco.has(nome.toLowerCase()) ||
          porCarta.has(nome.toLowerCase())
        )
          continue;
        porCarta.set(nome.toLowerCase(), {
          carta: nome,
          artista,
          set: c.set.toUpperCase(),
          colecao: c.set_name,
          numero: c.collector_number,
          ano: c.released_at.slice(0, 4),
          grupo,
        });
      }
      url = j.has_more && j.next_page ? j.next_page : null;
    }
  }

  // Mantém a ordem de popularidade da lista de staples.
  const ordem =
    grupo === "limited" ? null : STAPLES[grupo].map((x) => x.toLowerCase());
  const itens = [...porCarta.values()];
  if (ordem)
    itens.sort(
      (a, b) =>
        ordem.indexOf(a.carta.toLowerCase()) -
        ordem.indexOf(b.carta.toLowerCase()),
    );
  return { consulta: consultas.join("\n"), itens: itens.slice(0, quantidade) };
}

/** Uma carta por linha, no formato aceito pelo MTG Art Downloader. */
export const textoCardsTxt = (itens: ItemLista[]) =>
  itens.map((i) => `${i.carta} (${i.set}) ${i.numero}`).join("\n") + "\n";
