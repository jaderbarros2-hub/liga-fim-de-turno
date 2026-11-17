"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

async function exigirOrganizador() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/painel/parceiros");
  const { data } = await supabase.from("jogadores").select("papel").eq("id", user.id).maybeSingle();
  if (data?.papel !== "organizador") throw new Error("Apenas o organizador.");
}

const urlValida = (u: string) => /^https?:\/\/\S+\.\S+/i.test(u);

/** Envia uma imagem (logo ou banner) para o armazenamento público e devolve o endereço. */
async function subirImagem(arquivo: File | null, pasta: string): Promise<string | null> {
  if (!arquivo || !arquivo.size) return null;
  if (arquivo.size > 3 * 1024 * 1024) throw new Error("Imagem maior que 3 MB.");
  if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(arquivo.type)) throw new Error("Use PNG, JPG, WebP ou SVG.");
  const ext = arquivo.type.split("/")[1].replace("svg+xml", "svg").replace("jpeg", "jpg");
  const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`;
  const db = criarClienteAdmin();
  const { error } = await db.storage.from("parceiros").upload(caminho, arquivo, { contentType: arquivo.type });
  if (error) throw new Error("Falha ao enviar a imagem.");
  return db.storage.from("parceiros").getPublicUrl(caminho).data.publicUrl;
}

export async function salvarParceiro(form: FormData) {
  await exigirOrganizador();
  const id = String(form.get("id") ?? "");
  const t = (c: string) => String(form.get(c) ?? "").trim();
  const site = t("site_url");
  const compra = t("url_compra_lista");
  if (!t("nome") || !urlValida(site)) throw new Error("Informe nome e o endereço do site (com https://).");
  if (compra && !urlValida(compra)) throw new Error("Link de compra inválido.");

  const logo = await subirImagem(form.get("logo") as File | null, "logos");
  const dados = {
    nome: t("nome"),
    descricao: t("descricao") || null,
    site_url: site,
    url_compra_lista: compra || null,
    compra_deck: form.get("compra_deck") === "on",
    ativo: form.get("ativo") === "on",
    ordem: Number(t("ordem")) || 0,
    ...(logo ? { logo_url: logo } : {}),
  };
  const db = criarClienteAdmin();
  if (id) await db.from("parceiros").update(dados).eq("id", id);
  else await db.from("parceiros").insert(dados);
  revalidatePath("/", "layout");
  redirect("/painel/parceiros");
}

export async function salvarBanner(form: FormData) {
  await exigirOrganizador();
  const t = (c: string) => String(form.get(c) ?? "").trim();
  const destino = t("destino_url");
  if (!t("titulo") || !urlValida(destino)) throw new Error("Informe título e o link de destino (com https://).");
  const posicoes = ["home", "evento", "deck"].filter((p) => form.get(`pos_${p}`) === "on");
  const imagem = await subirImagem(form.get("imagem") as File | null, "banners");
  await criarClienteAdmin()
    .from("banners")
    .insert({
      parceiro_id: t("parceiro_id"),
      titulo: t("titulo"),
      texto: t("texto") || null,
      destino_url: destino,
      posicoes: posicoes.length ? posicoes : ["home"],
      inicio: t("inicio") || null,
      fim: t("fim") || null,
      imagem_url: imagem,
    });
  revalidatePath("/", "layout");
  redirect("/painel/parceiros");
}

export async function alternarBanner(form: FormData) {
  await exigirOrganizador();
  await criarClienteAdmin()
    .from("banners")
    .update({ ativo: form.get("ativo") !== "true" })
    .eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}
