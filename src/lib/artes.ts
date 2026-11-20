/**
 * Artes de cartas usadas no visual do site (imagens do Scryfall).
 * Regras: não cortar nome do artista/copyright das cartas inteiras; ao usar só a
 * ilustração (art_crop), mostrar o crédito do artista na mesma tela.
 * Só artes de Magic: nada de versões de outras franquias (Marvel, Star Trek etc.).
 * Ao trocar uma arte, confira no Scryfall se a impressão não é "Universes Beyond".
 */

import bancoJson from "./artes-banco.json";

export type Arte = { carta: string; artista: string; caminho: string };

const BASE = "https://cards.scryfall.io";

export const ilustracao = (a: Arte) => `${BASE}/art_crop/front/${a.caminho}`;
export const cartaInteira = (a: Arte, tamanho: "normal" | "large" = "large") =>
  `${BASE}/${tamanho}/front/${a.caminho}`;
export const credito = (a: Arte) => `${a.carta} · arte de ${a.artista}`;

export const ARTES = {
  counterspell: {
    carta: "Counterspell",
    artista: "Zack Stella",
    caminho: "4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.jpg?1783909630",
  },
  ninja: {
    carta: "Ninja of the Deep Hours",
    artista: "Randy Vargas",
    caminho: "f/b/fb245a12-4cbd-4291-af67-f3677ca822dc.jpg?1783908836",
  },
  korSkyfisher: {
    carta: "Kor Skyfisher",
    artista: "Dan Murayama Scott",
    caminho: "d/7/d7501662-1216-4e08-bd2b-e0a459057942.jpg?1783936681",
  },
  augur: {
    carta: "Augur of Bolas",
    artista: "Alex Konstad",
    caminho: "9/3/934b4a7a-f42f-401b-8411-5ecb26bafe01.jpg?1783908779",
  },
  faerieSeer: {
    carta: "Faerie Seer",
    artista: "Eelis Kyttanen",
    caminho: "f/0/f0b96dc7-d046-4b64-b3a8-8bf5ac7c8f9b.jpg?1783908836",
  },
  spellstutter: {
    carta: "Spellstutter Sprite",
    artista: "Rebecca Guay",
    caminho: "3/8/3899605d-2203-4ab6-9ff5-69490382eea4.jpg?1783939994",
  },
  galvanicBlast: {
    carta: "Galvanic Blast",
    artista: "Marc Simonetti",
    caminho: "0/c/0cf8cb1e-314a-4894-82df-f9812825f52e.jpg?1783930164",
  },
  gurmag: {
    carta: "Gurmag Angler",
    artista: "YW Tang",
    caminho: "c/e/cedd44eb-f381-46e1-bcb0-88416b4ce33d.jpg?1783933821",
  },
  thorn: {
    carta: "Thorn of the Black Rose",
    artista: "David Gaillet",
    caminho: "b/4/b4b266e2-1cad-40df-bc0e-3e1464b299b3.jpg?1783915664",
  },
  packRat: {
    carta: "Pack Rat",
    artista: "Kev Walker",
    caminho: "1/7/170693f5-13db-4191-99b1-e527ffb5b88e.jpg?1783940361",
  },
  ponder: {
    carta: "Ponder",
    artista: "Dan Murayama Scott",
    caminho: "3/c/3c02b8ee-84cb-44cb-ba14-9e725a9d03ee.jpg?1783942390",
  },
  battleScreech: {
    carta: "Battle Screech",
    artista: "Anastasia Ovchinnikova",
    caminho: "9/0/90301f8c-f7af-4179-8faf-9901931bba8d.jpg?1783915727",
  },
  chainer: {
    carta: "Chainer's Edict",
    artista: "Mark Zug",
    caminho: "a/1/a1d194d7-dccf-4421-be8f-8efdcf9fbbeb.jpg?1793456741",
  },
  swiftspear: {
    carta: "Monastery Swiftspear",
    artista: "Gabor Szikszai",
    caminho: "d/6/d6bfa227-4309-40ed-952c-279595eab17e.jpg?1783920066",
  },
  llanowar: {
    carta: "Llanowar Elves",
    artista: "Kev Walker",
    caminho: "6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg?1783909057",
  },
} satisfies Record<string, Arte>;

/** Arte de cada liga (cartões de evento, páginas da liga). */
export const ARTE_LIGA: Record<string, Arte> = {
  pauper: ARTES.ninja,
  limited: ARTES.korSkyfisher,
};

/** Cartas espalhadas na faixa da comunidade. */
export const CARTAS_FAIXA: Arte[] = [
  ARTES.faerieSeer,
  ARTES.galvanicBlast,
  ARTES.gurmag,
  ARTES.augur,
  ARTES.battleScreech,
  ARTES.chainer,
  ARTES.swiftspear,
  ARTES.thorn,
  ARTES.ponder,
];

/* =====================================================================
 * Banco de artes em alta resolução (arquivos em /public/artes).
 * Fonte: MTGPics (via MTG Art Downloader), artigos da Wizards e Art of MtG.
 * Para adicionar: Painel → Artes gera a lista; depois rode scripts/importar_artes.py
 * (converte para WebP em public/artes, gera o JPG de e-mail e grava o crédito).
 * ===================================================================== */

