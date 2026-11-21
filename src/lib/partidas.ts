/**
 * Rodadas do evento (quem jogou contra quem), lidas do texto colado do Endstep.
 * Aceita formatos variados, uma partida por linha, com títulos de rodada no meio:
 *   "Round 1" / "Rodada 2" / "Top 8" / "Quarterfinals" / "Semifinal" / "Final"
 *   "Table 3  fulano  2-1  ciclano"  ·  "fulano vs ciclano 2-0-1"  ·  "fulano  bye"
 * Os nicks são reconhecidos pela lista conhecida (classificação + inscritos), então
 * cole a classificação antes. A fonte é trocável: uma API futura só precisa devolver Partida[].
 */

export type Partida = {
  rodada: number;
  fase: "suico" | "eliminatoria";
  rotulo: string;
  mesa: number | null;
  jogadorA: string;
  jogadorB: string | null;
  jogadorAId: string | null;
  jogadorBId: string | null;
  vitoriasA: number;
  vitoriasB: number;
  empates: number;
};

export type NickConhecido = { nick: string; jogadorId: string | null };

const ELIMINATORIAS: [RegExp, string][] = [
  [/\b(top\s*8|quarter|quartas)/i, "Quartas"],
  [/\b(top\s*4|semi)/i, "Semifinal"],
  [/\b(final|finals|top\s*2)\b/i, "Final"],
];

function cabecalho(
  linha: string,
): { rotulo: string; fase: Partida["fase"]; numero: number | null } | null {
  if (linha.length > 40) return null;
  const r = linha.match(/^(?:round|rodada|ronda|rd\.?)\s*(\d{1,2})\b/i);
  if (r)
    return { rotulo: `Rodada ${r[1]}`, fase: "suico", numero: Number(r[1]) };
  for (const [re, rotulo] of ELIMINATORIAS)
    if (re.test(linha) && !/\d\s*[-–]\s*\d/.test(linha))
      return { rotulo, fase: "eliminatoria", numero: null };
  return null;
}

/** Posições dos nicks conhecidos na linha (o mais longo primeiro, sem sobreposição). */
function acharNicks(linha: string, conhecidos: NickConhecido[]) {
  const baixa = linha.toLowerCase();
  const usados: [number, number][] = [];
  const achados: { nick: NickConhecido; pos: number; fim: number }[] = [];
  for (const k of [...conhecidos].sort(
    (a, b) => b.nick.length - a.nick.length,
  )) {
    const alvo = k.nick.toLowerCase();
    if (!alvo) continue;
    let de = 0;
    while (true) {
      const pos = baixa.indexOf(alvo, de);
      if (pos < 0) break;
      const fim = pos + alvo.length;
      const antes = baixa[pos - 1] ?? " ";
      const depois = baixa[fim] ?? " ";
      const borda = !/[a-z0-9_]/.test(antes) && !/[a-z0-9_]/.test(depois);
      if (borda && !usados.some(([a, b]) => pos < b && fim > a)) {
        usados.push([pos, fim]);
        achados.push({ nick: k, pos, fim });
        break;
      }
      de = pos + 1;
    }
  }
  return achados.sort((a, b) => a.pos - b.pos);
}

export function lerPartidas(texto: string, conhecidos: NickConhecido[]) {
  const partidas: Partida[] = [];
  const ignoradas: string[] = [];
  let rodada = 0;
  let rotulo = "Rodada 1";
  let fase: Partida["fase"] = "suico";
  let ultimaSuica = 0;

  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.replace(/\t/g, "  ").trim();
    if (!linha) continue;

    const c = cabecalho(linha);
    if (c) {
      fase = c.fase;
      rotulo = c.rotulo;
      rodada = c.numero ?? Math.max(rodada, ultimaSuica) + 1;
      if (c.fase === "suico") ultimaSuica = rodada;
      continue;
    }

    const nicks = acharNicks(linha, conhecidos);
    if (!nicks.length) {
      if (/\d\s*[-–]\s*\d/.test(linha)) ignoradas.push(linha);
      continue;
    }
    if (rodada === 0) {
      rodada = 1;
      ultimaSuica = 1;
    }
    const mesa = linha.match(/(?:table|mesa)\s*#?\s*(\d{1,3})/i);
    const a = nicks[0];

    if (nicks.length === 1) {
      if (/\bbye\b/i.test(linha)) {
        partidas.push({
          rodada,
          fase,
          rotulo,
          mesa: mesa ? Number(mesa[1]) : null,
          jogadorA: a.nick.nick,
          jogadorB: null,
          jogadorAId: a.nick.jogadorId,
          jogadorBId: null,
          vitoriasA: 2,
          vitoriasB: 0,
          empates: 0,
        });
      } else ignoradas.push(linha);
      continue;
    }

    const b = nicks[1];
    // Placar: procura fora dos nicks (um nick pode ter números)
    const semNicks =
      linha.slice(0, a.pos) +
      " ".repeat(a.fim - a.pos) +
      linha.slice(a.fim, b.pos) +
      " ".repeat(b.fim - b.pos) +
      linha.slice(b.fim);
    const placar = semNicks.match(/(\d)\s*[-–:x]\s*(\d)(?:\s*[-–:x]\s*(\d))?/i);
    if (!placar) {
      ignoradas.push(linha);
      continue;
    }
    // Placar escrito antes do segundo nick vale na ordem dos nicks
    partidas.push({
      rodada,
      fase,
      rotulo,
      mesa: mesa ? Number(mesa[1]) : null,
      jogadorA: a.nick.nick,
      jogadorB: b.nick.nick,
      jogadorAId: a.nick.jogadorId,
      jogadorBId: b.nick.jogadorId,
      vitoriasA: Number(placar[1]),
      vitoriasB: Number(placar[2]),
      empates: placar[3] ? Number(placar[3]) : 0,
    });
  }
  return { partidas, ignoradas };
}

/** Agrupa por rodada, na ordem. */
export function porRodada<T extends { rodada: number; rotulo: string | null }>(
  lista: T[],
) {
  const mapa = new Map<number, { rotulo: string; partidas: T[] }>();
  for (const p of [...lista].sort((x, y) => x.rodada - y.rodada)) {
    const g = mapa.get(p.rodada) ?? {
      rotulo: p.rotulo ?? `Rodada ${p.rodada}`,
      partidas: [],
    };
    g.partidas.push(p);
    mapa.set(p.rodada, g);
  }
  return [...mapa.entries()].map(([rodada, g]) => ({ rodada, ...g }));
}
