/**
 * Informações que o jogador precisa antes de garantir o ingresso: cronograma, o que levar e perguntas frequentes.
 * Textos padrão por formato e modalidade; o organizador acrescenta perguntas próprias em cada evento.
 * Pontos ainda a confirmar com a organização estão marcados com PROVISÓRIO.
 */
import { hora } from "@/lib/formato";

export const MINUTOS_RODADA = 50;
export const CHECKIN_ONLINE = 10;
export const CHECKIN_PRESENCIAL = 15;

type Base = {
  formato: string;
  modalidade: string;
  inicio: string;
  minimo: number;
  vagas: number | null;
};
export type Pergunta = { p: string; r: string };

const presencial = (e: Base) => e.modalidade === "presencial";
const mais = (iso: string, min: number) =>
  new Date(new Date(iso).getTime() + min * 60_000).toISOString();

/** Rodadas: Pauper 3 com até 8 jogadores, 4 com 9 ou mais; Limited 3 (dentro do pod). */
export function rodadas(e: Base, jogadores: number) {
  return e.formato === "pauper"
    ? Math.max(e.minimo, jogadores) <= 8
      ? 3
      : 4
    : 3;
}

/** Tempo antes da rodada 1 no Limited (draft e montagem ou abertura do selado). */
function preparo(e: Base) {
  if (e.formato === "draft" || e.formato === "cubo")
    return {
      min: 60,
      texto:
        e.formato === "cubo"
          ? "Draft do cubo e montagem do deck"
          : "Draft e montagem do deck",
    };
  if (e.formato === "selado")
    return { min: 45, texto: "Abertura dos boosters e montagem do deck" };
  return null;
}

export function duracaoMinutos(e: Base, jogadores: number) {
  return (preparo(e)?.min ?? 0) + rodadas(e, jogadores) * MINUTOS_RODADA;
}

export function duracaoTexto(e: Base, jogadores: number) {
  const m = duracaoMinutos(e, jogadores);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `~${h}h${r ? String(r).padStart(2, "0") : ""}`;
}

export function cronograma(
  e: Base,
  jogadores: number,
): { hora: string; texto: string; estimado?: boolean }[] {
  const n = rodadas(e, jogadores);
  const prep = preparo(e);
  const r1 = mais(e.inicio, prep?.min ?? 0);
  const fim = mais(e.inicio, duracaoMinutos(e, jogadores));
  return [
    presencial(e)
      ? {
          hora: hora(mais(e.inicio, -CHECKIN_PRESENCIAL)),
          texto: "Check-in na loja com a organização",
        }
      : {
          hora: hora(mais(e.inicio, -CHECKIN_ONLINE)),
          texto: "Check-in no Endstep pelo link privado",
        },
    ...(prep ? [{ hora: hora(e.inicio), texto: prep.texto }] : []),
    { hora: hora(r1), texto: "Rodada 1" },
    {
      hora: hora(mais(r1, MINUTOS_RODADA)),
      texto: `Rodadas 2 a ${n}, cerca de ${MINUTOS_RODADA} minutos cada`,
      estimado: true,
    },
    {
      hora: hora(fim),
      texto: "Fim da última rodada e resultado",
      estimado: true,
    },
  ];
}

export function oQueLevar(e: Base): string[] {
  if (presencial(e)) {
    return e.formato === "pauper"
      ? [
          "Seu deck físico, com sleeves, igual à lista enviada no ingresso.",
          "Dados, marcadores e algo para anotar os pontos de vida.",
          "Chegue 15 minutos antes para o check-in.",
        ]
      : [
          "Dados, marcadores e algo para anotar os pontos de vida.",
          "Sleeves para o deck que você montar (opcional).",
          "Os boosters do evento: confira abaixo, em Informações da organização, se estão inclusos no ingresso.", // PROVISÓRIO
          "Chegue 15 minutos antes para o check-in.",
        ];
  }
  return [
    "Conta no Endstep com o mesmo nick do seu cadastro na liga.",
    e.formato === "pauper"
      ? "O deck montado no Endstep, igual à lista enviada no ingresso."
      : "Só a conta: o draft ou o selado acontece dentro do Endstep.",
    "Computador com internet estável (o Endstep roda no navegador).",
    "O Discord da liga aberto para os avisos durante o evento.",
  ];
}

export function perguntasPadrao(e: Base): Pergunta[] {
  const lista: Pergunta[] = [
    presencial(e)
      ? {
          p: "E se eu me atrasar?",
          // PROVISÓRIO: tolerância a confirmar
          r: "Há tolerância de 10 minutos para a primeira rodada. Depois disso, você recebe derrota na rodada 1 e entra a partir da rodada 2. Avise a organização no Discord se for se atrasar.",
        }
      : {
          p: "E se eu me atrasar?",
          r: `O check-in é feito no Endstep até ${CHECKIN_ONLINE} minutos antes do início. Quem não fizer o check-in fica fora dos emparelhamentos, sem reembolso.`,
        },
    {
      p: "Posso cancelar o ingresso?",
      r: "Sim, até 24 horas antes do início. Você escolhe entre reembolso por Pix ou o valor de volta na sua Carteira. Depois desse prazo, o ingresso não é reembolsado.",
    },
    {
      p: `E se não tiver ${e.minimo} jogadores?`,
      r: "O evento é cancelado e cada inscrito escolhe entre reembolso por Pix ou o valor na Carteira.",
    },
    {
      p: "Como recebo o prêmio?",
      r: "O prêmio cai na sua Carteira assim que o resultado é publicado. Você saca por Pix, usa em ingressos ou resgata em uma loja parceira.",
    },
  ];
  if (e.formato === "pauper")
    lista.push({
      p: "Posso trocar de deck depois da inscrição?",
      r: "Sim, até o início do evento, pela página do seu ingresso. Vale a última lista registrada.",
    });
  if (presencial(e))
    lista.push({
      p: "Posso usar proxy?",
      // PROVISÓRIO: política de proxies a confirmar
      r: "Nos eventos presenciais, use cartas originais. Se tiver dúvida sobre alguma carta, fale com a organização antes do evento.",
    });
  else
    lista.push({
      p: "Preciso instalar alguma coisa?",
      r: "Não. O Endstep roda no navegador e é gratuito; basta criar a conta com o mesmo nick do seu cadastro.",
    });
  return lista;
}

/** "Pergunta?\nResposta" separadas por linha em branco → lista. */
export function lerPerguntas(texto: string): Pergunta[] {
  return texto
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const [p, ...r] = b.split("\n");
      return {
        p: p.replace(/^P:\s*/i, "").trim(),
        r: r
          .join(" ")
          .replace(/^R:\s*/i, "")
          .trim(),
      };
    })
    .filter((x) => x.p && x.r)
    .slice(0, 15);
}

export const escreverPerguntas = (l: Pergunta[]) =>
  l.map((x) => `${x.p}\n${x.r}`).join("\n\n");
