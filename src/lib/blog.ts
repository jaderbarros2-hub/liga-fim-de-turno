import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server";
import { arteFixa, type ArteBanco } from "@/lib/artes";
import type { Artigo } from "@/lib/blogComum";

export * from "@/lib/blogComum";

const CAMPOS = "id, slug, titulo, resumo, conteudo, capa_url, categoria, autor_nome, status, publicado_em";

export async function listarArtigos(limite = 30, categoria?: string): Promise<Artigo[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  let q = supabase
    .from("artigos")
    .select(CAMPOS)
    .eq("status", "publicado")
    .lte("publicado_em", new Date().toISOString())
    .order("publicado_em", { ascending: false })
    .limit(limite);
  if (categoria) q = q.eq("categoria", categoria);
  const { data } = await q;
  return (data as Artigo[] | null) ?? [];
}

export async function buscarArtigo(slug: string): Promise<Artigo | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("artigos").select(CAMPOS).eq("slug", slug).maybeSingle();
  return (data as Artigo | null) ?? null;
}

/** Arte de capa quando o artigo não tem imagem própria: fixa por artigo, do banco de artes. */
export function arteDoArtigo(a: Pick<Artigo, "id" | "categoria">): ArteBanco {
  return arteFixa(a.id, a.categoria === "pauper" ? "pauper" : "geral");
}

