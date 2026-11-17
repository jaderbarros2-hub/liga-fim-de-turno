import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Redirecionamento rastreado para parceiros: conta o clique e envia para a loja
 * com UTM (utm_source=ligafimdeturno). Só redireciona para endereços cadastrados no Painel.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const origem = ["logo", "banner", "deck"].includes(url.searchParams.get("o") ?? "") ? url.searchParams.get("o")! : "logo";
  const bannerId = url.searchParams.get("b");
  const pagina = url.searchParams.get("p")?.slice(0, 200) ?? null;
  const lista = origem === "deck" ? url.searchParams.get("lista") : null;

  const db = criarClienteAdmin();
  const { data: parceiro } = await db
    .from("parceiros")
    .select("id, site_url, url_compra_lista, ativo")
    .eq("id", id)
    .maybeSingle();
  if (!parceiro?.ativo) return NextResponse.redirect(new URL("/parceiros", url.origin));

  let destino = parceiro.site_url;
  if (bannerId) {
    const { data: banner } = await db
      .from("banners")
      .select("destino_url")
      .eq("id", bannerId)
      .eq("parceiro_id", id)
      .maybeSingle();
    if (banner?.destino_url) destino = banner.destino_url;
  }
  if (origem === "deck" && lista && parceiro.url_compra_lista?.includes("{lista}")) {
    destino = parceiro.url_compra_lista.replace("{lista}", encodeURIComponent(lista.slice(0, 4000)));
  }

  await db.from("cliques").insert({ parceiro_id: id, banner_id: bannerId, origem, pagina });

  let alvo: URL;
  try {
    alvo = new URL(destino);
  } catch {
    return NextResponse.redirect(new URL("/parceiros", url.origin));
  }
  alvo.searchParams.set("utm_source", "ligafimdeturno");
  alvo.searchParams.set("utm_medium", origem);
  alvo.searchParams.set("utm_campaign", pagina?.startsWith("/eventos") ? "evento" : origem === "deck" ? "deck" : "portal");
  return NextResponse.redirect(alvo, 302);
}
