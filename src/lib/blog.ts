import {
  criarClienteServidor,
  supabaseConfigurado,
} from "@/lib/supabase/server";
import { arteFixa, type ArteBanco } from "@/lib/artes";
import type { Artigo } from "@/lib/blogComum";

export * from "@/lib/blogComum";

const CAMPOS =
  "id, slug, titulo, resumo, conteudo, capa_url, categoria, tipo, autor_nome, autor_id, status, publicado_em, autor:autores(id, nome, bio, avatar_url, link, jogador:jogadores(nick_endstep))";

export const POR_PAGINA = 24;

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

function publicados(supabase: Cliente) {
  return supabase
    .from("artigos")
    .select(CAMPOS, { count: "exact" })
    .eq("status", "publicado")
    .lte("publicado_em", new Date().toISOString());
}

const lista = (data: unknown) => (data as Artigo[] | null) ?? [];

export async function listarArtigos(
  limite = 4,
  filtro: { categoria?: string; autor?: string; excluir?: string } = {},
): Promise<Artigo[]> {
  if (!supabaseConfigurado()) return [];
  let q = publicados(await criarClienteServidor())
    .order("publicado_em", { ascending: false })
    .limit(limite + (filtro.excluir ? 1 : 0));
  if (filtro.categoria) q = q.eq("categoria", filtro.categoria);
  if (filtro.autor) q = q.eq("autor_id", filtro.autor);
  const { data } = await q;
  return lista(data)
    .filter((a) => a.id !== filtro.excluir)
    .slice(0, limite);
}

/** Página da listagem do blog, com o total para a paginação. */
export async function paginaDeArtigos(pagina: number, categoria?: string) {
  if (!supabaseConfigurado()) return { artigos: [] as Artigo[], total: 0 };
  const de = (pagina - 1) * POR_PAGINA;
  let q = publicados(await criarClienteServidor())
    .order("publicado_em", { ascending: false })
    .range(de, de + POR_PAGINA - 1);
  if (categoria) q = q.eq("categoria", categoria);
  const { data, count } = await q;
  return { artigos: lista(data), total: count ?? 0 };
}

/** Mais lidos dos últimos 90 dias. */
export async function artigosPopulares(
  limite = 6,
  excluir?: string,
): Promise<Artigo[]> {
  if (!supabaseConfigurado()) return [];
  const desde = new Date(Date.now() - 90 * 864e5).toISOString();
  const { data } = await publicados(await criarClienteServidor())
    .gte("publicado_em", desde)
    .order("visualizacoes", { ascending: false })
    .order("publicado_em", { ascending: false })
    .limit(limite + 1);
  return lista(data)
    .filter((a) => a.id !== excluir)
    .slice(0, limite);
}

export async function buscarArtigo(slug: string): Promise<Artigo | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("artigos")
    .select(CAMPOS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Artigo | null) ?? null;
}

export async function registrarLeitura(slug: string) {
  if (!supabaseConfigurado()) return;
  const supabase = await criarClienteServidor();
  await supabase.rpc("registrar_leitura", { p_slug: slug });
}

/** Arte de capa quando o artigo não tem imagem própria: fixa por artigo, do banco de artes. */
export function arteDoArtigo(a: Pick<Artigo, "id" | "categoria">): ArteBanco {
  return arteFixa(
    a.id,
    a.categoria === "pauper" || a.categoria === "premodern"
      ? a.categoria
      : "geral",
  );
}
