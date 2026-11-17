const FUSO = "America/Sao_Paulo";

export function reais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
  });
}

export function dataLonga(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: FUSO,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function hora(iso: string) {
  return new Date(iso)
    .toLocaleTimeString("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");
}

export const NOMES_FORMATO: Record<string, string> = {
  pauper: "Pauper",
  draft: "Draft",
  selado: "Selado",
  cubo: "Cubo",
};

export const NOMES_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  aberto: "Inscrições abertas",
  fechado: "Inscrições encerradas",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
  resultados: "Resultados publicados",
  cancelado: "Cancelado",
};

export function dataPublicacao(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: FUSO, day: "numeric", month: "short", year: "numeric" });
}
