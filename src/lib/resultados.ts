/**
 * Resultados: leitura da classificação final e cálculo de prêmios.
 *
 * A fonte da classificação é trocável. Hoje: texto colado do Endstep.
 * Depois (2027): importador automático (API do Endstep ou leitura da página),
 * que só precisa devolver o mesmo formato `LinhaResultado[]`.
 */

export type LinhaResultado = {
  posicao: number;
  nick: string;
  jogadorId: string | null;
  vitorias: number;
  derrotas: number;
  empates: number;
  pontos: number;
};

export type Inscrito = { jogadorId: string; nick: string };

/**
 * Regra da Liga Pauper (documentação): divisão por classificação conforme o tamanho do evento.
 *   8 a 11 jogadores: 50/30/20 · 12 a 19: 40/25/17,5/17,5 · 20 ou mais: 30/20/12,5/12,5 e 6,25 do 5º ao 8º
 */
export function regraPauper(jogadores: number): number[] {
  if (jogadores >= 20) return [30, 20, 12.5, 12.5, 6.25, 6.25, 6.25, 6.25];
  if (jogadores >= 12) return [40, 25, 17.5, 17.5];
  return [50, 30, 20];
}

/** Regra da Liga Limited (documentação): prêmio por campanha. 3-0 vale 3 cotas, 2-1 vale 1 cota. */
export function cotasLimited(l: Pick<LinhaResultado, "vitorias">): number {
  if (l.vitorias >= 3) return 3;
  if (l.vitorias === 2) return 1;
  return 0;
}

export const ehLimited = (formato: string) =>
  formato !== "pauper" && formato !== "premodern";

const pct = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Texto curto da regra aplicada, para mostrar no Painel. */
export function descreverRegra(formato: string, jogadores: number): string {
  if (ehLimited(formato))
    return "Limited, por campanha: 3-0 vale 3 cotas, 2-1 vale 1 cota";
  return `Pauper, ${jogadores} jogadores: ${regraPauper(jogadores).map(pct).join("/")}%`;
}

/**
 * Prêmio de cada linha da classificação (mesma ordem), em centavos.
 * `personalizada` (percentuais por posição) substitui a regra da liga quando informada.
 */
export function premiosDoEvento(
  formato: string,
  totalCentavos: number,
  linhas: LinhaResultado[],
  personalizada?: number[] | null,
): number[] {
  const zeros = linhas.map(() => 0);
  if (totalCentavos <= 0 || !linhas.length) return zeros;

  if (!personalizada && ehLimited(formato)) {
    const cotas = linhas.map(cotasLimited);
    const soma = cotas.reduce((a, b) => a + b, 0);
    if (!soma) return zeros;
    const valores = cotas.map((c) => Math.floor((totalCentavos * c) / soma));
    const sobra = totalCentavos - valores.reduce((a, b) => a + b, 0);
    const primeiro = valores.findIndex((v) => v > 0);
    if (primeiro >= 0) valores[primeiro] += sobra;
    return valores;
  }

  const distribuicao = personalizada ?? regraPauper(linhas.length);
  const valores = calcularPremios(totalCentavos, distribuicao, linhas.length);
  return zeros.map((_, i) => valores[i] ?? 0);
}

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Encontra o inscrito cujo nick aparece na linha (o nick mais longo vence, para evitar "ana" dentro de "mariana"). */
function acharInscrito(linha: string, inscritos: Inscrito[]) {
  const alvo = normalizar(linha);
  let melhor: Inscrito | null = null;
  for (const i of inscritos) {
    const n = normalizar(i.nick);
    if (
      n &&
      alvo.includes(n) &&
      (!melhor || n.length > normalizar(melhor.nick).length)
    )
      melhor = i;
  }
  return melhor;
}

/**
 * Lê a classificação colada. Aceita formatos variados, uma linha por jogador:
 *   "1  fulano  3-0  9"   ·   "1. fulano (2-1-0) 6 pts"   ·   "fulano 3/0"
 * Sem número de posição, vale a ordem das linhas. Linhas sem nick reconhecível
 * e sem campanha (cabeçalhos) são ignoradas.
 */
