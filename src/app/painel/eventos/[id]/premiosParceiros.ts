"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sortearPremioParceiro } from "@/lib/premiosParceiros";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

async function exigirOrganizador() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data } = await supabase
    .from("jogadores")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.papel !== "organizador")
    throw new Error("Apenas o organizador pode fazer isso.");
}

async function atualizarPaginas(eventoId: string) {
  const { data } = await criarClienteAdmin()
    .from("eventos")
    .select("slug")
    .eq("id", eventoId)
    .maybeSingle();
  revalidatePath(`/painel/eventos/${eventoId}`);
  revalidatePath(`/painel/eventos/${eventoId}/resultados`);
  if (data?.slug) revalidatePath(`/eventos/${data.slug}`);
}

export async function adicionarPremioParceiro(form: FormData) {
  await exigirOrganizador();
  const t = (c: string) => String(form.get(c) ?? "").trim();
  const eventoId = t("evento_id");
  const descricao = t("descricao");
  if (!t("parceiro_id") || !descricao) {
    redirect(`/painel/eventos/${eventoId}?erro_premio=1#premios-parceiros`);
  }
  const criterio = t("criterio") === "sorteio" ? "sorteio" : "posicao";
  const valor = Math.round(Number(t("valor").replace(",", ".")) * 100);
  await criarClienteAdmin()
    .from("premios_parceiros")
    .insert({
      evento_id: eventoId,
      parceiro_id: t("parceiro_id"),
      tipo: ["cupom", "booster", "brinde"].includes(t("tipo"))
        ? t("tipo")
        : "cupom",
      descricao: descricao.slice(0, 120),
      valor_centavos: Number.isFinite(valor) && valor > 0 ? valor : null,
      criterio,
      posicao:
        criterio === "posicao"
          ? Math.min(Math.max(Number(t("posicao")) || 1, 1), 64)
          : null,
      codigo: t("codigo").slice(0, 60) || null,
      validade: t("validade") || null,
    });
  await atualizarPaginas(eventoId);
  redirect(`/painel/eventos/${eventoId}?ok_premio=1#premios-parceiros`);
}

export async function removerPremioParceiro(form: FormData) {
  await exigirOrganizador();
  const eventoId = String(form.get("evento_id"));
  await criarClienteAdmin()
    .from("premios_parceiros")
    .delete()
    .eq("id", String(form.get("id")))
    .is("entregue_em", null);
  await atualizarPaginas(eventoId);
  redirect(`/painel/eventos/${eventoId}#premios-parceiros`);
}

export async function sortearPremio(form: FormData) {
  await exigirOrganizador();
  const eventoId = String(form.get("evento_id"));
  let erro = "";
  try {
    await sortearPremioParceiro(String(form.get("id")));
  } catch (e) {
    erro = (e as Error).message;
  }
  await atualizarPaginas(eventoId);
  redirect(
    `/painel/eventos/${eventoId}/resultados?${erro ? `erro_sorteio=${encodeURIComponent(erro)}` : "sorteado=1"}#premios-parceiros`,
  );
}
