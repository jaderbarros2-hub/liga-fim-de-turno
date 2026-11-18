"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugificar } from "@/lib/blogComum";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoArtigo = { erro?: string; ok?: string } | null;

async function exigirOrganizador() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("jogadores")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  return data?.papel === "organizador";
}

async function subir(arquivo: File, pasta: string) {
  if (arquivo.size > 3 * 1024 * 1024) throw new Error("Imagem maior que 3 MB.");
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(arquivo.type))
    throw new Error("Use PNG, JPG, WebP ou GIF.");
  const ext = arquivo.type.split("/")[1].replace("jpeg", "jpg");
  const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`;
  const db = criarClienteAdmin();
  const { error } = await db.storage
    .from("blog")
    .upload(caminho, arquivo, { contentType: arquivo.type });
  if (error) throw new Error("Falha ao enviar a imagem.");
  return db.storage.from("blog").getPublicUrl(caminho).data.publicUrl;
}

/** Envia uma imagem para usar no meio do texto. */
export async function enviarImagem(
  form: FormData,
): Promise<{ url?: string; erro?: string }> {
  if (!(await exigirOrganizador())) return { erro: "Apenas o organizador." };
  const arquivo = form.get("imagem");
  if (!(arquivo instanceof File) || !arquivo.size)
    return { erro: "Escolha uma imagem." };
  try {
    return { url: await subir(arquivo, "texto") };
  } catch (e) {
    return { erro: (e as Error).message };
  }
}

export async function salvarArtigo(
  _: EstadoArtigo,
  form: FormData,
): Promise<EstadoArtigo> {
  if (!(await exigirOrganizador()))
    return { erro: "Apenas o organizador pode escrever no blog." };
  const t = (c: string) => String(form.get(c) ?? "").trim();
  const id = t("id");
  const acao = t("acao"); // rascunho | publicar | despublicar
  const titulo = t("titulo");
  if (!titulo) return { erro: "Dê um título ao artigo." };
  const db = criarClienteAdmin();
  const { data: autor } = await db
    .from("autores")
    .select("id, nome")
    .eq("id", t("autor_id"))
    .maybeSingle();
  if (!autor)
    return { erro: "Escolha o autor (cadastre em Painel → Blog → Autores)." };
  let slug = slugificar(t("slug") || titulo) || "artigo";
  const { data: igual } = await db
    .from("artigos")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (igual && igual.id !== id)
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  let capa: string | null | undefined;
  const arquivo = form.get("capa");
  try {
    if (arquivo instanceof File && arquivo.size)
      capa = await subir(arquivo, "capas");
  } catch (e) {
    return { erro: (e as Error).message };
  }
  if (form.get("remover_capa") === "on") capa = null;

  // Data de publicação: a informada (horário de Brasília) ou agora
  const quando = t("publicado_em");
  const dataPub = quando ? new Date(`${quando}:00-03:00`).toISOString() : null;

  const dados: Record<string, unknown> = {
    titulo,
    slug,
    resumo: t("resumo") || null,
    conteudo: String(form.get("conteudo") ?? ""),
    categoria: t("categoria") || "geral",
    autor_nome: autor.nome,
    autor_id: autor.id,
    tipo: t("tipo").slice(0, 30) || "Artigo",
    atualizado_em: new Date().toISOString(),
    ...(capa !== undefined ? { capa_url: capa } : {}),
  };
  if (acao === "publicar") {
    dados.status = "publicado";
    dados.publicado_em = dataPub ?? new Date().toISOString();
  } else if (acao === "despublicar") {
    dados.status = "rascunho";
  } else if (dataPub) {
    dados.publicado_em = dataPub;
  }

  const resultado = id
    ? await db.from("artigos").update(dados).eq("id", id).select("id").single()
    : await db.from("artigos").insert(dados).select("id").single();
  if (resultado.error)
    return { erro: "Não foi possível salvar. Tente de novo." };

  revalidatePath("/blog");
  revalidatePath("/");
  if (!id) redirect(`/painel/blog/${resultado.data.id}?salvo=1`);
  return {
    ok:
      acao === "publicar"
        ? new Date(dados.publicado_em as string) > new Date()
          ? "Agendado. O artigo aparece no blog na data marcada."
          : "Publicado no blog."
        : acao === "despublicar"
          ? "Voltou para rascunho e saiu do blog."
          : "Rascunho salvo.",
  };
}

export async function apagarArtigo(form: FormData) {
  if (!(await exigirOrganizador())) return;
  await criarClienteAdmin()
    .from("artigos")
    .delete()
    .eq("id", String(form.get("id")));
  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/painel/blog");
}

export async function salvarAutor(form: FormData) {
  if (!(await exigirOrganizador())) return;
  const t = (c: string) => String(form.get(c) ?? "").trim();
  const id = t("id");
  const nome = t("nome");
  if (!nome) return;
  const link = t("link");
  let avatar: string | undefined;
  const arquivo = form.get("avatar");
  if (arquivo instanceof File && arquivo.size)
    avatar = await subir(arquivo, "autores");
  const dados = {
    nome,
    bio: t("bio") || null,
    link: /^https?:\/\//.test(link) ? link : null,
    jogador_id: t("jogador_id") || null,
    ...(avatar ? { avatar_url: avatar } : {}),
  };
  const db = criarClienteAdmin();
  if (id) {
    await db.from("autores").update(dados).eq("id", id);
    await db.from("artigos").update({ autor_nome: nome }).eq("autor_id", id);
  } else await db.from("autores").insert(dados);
  revalidatePath("/blog", "layout");
  redirect("/painel/blog/autores");
}
