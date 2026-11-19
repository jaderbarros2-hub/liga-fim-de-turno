/**
 * Formatos e ligas. Construídos (Pauper, Premodern) têm deck registrado, lista conferida e metagame;
 * Limited (draft, selado, cubo) tem coleção ou cubo e prêmio por campanha.
 */

export type Construido = "pauper" | "premodern";
export type SlugLiga = Construido | "limited";

export const CONSTRUIDOS: Construido[] = ["pauper", "premodern"];
export const LIGAS: { slug: SlugLiga; nome: string }[] = [
  { slug: "pauper", nome: "Pauper" },
  { slug: "premodern", nome: "Premodern" },
  { slug: "limited", nome: "Limited" },
];

export const ehConstruido = (
  formato: string | null | undefined,
): formato is Construido => formato === "pauper" || formato === "premodern";

/** Liga de um formato de evento: Pauper e Premodern são ligas próprias; draft, selado e cubo vão para a Limited. */
export const ligaDoFormato = (formato: string): SlugLiga =>
  ehConstruido(formato) ? formato : "limited";

export const NOME_LIGA: Record<string, string> = {
  pauper: "Pauper",
  premodern: "Premodern",
  limited: "Limited",
};

/** Grupo de artes do banco para o formato (Premodern usa as gerais até ganhar artes próprias). */
export const grupoDeArte = (
  formatoOuLiga: string | null | undefined,
): "pauper" | "limited" | "geral" =>
  formatoOuLiga === "pauper"
    ? "pauper"
    : formatoOuLiga === "premodern"
      ? "geral"
      : formatoOuLiga
        ? "limited"
        : "geral";