export function lerClassificacao(
  texto: string,
  inscritos: Inscrito[],
): LinhaResultado[] {
  const linhas: LinhaResultado[] = [];
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.replace(/\t/g, "  ").trim();
    if (!linha) continue;

    const campanha = linha.match(
      /(\d{1,2})\s*[-–/x]\s*(\d{1,2})(?:\s*[-–/x]\s*(\d{1,2}))?/i,
    );
    const inscrito = acharInscrito(linha, inscritos);
    if (!inscrito && !campanha) continue;

    const pos = linha.match(/^#?\s*(\d{1,3})(?:º|°|\.|\)|\s)/);
    const vitorias = campanha ? Number(campanha[1]) : 0;
    const derrotas = campanha ? Number(campanha[2]) : 0;
    const empates = campanha?.[3] ? Number(campanha[3]) : 0;

    // Pontos: número depois da campanha (ex.: "9" ou "9 pts"); se não houver, 3 por vitória + 1 por empate
    let pontos = vitorias * 3 + empates;
    if (campanha) {
      const depois = linha
        .slice((campanha.index ?? 0) + campanha[0].length)
        .match(/(\d{1,3})/);
      if (depois) pontos = Number(depois[1]);
    }

    let nick = inscrito?.nick ?? "";
    if (!nick) {
      // Sem cadastro reconhecido: usa o trecho de texto entre a posição e a campanha
      const inicio = pos ? pos[0].length : 0;
      const fim = campanha?.index ?? linha.length;
      nick =
        linha
          .slice(inicio, fim)
          .replace(/[|()\[\]]/g, " ")
          .trim()
          .split(/\s{2,}/)[0] ?? "";
    }
    if (!nick) continue;

    linhas.push({
      posicao: pos ? Number(pos[1]) : linhas.length + 1,
      nick,
      jogadorId: inscrito?.jogadorId ?? null,
      vitorias,
      derrotas,
      empates,
      pontos,
    });
  }
  // Ordena pela posição e renumera em sequência, sem buracos nem repetições
  return linhas
    .sort((a, b) => a.posicao - b.posicao)
    .map((l, i) => ({ ...l, posicao: i + 1 }));
}

/** Converte "50/30/20" ou "40; 25; 17,5; 17,5" em números. Vazio = usar a regra da liga (null). */
export function lerDistribuicao(texto: string): number[] | null | "invalida" {
  if (!texto.trim()) return null;
  const partes = texto
    .split(/[\/;\s]+/)
    .map((p) => p.replace(",", "."))
    .map((p) => p.trim())
    .filter(Boolean)
    .map(Number);
  if (!partes.length || partes.some((n) => !Number.isFinite(n) || n < 0))
    return "invalida";
  const soma = partes.reduce((a, b) => a + b, 0);
  if (Math.abs(soma - 100) > 0.01) return "invalida";
  return partes;
}

/**
 * Divide o prêmio total (em centavos) pelas posições.
 * Arredonda para baixo em cada posição e soma a sobra de centavos ao 1º lugar,
 * para que o total pago seja exatamente o prêmio.
 * Se houver menos jogadores que posições premiadas, a parte das posições
 * vazias é redistribuída proporcionalmente entre as ocupadas.
 */
export function calcularPremios(
  totalCentavos: number,
  distribuicao: number[],
  jogadores: number,
): number[] {
  const usadas = distribuicao.slice(0, Math.max(0, jogadores));
  const soma = usadas.reduce((a, b) => a + b, 0);
  if (!usadas.length || soma <= 0 || totalCentavos <= 0) return [];
  const valores = usadas.map((p) => Math.floor((totalCentavos * p) / soma));
  const sobra = totalCentavos - valores.reduce((a, b) => a + b, 0);
  valores[0] += sobra;
  return valores;
}
