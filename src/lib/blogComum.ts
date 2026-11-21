/** Tipos e utilitários do blog que também rodam no navegador (editor). */

export type Autor = {
  id: string;
  nome: string;
  bio: string | null;
  avatar_url: string | null;
  link: string | null;
  jogador?: { nick_endstep: string | null } | null; // perfil de jogador vinculado
};

export type Artigo = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string;
  capa_url: string | null;
  categoria: string;
  tipo: string;
  autor_nome: string;
  autor_id: string | null;
  autor: Autor | null;
  status: "rascunho" | "publicado";
  publicado_em: string | null;
};

export const CATEGORIAS: Record<string, string> = {
  pauper: "Pauper",
  premodern: "Premodern",
  limited: "Limited",
  liga: "Liga",
  geral: "Magic",
};

/** Sugestões para o campo "tipo" (aparece acima do título). */
export const TIPOS = [
  "Artigo",
  "Guia de deck",
  "Metagame",
  "Relatório da etapa",
  "Notícia",
  "Draft",
  "Entrevista",
  "Opinião",
];

export const nomeDoAutor = (a: Pick<Artigo, "autor" | "autor_nome">) =>
  a.autor?.nome ?? a.autor_nome;

export const minutosDeLeitura = (texto: string) =>
  Math.max(1, Math.round(texto.split(/\s+/).length / 200));

export const slugificar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
