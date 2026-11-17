/**
 * Artes de cartas usadas no visual do site (imagens do Scryfall).
 * Regras: não cortar nome do artista/copyright das cartas inteiras; ao usar só a
 * ilustração (art_crop), mostrar o crédito do artista na mesma tela.
 * Só artes de Magic: nada de versões de outras franquias (Marvel, Star Trek etc.).
 */

export type Arte = { carta: string; artista: string; caminho: string };

const BASE = "https://cards.scryfall.io";

export const ilustracao = (a: Arte) => `${BASE}/art_crop/front/${a.caminho}`;
export const cartaInteira = (a: Arte, tamanho: "normal" | "large" = "large") => `${BASE}/${tamanho}/front/${a.caminho}`;
export const credito = (a: Arte) => `${a.carta} · arte de ${a.artista}`;

export const ARTES = {
  counterspell: { carta: "Counterspell", artista: "Zack Stella", caminho: "4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.jpg?1783909630" },
  ninja: { carta: "Ninja of the Deep Hours", artista: "Randy Vargas", caminho: "f/b/fb245a12-4cbd-4291-af67-f3677ca822dc.jpg?1783908836" },
  korSkyfisher: { carta: "Kor Skyfisher", artista: "Dan Murayama Scott", caminho: "d/7/d7501662-1216-4e08-bd2b-e0a459057942.jpg?1783936681" },
  augur: { carta: "Augur of Bolas", artista: "Alex Konstad", caminho: "9/3/934b4a7a-f42f-401b-8411-5ecb26bafe01.jpg?1783908779" },
  faerieSeer: { carta: "Faerie Seer", artista: "Eelis Kyttanen", caminho: "f/0/f0b96dc7-d046-4b64-b3a8-8bf5ac7c8f9b.jpg?1783908836" },
  spellstutter: { carta: "Spellstutter Sprite", artista: "Rebecca Guay", caminho: "3/8/3899605d-2203-4ab6-9ff5-69490382eea4.jpg?1783939994" },
  galvanicBlast: { carta: "Galvanic Blast", artista: "Marc Simonetti", caminho: "0/c/0cf8cb1e-314a-4894-82df-f9812825f52e.jpg?1783930164" },
  gurmag: { carta: "Gurmag Angler", artista: "YW Tang", caminho: "c/e/cedd44eb-f381-46e1-bcb0-88416b4ce33d.jpg?1783933821" },
  thorn: { carta: "Thorn of the Black Rose", artista: "David Gaillet", caminho: "b/4/b4b266e2-1cad-40df-bc0e-3e1464b299b3.jpg?1783915664" },
  packRat: { carta: "Pack Rat", artista: "Kev Walker", caminho: "1/7/170693f5-13db-4191-99b1-e527ffb5b88e.jpg?1783940361" },
  ponder: { carta: "Ponder", artista: "Berto Martinez", caminho: "0/c/0cb673af-dae0-478c-a5d3-b697338f6c0e.jpg?1793281344" },
  battleScreech: { carta: "Battle Screech", artista: "Anastasia Ovchinnikova", caminho: "9/0/90301f8c-f7af-4179-8faf-9901931bba8d.jpg?1783915727" },
  chainer: { carta: "Chainer's Edict", artista: "Mark Zug", caminho: "a/1/a1d194d7-dccf-4421-be8f-8efdcf9fbbeb.jpg?1793456741" },
  swiftspear: { carta: "Monastery Swiftspear", artista: "Gabor Szikszai", caminho: "d/6/d6bfa227-4309-40ed-952c-279595eab17e.jpg?1783920066" },
  llanowar: { carta: "Llanowar Elves", artista: "Kev Walker", caminho: "6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg?1783909057" },
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