/** Grupos do banco: cada liga usa o seu; "geral" serve de reserva e para banners do site. */
export type GrupoArte = "pauper" | "premodern" | "limited" | "geral";

export type ArteBanco = {
  arquivo: string;
  carta: string | null;
  artista: string;
  colecao?: string;
  grupo: GrupoArte;
  largura: number;
  altura: number;
  /** Ponto de foco do recorte (CSS object-position). */
  foco?: string;
  /** Imagem externa (ilustração do Scryfall, para espaços pequenos). Sem isso, usa /artes/<arquivo>.webp. */
  url?: string;
  /** Imagem da carta inteira (Scryfall), quando disponível. */
  cartaUrl?: string;
};

export const BANCO: ArteBanco[] = bancoJson as ArteBanco[];

export const srcArte = (a: ArteBanco) => a.url ?? `/artes/${a.arquivo}.webp`;
export const creditoArte = (a: ArteBanco) =>
  `${a.carta ? `${a.carta} · ` : ""}ilustração de ${a.artista} · © Wizards of the Coast`;

/** Abaixo disso, a liga completa com as artes gerais para não repetir demais. */
const MINIMO_POR_GRUPO = 8;

/**
 * Cada liga usa as artes do próprio grupo. "geral" (banners do site) usa o banco todo.
 * Pauper fica só com cartas legais no Pauper; as outras completam com o grupo geral se faltar.
 */
function pool(grupo: GrupoArte, minLargura = 0) {
  const filtrar = (largura: number) => {
    const base = BANCO.filter((a) => a.largura >= largura);
    // Geral (banners) e Limited (formato variado) usam o banco todo
    if (grupo === "geral" || grupo === "limited") return base;
    const proprias = base.filter((a) => a.grupo === grupo);
    if (grupo === "pauper" || proprias.length >= MINIMO_POR_GRUPO)
      return proprias;
    const comGerais = [...proprias, ...base.filter((a) => a.grupo === "geral")];
    return comGerais.length >= MINIMO_POR_GRUPO ? comGerais : base;
  };
  for (const lista of [filtrar(minLargura), filtrar(0)])
    if (lista.length) return lista;
  return BANCO;
}

/** Grupo de arte de um evento a partir do formato (draft, selado e cubo são Limited). */
export const grupoDoFormato = (formato: string): GrupoArte =>
  formato === "pauper"
    ? "pauper"
    : formato === "premodern"
      ? "premodern"
      : "limited";

export function hash(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++)
    h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return Math.abs(h);
}

/** Arte fixa por chave (ex.: id de um artigo), dentro do grupo do formato. */
export function arteFixa(chave: string, grupo: GrupoArte): ArteBanco {
  const lista = pool(grupo);
  return lista[hash(chave) % lista.length];
}

/** Arte fixa para um evento (sempre a mesma para aquela etapa, diferente entre etapas). */
export function arteDoEvento(evento: {
  id: string;
  liga: { slug: string };
  formato?: string;
}): ArteBanco {
  const lista = pool(grupoDoFormato(evento.formato ?? evento.liga.slug));
  return lista[hash(evento.id) % lista.length];
}

/** Sorteio a cada visita. `grande` exige imagens largas (1700 px ou mais) o bastante para o topo da página. */
export function sortearArtes(
  grupo: GrupoArte,
  quantidade: number,
  grande = false,
): ArteBanco[] {
  const lista = [...pool(grupo, grande ? 1700 : 0)];
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  const saida: ArteBanco[] = [];
  for (let i = 0; i < quantidade; i++) saida.push(lista[i % lista.length]);
  return saida;
}

/**
 * Capa de um evento: a arte da coleção (draft/selado) ou do cubo, quando houver;
 * senão, uma arte fixa do banco da liga.
 */
export function capaDoEvento(evento: {
  id: string;
  liga: { slug: string };
  formato?: string;
  colecao_info?: {
    arte_url: string | null;
    arte_credito: string | null;
  } | null;
  cubo_info?: {
    imagem_url: string | null;
    imagem_credito: string | null;
  } | null;
}) {
  const externa = evento.colecao_info?.arte_url
    ? {
        src: evento.colecao_info.arte_url,
        credito: evento.colecao_info.arte_credito,
      }
    : evento.cubo_info?.imagem_url
      ? {
          src: evento.cubo_info.imagem_url,
          credito: evento.cubo_info.imagem_credito,
        }
      : null;
  if (externa) {
    const credito = externa.credito ?? "© Wizards of the Coast";
    return {
      src: externa.src,
      foco: "50% 30%",
      credito,
      artista: credito.match(/ilustração de ([^·]+)/)?.[1]?.trim() ?? "",
    };
  }
  const a = arteDoEvento(evento);
  return {
    src: srcArte(a),
    foco: a.foco,
    credito: creditoArte(a),
    artista: a.artista,
  };
}
