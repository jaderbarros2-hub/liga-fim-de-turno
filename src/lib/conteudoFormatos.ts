/** Textos das páginas de formato. Rascunho: serão revisados no polimento de texto. */

export type ConteudoFormato = {
  nome: string;
  chamada: string;
  resumo: string;
  numeros: { valor: string; rotulo: string }[];
  sobre: string[];
  etapa: { titulo: string; texto: string }[];
  premio: { titulo: string; linhas: { faixa: string; divisao: string }[]; nota: string };
  perguntas: { p: string; r: string }[];
};

export const FORMATOS: Record<string, ConteudoFormato> = {
  pauper: {
    nome: "Pauper",
    chamada: "Só comuns. Jogo de verdade.",
    resumo: "O formato em que só valem cartas comuns: decks acessíveis, partidas rápidas e um metagame cheio de opções.",
    numeros: [
      { valor: "4", rotulo: "etapas por mês" },
      { valor: "80%", rotulo: "das inscrições em prêmio" },
      { valor: "MD3", rotulo: "partidas melhor de 3" },
      { valor: "Top 8", rotulo: "Player of the Year" },
    ],
    sobre: [
      "No Pauper, só entram cartas que já foram impressas como comuns em algum momento da história do Magic. Isso deixa os decks baratos, mas não fracos: o formato reúne décadas de cartas eficientes e um metagame com aggro, controle, combo e tudo no meio.",
      "Na liga, o Pauper é jogado online no Endstep, então você pode testar qualquer lista sem comprar uma carta. Toda etapa vale pontos no ranking e, a cada trimestre, uma final define o campeão.",
    ],
    etapa: [
      { titulo: "Inscrição pelo Pix", texto: "Inscreva-se no portal até o prazo do evento. A confirmação é automática quando o Pix cai." },
      { titulo: "Lista no portal", texto: "Deck de 60 cartas e sideboard de até 15, cadastrado antes do início. Escolha também o arquétipo." },
      { titulo: "Rodadas suíças", texto: "3 rodadas com 8 jogadores e 4 com 9 ou mais. Partidas melhor de 3, no Endstep." },
      { titulo: "Prêmio e pontos", texto: "O prêmio sai por Pix conforme a classificação e os pontos entram no ranking do circuito." },
    ],
    premio: {
      titulo: "Divisão do prêmio por classificação",
      linhas: [
        { faixa: "8 a 11 jogadores", divisao: "1º 50% · 2º 30% · 3º 20%" },
        { faixa: "12 a 19 jogadores", divisao: "1º 40% · 2º 25% · 3º e 4º 17,5%" },
        { faixa: "20 ou mais", divisao: "1º 30% · 2º 20% · 3º e 4º 12,5% · 5º ao 8º 6,25%" },
      ],
      nota: "Percentuais sobre o total do prêmio (80% das inscrições confirmadas).",
    },
    perguntas: [
      { p: "Como sei se a minha carta é legal no Pauper?", r: "Quando você cadastra a lista no portal, cada carta é conferida na base do Scryfall. Se algo não for legal no Pauper, o portal avisa." },
      { p: "Posso mudar o deck entre as etapas?", r: "Pode. Cada etapa tem a sua lista. Você escolhe qual dos seus decks usar até o início do evento." },
      { p: "As listas ficam públicas?", r: "Depois do resultado, as listas do top 8 ficam públicas. O arquétipo de todo mundo aparece no metagame." },
      { p: "Preciso ter as cartas?", r: "Não. As partidas são no Endstep, que é gratuito e roda no navegador." },
    ],
  },
  limited: {
    nome: "Limited",
    chamada: "Todo mundo começa do zero.",
    resumo: "Draft, selado e cubo: o deck é montado na hora, então ganha quem lê melhor a mesa e joga melhor.",
    numeros: [
      { valor: "4", rotulo: "etapas por mês" },
      { valor: "3", rotulo: "rodadas por pod" },
      { valor: "3-0", rotulo: "vale 3 cotas do prêmio" },
      { valor: "Top 8", rotulo: "Player of the Year" },
    ],
    sobre: [
      "No Limited ninguém chega com o deck pronto. No draft, os jogadores escolhem cartas de pacotes que passam pela mesa; no selado, cada um monta o deck com os próprios boosters; no cubo, a liga escolhe as cartas e todo mundo faz o draft a partir delas.",
      "É o formato que mais premia leitura de jogo e adaptação. Na liga, as etapas acontecem em pods de até 8 jogadores no Endstep, com prêmio pela campanha de cada um.",
    ],
    etapa: [
      { titulo: "Inscrição pelo Pix", texto: "Inscreva-se no portal até o prazo do evento. A coleção ou o cubo da etapa aparecem na página do evento." },
      { titulo: "Draft ou selado", texto: "Draft com 3 pacotes de 15 cartas, selado com 6 boosters ou o cubo oficial da liga." },
      { titulo: "3 rodadas no pod", texto: "Pods de 6 a 8 jogadores, 3 rodadas suíças dentro do pod, partidas melhor de 3." },
      { titulo: "Prêmio por campanha", texto: "Quem faz 3-0 leva 3 cotas e quem faz 2-1 leva 1 cota. Os pontos entram no ranking do circuito." },
    ],
    premio: {
      titulo: "Prêmio por campanha",
      linhas: [
        { faixa: "3-0", divisao: "3 cotas do prêmio" },
        { faixa: "2-1", divisao: "1 cota do prêmio" },
        { faixa: "1-2 ou 0-3", divisao: "pontos de participação no ranking" },
      ],
      nota: "O prêmio (80% das inscrições) é dividido pelo total de cotas do pod.",
    },
    perguntas: [
      { p: "Nunca fiz draft. Posso jogar?", r: "Pode. O Endstep guia o draft passo a passo e a liga tem guias no blog para quem está começando." },
      { p: "Quais coleções são jogadas?", r: "A coleção ou o cubo de cada etapa aparece na agenda. A liga alterna entre lançamentos recentes e o cubo da casa." },
      { p: "Como funciona a classificação no ranking?", r: "A posição final no pod vale pontos no ranking do circuito Limited, igual ao Pauper." },
      { p: "Preciso ter as cartas?", r: "Não. Tudo acontece no Endstep, gratuito e direto no navegador." },
    ],
  },
};
