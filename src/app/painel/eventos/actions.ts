"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { congelarCubo, guardarArteColecao, importarColecao, importarCubo, procurarColecoes, type ColecaoResumo, type CuboResumo } from "@/lib/limited";
import { criarClienteAdmin } from "@/lib/supabase/admin";
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

  // Limited: coleção (draft/selado) ou cubo
  let colecaoCodigo: string | null = null;
  let cuboId: string | null = null;
  let nomeLimited = t("colecao") || null;
  let pacotes: number | null = null;
  try {
    if (formato === "draft" || formato === "selado") {
      const cod = t("colecao_codigo").toLowerCase();
      if (cod) {
        const { data: existe } = await criarClienteAdmin().from("colecoes").select("codigo, nome").eq("codigo", cod).maybeSingle();
        const c = existe ?? (await importarColecao(cod));
        colecaoCodigo = c.codigo;
        nomeLimited = c.nome;
        const arte = form.get("arte_colecao");
        if (arte instanceof File && arte.size) await guardarArteColecao(c.codigo, arte, t("arte_credito"));
      }
      pacotes = Number(t("pacotes")) || (formato === "draft" ? 3 : 6);
    } else if (formato === "cubo") {
      const link = t("cubo_link");
      if (link) {
        const cubo = await importarCubo(link);
        cuboId = cubo.id;
        nomeLimited = cubo.nome;
      }
    }
  } catch (e) {
    return { erro: (e as Error).message };
  }

  const dados = {
    titulo,
    liga_id: ligaId,
    formato,
    tipo: ["final_trimestre", "player_of_the_year"].includes(t("tipo")) ? t("tipo") : "etapa",
    colecao: formato === "pauper" ? null : nomeLimited,
    colecao_codigo: colecaoCodigo,
    cubo_id: cuboId,
    pacotes,
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

  if (cuboId) await congelarCubo(eventoId, cuboId, form.get("atualizar_lista") === "on");

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

async function exigirEquipe() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("jogadores").select("papel").eq("id", user.id).maybeSingle();
  return data?.papel === "organizador" || data?.papel === "juiz";
}

/** Busca de coleções no Scryfall para o formulário. */
export async function buscarColecoes(termo: string): Promise<{ lista?: ColecaoResumo[]; erro?: string }> {
  if (!(await exigirEquipe())) return { erro: "Sem permissão." };
  try {
    return { lista: await procurarColecoes(termo) };
  } catch (e) {
    return { erro: (e as Error).message };
  }
}

/** Prévia do cubo do Cube Cobra para o formulário (já guarda a lista mais recente). */
export async function previsualizarCubo(link: string): Promise<{ cubo?: CuboResumo; erro?: string }> {
  if (!(await exigirEquipe())) return { erro: "Sem permissão." };
  try {
    return { cubo: await importarCubo(link) };
  } catch (e) {
    return { erro: (e as Error).message };
  }
}
