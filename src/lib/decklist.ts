/**
 * Leitura e conferência de listas de deck.
 * Aceita as exportações do Endstep (texto simples, MTGA e MTGO), Moxfield, MTGGoldfish etc.:
 *   "4 Ninja of the Deep Hours (J25) 108", "4x Counterspell", "SB: 2 Hydroblast"
 *   cabeçalhos "Deck" / "Sideboard"; no MTGO, a linha em branco separa o sideboard.
 */

export type ItemLista = { qtd: number; nome: string };
export type Lista = { principal: ItemLista[]; sideboard: ItemLista[]; ignoradas: string[] };

/** Dados de carta usados na conferência e na visualização (vêm do Scryfall, guardados no banco). */
export type Carta = {
  chave: string;
  nome: string;
  tipo: string;
  custo: string | null;
  cmc: number;
  cores: string[];
  imagem: string | null;
  imagem_grande: string | null;
  legal_pauper: boolean;
  qualquer_quantidade: boolean;
};

export const chaveCarta = (nome: string) => nome.normalize("NFC").trim().toLowerCase();

function somar(itens: ItemLista[]): ItemLista[] {
  const mapa = new Map<string, ItemLista>();
  for (const i of itens) {
    const k = chaveCarta(i.nome);
    const atual = mapa.get(k);
    if (atual) atual.qtd += i.qtd;
    else mapa.set(k, { ...i });
  }
  return [...mapa.values()];
}

/** Remove coleção/número/acabamento: "Faerie Seer (PRM) 91247 *F*" → "Faerie Seer". */
function limparNome(bruto: string) {
  return bruto
    .replace(/\s+\*[A-Z]+\*\s*$/i, "")
    .replace(/\s+\([A-Z0-9]{2,6}\)(\s+[\w-]+)?\s*$/i, "")
    .replace(/\s+\[[A-Z0-9]{2,6}\]\s*$/i, "")
    .replace(/\s+\/\s+/g, " // ")
    .trim();
}

export function lerLista(texto: string): Lista {
  const linhas = texto.replace(/\r/g, "").split("\n");
  const temCabecalhoSide = linhas.some((l) => /^\s*(sideboard|side ?board:?)\s*$/i.test(l));
  const principal: ItemLista[] = [];
  const sideboard: ItemLista[] = [];
  const ignoradas: string[] = [];
  let noSide = false;
  let jaTemCartas = false;

  for (const bruta of linhas) {
    const linha = bruta.trim();
    if (!linha) {
      // MTGO: linha em branco depois do deck principal começa o sideboard
      if (!temCabecalhoSide && jaTemCartas) noSide = true;
      continue;
    }
    if (/^(deck|main ?deck|main ?board|main)\s*:?$/i.test(linha)) continue;
    if (/^side ?board\s*:?$/i.test(linha)) {
      noSide = true;
      continue;
    }
    if (/^(companion|commander|about|name\s.*|maybeboard|tokens?)\s*:?$/i.test(linha) || linha.startsWith("//")) continue;

    let alvo = noSide;
    let resto = linha;
    if (/^sb:\s*/i.test(resto)) {
      alvo = true;
      resto = resto.replace(/^sb:\s*/i, "");
    }
    const m = resto.match(/^(\d{1,3})\s*x?\s+(.+)$/i);
    if (!m) {
      ignoradas.push(linha);
      continue;
    }
    const nome = limparNome(m[2]);
    if (!nome) {
      ignoradas.push(linha);
      continue;
    }
    (alvo ? sideboard : principal).push({ qtd: Number(m[1]), nome });
    jaTemCartas = true;
  }
  return { principal: somar(principal), sideboard: somar(sideboard), ignoradas };
}

export const total = (itens: ItemLista[]) => itens.reduce((a, i) => a + i.qtd, 0);

/** Problemas de um deck de Pauper. Lista vazia = deck legal. */
export function conferirPauper(lista: Lista, cartas: Map<string, Carta>): string[] {
  const problemas: string[] = [];
  const qp = total(lista.principal);
  const qs = total(lista.sideboard);
  if (qp < 60) problemas.push(`O deck principal tem ${qp} cartas; o mínimo é 60.`);
  if (qs > 15) problemas.push(`O sideboard tem ${qs} cartas; o máximo é 15.`);

  const copias = new Map<string, { nome: string; qtd: number }>();
  for (const i of [...lista.principal, ...lista.sideboard]) {
    const k = chaveCarta(i.nome);
    const c = copias.get(k);
    copias.set(k, { nome: i.nome, qtd: (c?.qtd ?? 0) + i.qtd });
  }
  for (const [k, { nome, qtd }] of copias) {
    const carta = cartas.get(k);
    if (!carta) {
      problemas.push(`Carta não encontrada: "${nome}". Confira a grafia (nome em inglês).`);
      continue;
    }
    if (!carta.legal_pauper) problemas.push(`${carta.nome} não é legal no Pauper.`);
    const basico = /\bBasic\b/.test(carta.tipo);
    if (qtd > 4 && !basico && !carta.qualquer_quantidade)
      problemas.push(`${carta.nome}: ${qtd} cópias (máximo 4 somando deck e sideboard).`);
  }
  return problemas;
}

/** Grupo de exibição, como no Endstep/Moxfield. */
export function grupoDaCarta(tipo: string): string {
  if (/\bLand\b/.test(tipo) && !/\bCreature\b/.test(tipo)) return "Terrenos";
  if (/\bCreature\b/.test(tipo)) return "Criaturas";
  if (/\bInstant\b/.test(tipo)) return "Mágicas instantâneas";
  if (/\bSorcery\b/.test(tipo)) return "Feitiços";
  if (/\bArtifact\b/.test(tipo)) return "Artefatos";
  if (/\bEnchantment\b/.test(tipo)) return "Encantamentos";
  return "Outros";
}

export const ORDEM_GRUPOS = [
  "Criaturas",
  "Mágicas instantâneas",
  "Feitiços",
  "Artefatos",
  "Encantamentos",
  "Outros",
  "Terrenos",
];
