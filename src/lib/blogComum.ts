/** Tipos e utilitários do blog que também rodam no navegador (editor). */

export type Artigo = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string;
  capa_url: string | null;
  categoria: string;
  autor_nome: string;
  status: "rascunho" | "publicado";
  publicado_em: string | null;
};

export const CATEGORIAS: Record<string, string> = {
  geral: "Magic",
  pauper: "Pauper",
  limited: "Limited",
  liga: "Liga",
};

export const minutosDeLeitura = (texto: string) => Math.max(1, Math.round(texto.split(/\s+/).length / 200));

export const slugificar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
