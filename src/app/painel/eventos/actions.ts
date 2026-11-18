"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoEvento = { erro?: string; ok?: string };

const FORMATOS = ["pauper", "draft", "selado", "cubo"];
const STATUS = ["rascunho", "aberto", "fechado", "em_andamento", "encerrado", "resultados", "cancelado"];

/** Converte "2026-12-09T19:30" (horário de Brasília) para ISO. */
function deBrasilia(valor: string) {
  return new Date(`${valor}:00-03:00`).toISOString();
}

function criarSlug(titulo: string, inicio: string) {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${inicio.slice(0, 10)}`;
}

export async function salvarEvento(_: EstadoEvento, form: FormData): Promise<EstadoEvento> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/painel/eventos");

  const t = (c: string) => String(form.get(c) ?? "").trim();
  const id = t("id");
  const titulo = t("titulo");
  const ligaId = Number(t("liga_id"));
  const formato = t("formato");
  const inicio = t("inicio");
  const inscricoesAte = t("inscricoes_ate");
  const valor = Number(t("valor").replace(/[^\d,.-]/g, "").replace(",", "."));
  const vagas = t("vagas") ? Number(t("vagas")) : null;
  const minimo = Number(t("minimo") || "8");
  const percentual = Number(t("percentual_premio") || "80");
  const status = t("status");
  let link = t("link_endstep");
  if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`;

  if (!titulo || !ligaId || !inicio || !inscricoesAte) return { erro: "Preencha título, liga, data e prazo." };
  if (!FORMATOS.includes(formato)) return { erro: "Formato inválido." };
  if (!STATUS.includes(status)) return { erro: "Status inválido." };
  if (Number.isNaN(valor) || valor < 0) return { erro: "Valor inválido." };
  if (link && !/^https?:\/\/\S+\.\S+/i.test(link)) return { erro: "O link do Endstep não parece um endereço válido." };
  if (new Date(`${inscricoesAte}:00-03:00`) > new Date(`${inicio}:00-03:00`))
    return { erro: "O prazo de inscrição precisa ser antes do início do evento." };

  const dados = {
    titulo,
    liga_id: ligaId,
    formato,
    tipo: ["final_trimestre", "player_of_the_year"].includes(t("tipo")) ? t("tipo") : "etapa",
    colecao: t("colecao") || null,
    inicio: deBrasilia(inicio),
    inscricoes_ate: deBrasilia(inscricoesAte),
    modalidade: t("modalidade") === "presencial" ? "presencial" : "online",
    local: t("local") || null,
    valor_centavos: Math.round(valor * 100),
    vagas,
    minimo,
    percentual_premio: percentual,
    detalhes: t("detalhes") || null,
    status,
    atualizado_em: new Date().toISOString(),
  };

  let eventoId = id;
  if (id) {
    const { error } = await supabase.from("eventos").update(dados).eq("id", id);
    if (error) return { erro: `Não foi possível salvar: ${error.message}` };
  } else {
    // Mesmo título e data: acrescenta um sufixo ao endereço
    let slug = criarSlug(titulo, inicio);
    const { count } = await supabase.from("eventos").select("id", { count: "exact", head: true }).like("slug", `${slug}%`);
    if (count) slug = `${slug}-${count + 1}`;
    const { data, error } = await supabase.from("eventos").insert({ ...dados, slug }).select("id").single();
    if (error) return { erro: `Não foi possível criar: ${error.message}` };
    eventoId = data.id;
  }

  if (link) {
    const { error } = await supabase
      .from("evento_links")
      .upsert({ evento_id: eventoId, link_endstep: link, atualizado_em: new Date().toISOString() });
    if (error) return { erro: `Evento salvo, mas o link não: ${error.message}` };
  } else if (id) {
    await supabase.from("evento_links").delete().eq("evento_id", id);
  }

  await supabase.from("registro_atividades").insert({
    ator_id: user.id,
    acao: id ? "evento_editado" : "evento_criado",
    entidade: "eventos",
    entidade_id: eventoId,
  });

  revalidatePath("/", "layout");
  if (!id) redirect(`/painel/eventos/${eventoId}`);
  return {
    ok: status === "rascunho" ? "Evento salvo como rascunho (ainda não aparece no site)." : "Evento salvo e publicado no site.",
  };
}
