"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";
import { slugLoja, usuarioInstagram } from "@/lib/lojas";

async function exigirOrganizador() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/painel/parceiros");
  const { data } = await supabase
    .from("jogadores")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.papel !== "organizador") throw new Error("Apenas o organizador.");
}

const urlValida = (u: string) => /^https?:\/\/\S+\.\S+/i.test(u);

/** Envia uma imagem (logo ou banner) para o armazenamento público e devolve o endereço. */
async function subirImagem(
  arquivo: File | null,
  pasta: string,
): Promise<string | null> {
  if (!arquivo || !arquivo.size) return null;
  if (arquivo.size > 3 * 1024 * 1024) throw new Error("Imagem maior que 3 MB.");
  // GIF só nos banners (arte animada da loja)
  const tipos =
    pasta === "banners"
      ? /^image\/(png|jpe?g|webp|gif)$/
      : /^image\/(png|jpe?g|webp|svg\+xml)$/;
  if (!tipos.test(arquivo.type))
    throw new Error(
      pasta === "banners"
        ? "Use PNG, JPG, WebP ou GIF."
        : "Use PNG, JPG, WebP ou SVG.",
    );
  const ext = arquivo.type
    .split("/")[1]
    .replace("svg+xml", "svg")
    .replace("jpeg", "jpg");
  const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`;
  const db = criarClienteAdmin();
  const { error } = await db.storage
    .from("parceiros")
    .upload(caminho, arquivo, { contentType: arquivo.type });
  if (error) throw new Error("Falha ao enviar a imagem.");
  return db.storage.from("parceiros").getPublicUrl(caminho).data.publicUrl;
}

export type EstadoLoja = { erro?: string };

const nulo = (v: string) => v || null;

export async function salvarParceiro(
  _: EstadoLoja,
  form: FormData,
): Promise<EstadoLoja> {
  await exigirOrganizador();
  const id = String(form.get("id") ?? "");
  const t = (c: string) => String(form.get(c) ?? "").trim();
  const marcado = (c: string) => form.get(c) === "on";
  const site = t("site_url");
  const compra = t("url_compra_lista");
  const mapa = t("mapa_url");
  const cadastro = t("url_cadastro");
  if (!t("nome")) return { erro: "Informe o nome da loja." };
  if (site && !urlValida(site))
    return { erro: "Site inválido: use o endereço completo, com https://." };
  if (compra && !urlValida(compra)) return { erro: "Link de compra inválido." };
  if (mapa && !urlValida(mapa))
    return { erro: "Link do Google Maps inválido." };
  if (cadastro && !urlValida(cadastro))
    return { erro: "Link de cadastro da loja inválido." };
  if (
    marcado("sede_eventos") &&
    (!t("logradouro") || !t("numero") || !t("cidade") || !t("uf"))
  )
    return {
      erro: "Sede de eventos: preencha o endereço (rua, número, cidade e UF).",
    };
  if (
    marcado("aceita_credito") &&
    (!t("pix_chave") || !/^\S+@\S+\.\S+$/.test(t("email_pedidos")))
  )
    return {
      erro: "Resgate de crédito: informe a chave Pix da loja e um e-mail válido para os pedidos.",
    };

  let logo: string | null = null;
  let foto: string | null = null;
  try {
    logo = await subirImagem(form.get("logo") as File | null, "logos");
    foto = await subirImagem(form.get("foto") as File | null, "fotos");
  } catch (e) {
    return {
      erro: e instanceof Error ? e.message : "Falha ao enviar a imagem.",
    };
  }

  const db = criarClienteAdmin();
  let slug = slugLoja(t("slug") || t("nome"));
  const { data: igual } = await db
    .from("parceiros")
    .select("id")
    .eq("slug", slug)
    .neq("id", id || "00000000-0000-0000-0000-000000000000")
    .maybeSingle();
  if (igual) slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;

  const dados = {
    nome: t("nome"),
    slug,
    descricao: nulo(t("descricao")),
    site_url: nulo(site),
    compra_deck: marcado("compra_deck"),
    mostrar_logo: marcado("mostrar_logo"),
    sede_eventos: marcado("sede_eventos"),
    aceita_credito: marcado("aceita_credito"),
    ativo: marcado("ativo"),
    ordem: Number(t("ordem")) || 0,
    cep: nulo(t("cep").replace(/\D/g, "")),
    logradouro: nulo(t("logradouro")),
    numero: nulo(t("numero")),
    complemento: nulo(t("complemento")),
    bairro: nulo(t("bairro")),
    cidade: nulo(t("cidade")),
    uf: nulo(t("uf").toUpperCase().slice(0, 2)),
    mapa_url: nulo(mapa),
    instagram: nulo(usuarioInstagram(t("instagram"))),
    whatsapp: nulo(t("whatsapp").replace(/\D/g, "")),
    horario: nulo(t("horario")),
    // Campos de seções escondidas no formulário ficam como estavam
    ...(form.has("url_compra_lista") ? { url_compra_lista: nulo(compra) } : {}),
    ...(form.has("bonus_credito_pct")
      ? {
          bonus_credito_pct: Math.min(
            100,
            Math.max(0, Number(t("bonus_credito_pct")) || 0),
          ),
          instrucoes_credito: nulo(t("instrucoes_credito")),
        }
      : {}),
    ...(form.has("mesas")
      ? {
          mesas: Number(t("mesas")) > 0 ? Number(t("mesas")) : null,
          observacoes_local: nulo(t("observacoes_local")),
        }
      : {}),
    ...(logo ? { logo_url: logo } : {}),
    ...(foto ? { foto_url: foto } : {}),
  };
  let parceiroId = id;
  if (id) {
    const { error } = await db.from("parceiros").update(dados).eq("id", id);
    if (error) return { erro: "Não foi possível salvar a loja." };
  } else {
    const { data, error } = await db
      .from("parceiros")
      .insert(dados)
      .select("id")
      .single();
    if (error || !data) return { erro: "Não foi possível salvar a loja." };
    parceiroId = data.id;
  }
  if (form.has("pix_chave"))
    await db.from("lojas_credito").upsert({
      parceiro_id: parceiroId,
      razao_social: nulo(t("razao_social")),
      cnpj: nulo(t("cnpj").replace(/\D/g, "")),
      pix_tipo: nulo(t("pix_tipo")),
      pix_chave: nulo(t("pix_chave")),
      pix_titular: nulo(t("pix_titular")),
      email_pedidos: nulo(t("email_pedidos").toLowerCase()),
      url_cadastro: nulo(cadastro),
      identificacao: ["email", "cpf", "usuario"].includes(t("identificacao"))
        ? t("identificacao")
        : "email",
      atualizado_em: new Date().toISOString(),
    });
  revalidatePath("/", "layout");
  redirect(`/painel/parceiros?editar=${parceiroId}&salvo=1#form`);
}

export async function salvarBanner(form: FormData) {
  await exigirOrganizador();
  const t = (c: string) => String(form.get(c) ?? "").trim();
  const destino = t("destino_url");
  if (!t("titulo") || !urlValida(destino))
    throw new Error("Informe título e o link de destino (com https://).");
  const posicoes = ["home", "evento", "deck"].filter(
    (p) => form.get(`pos_${p}`) === "on",
  );
  const imagem = await subirImagem(
    form.get("imagem") as File | null,
    "banners",
  );
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
      formato:
        form.get("formato") === "imagem" && imagem ? "imagem" : "composto",
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
