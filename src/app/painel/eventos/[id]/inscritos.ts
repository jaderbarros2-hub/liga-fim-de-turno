"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

async function exigirOrganizador() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data } = await supabase.from("jogadores").select("papel").eq("id", user.id).maybeSingle();
  if (data?.papel !== "organizador") throw new Error("Apenas o organizador pode fazer isso.");
  return user.id;
}

/** Confirma uma inscrição paga por fora do site (ex.: Pix direto no piloto). */
export async function confirmarManual(form: FormData) {
  const ator = await exigirOrganizador();
  const inscricaoId = String(form.get("inscricao_id"));
  const eventoId = String(form.get("evento_id"));
  const db = criarClienteAdmin();

  const { data: evento } = await db.from("eventos").select("valor_centavos").eq("id", eventoId).single();
  const agora = new Date().toISOString();
  await db.from("pagamentos").update({ status: "cancelado" }).eq("inscricao_id", inscricaoId).eq("status", "pendente");
  await db.from("pagamentos").insert({
    inscricao_id: inscricaoId,
    provedor: "manual",
    valor_centavos: evento?.valor_centavos ?? 0,
    status: "aprovado",
    pago_em: agora,
  });
  await db
    .from("inscricoes")
    .update({ status: "confirmada", confirmado_em: agora, cancelado_em: null })
    .eq("id", inscricaoId);
  await db.from("registro_atividades").insert({
    ator_id: ator,
    acao: "inscricao_confirmada_manual",
    entidade: "inscricoes",
    entidade_id: inscricaoId,
  });
  revalidatePath(`/painel/eventos/${eventoId}`);
}
