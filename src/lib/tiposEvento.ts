/** Atalhos da agenda: por liga, por tipo de Limited e por modalidade. */
type EventoBase = {
  formato: string;
  modalidade: string;
  liga: { slug: string };
};

export const TIPOS_EVENTO: {
  valor: string;
  rotulo: string;
  filtra: (e: EventoBase) => boolean;
}[] = [
  { valor: "pauper", rotulo: "Pauper", filtra: (e) => e.formato === "pauper" },
  {
    valor: "premodern",
    rotulo: "Premodern",
    filtra: (e) => e.formato === "premodern",
  },
  { valor: "draft", rotulo: "Draft", filtra: (e) => e.formato === "draft" },
  { valor: "selado", rotulo: "Selado", filtra: (e) => e.formato === "selado" },
  { valor: "cubo", rotulo: "Cubo", filtra: (e) => e.formato === "cubo" },
  {
    valor: "online",
    rotulo: "Online",
    filtra: (e) => e.modalidade !== "presencial",
  },
  {
    valor: "presencial",
    rotulo: "Presencial",
    filtra: (e) => e.modalidade === "presencial",
  },
];

export const tipoEvento = (valor?: string) =>
  TIPOS_EVENTO.find((t) => t.valor === valor);
