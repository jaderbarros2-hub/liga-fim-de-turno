import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server";

export type Parceiro = {
  id: string;
  nome: string;
  descricao: string | null;
  logo_url: string | null;
  site_url: string;
  url_compra_lista: string | null;
  compra_deck: boolean;
};

export type Banner = {
  id: string;
  parceiro_id: string;
  titulo: string;
  texto: string | null;
  imagem_url: string | null;
  posicoes: string[];
  parceiro: { nome: string; logo_url: string | null } | null;
};

export type Posicao = "home" | "evento" | "deck";

/** Link rastreado: passa por /ir, que conta o clique e redireciona com UTM. */
export const linkRastreado = (p: { parceiro: string; banner?: string; origem: "logo" | "banner" | "deck"; pagina?: string }) => {
  const q = new URLSearchParams({ o: p.origem });
  if (p.banner) q.set("b", p.banner);
  if (p.pagina) q.set("p", p.pagina);
  return `/ir/${p.parceiro}?${q}`;
};

export async function listarParceiros(): Promise<Parceiro[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("parceiros")
    .select("id, nome, descricao, logo_url, site_url, url_compra_lista, compra_deck")
    .eq("ativo", true)
    .order("ordem")
    .order("nome");
  return (data as Parceiro[] | null) ?? [];
}

/** Um banner ativo para a posição (sorteado entre os que estão no período). */
export async function bannerPara(posicao: Posicao): Promise<Banner | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const hoje = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("banners")
    .select("id, parceiro_id, titulo, texto, imagem_url, posicoes, inicio, fim, parceiro:parceiros!inner(nome, logo_url, ativo)")
    .eq("ativo", true)
    .eq("parceiro.ativo", true)
    .contains("posicoes", [posicao]);
  const validos = ((data as unknown as (Banner & { inicio: string | null; fim: string | null })[]) ?? []).filter(
    (b) => (!b.inicio || b.inicio <= hoje) && (!b.fim || b.fim >= hoje),
  );
  if (!validos.length) return null;
  return validos[Math.floor(Math.random() * validos.length)];
}

/** Loja escolhida para o botão "Comprar este deck" (sorteada entre as que oferecem). */
export async function lojaParaDeck(): Promise<Parceiro | null> {
  const lojas = (await listarParceiros()).filter((p) => p.compra_deck);
  if (!lojas.length) return null;
  return lojas[Math.floor(Math.random() * lojas.length)];
}
