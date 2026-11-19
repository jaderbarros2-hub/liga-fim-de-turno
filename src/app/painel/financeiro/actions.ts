"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { emailResgateParaLoja, emailSaquePago } from "@/lib/emails";
import { redirect } from "next/navigation";
import { buscarPedido } from "@/lib/mercadopago";
import { sincronizarPagamento } from "@/lib/pagamentos";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

async function exigirOrganizador() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/painel/financeiro");
  const { data } = await supabase
    .from("jogadores")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.papel !== "organizador") throw new Error("Apenas o organizador.");
  return user.id;
}

/** Saque ou envio concluído (Pix feito ou valor repassado à loja). */
export async function concluirMovimento(form: FormData) {
  const ator = await exigirOrganizador();
  const id = String(form.get("id"));
  const db = criarClienteAdmin();
  const { data: m } = await db
    .from("carteira_movimentos")
    .select("id, jogador_id, tipo")
    .eq("id", id)
    .eq("status", "pendente")
    .maybeSingle();
  if (!m) return;
  await db
    .from("carteira_movimentos")
    .update({ status: "concluido", concluido_em: new Date().toISOString() })
    .eq("id", id);
  // Nome do titular conferido no app do banco: marca a chave Pix como verificada
  if (m.tipo === "saque" && form.get("titular_conferido") === "on")
    await db
      .from("jogadores")
      .update({ pix_verificado_em: new Date().toISOString() })
      .eq("id", m.jogador_id);
  after(() =>
    m.tipo === "saque" ? emailSaquePago(id) : emailResgateParaLoja(id),
  );
  await db.from("registro_atividades").insert({
    ator_id: ator,
    acao: `${m.tipo}_concluido`,
    entidade: "carteira_movimentos",
    entidade_id: id,
  });
  revalidatePath("/painel/financeiro");
  redirect(`/painel/financeiro?ok=${m.tipo}`);
}

/** Cancela o pedido: o valor volta para a Carteira do jogador. */
export async function cancelarMovimento(form: FormData) {
  const ator = await exigirOrganizador();
  const id = String(form.get("id"));
  const db = criarClienteAdmin();
  await db
    .from("carteira_movimentos")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("status", "pendente");
  await db.from("registro_atividades").insert({
    ator_id: ator,
    acao: "movimento_cancelado",
    entidade: "carteira_movimentos",
    entidade_id: id,
    detalhes: { motivo: String(form.get("motivo") ?? "") },
  });
  revalidatePath("/painel/financeiro");
  redirect("/painel/financeiro?ok=cancelado");
}

/** Consulta o pedido no Mercado Pago agora (diagnóstico) e confirma se já estiver pago. */
export async function consultarPix(form: FormData) {
  await exigirOrganizador();
  const id = String(form.get("id"));
  const db = criarClienteAdmin();
  const { data: pag } = await db
    .from("pagamentos")
    .select("id, id_externo")
    .eq("id", id)
    .maybeSingle();
  if (!pag?.id_externo) return;
  const pedido = await buscarPedido(pag.id_externo).catch(() => null);
  await db.from("registro_atividades").insert({
    acao: "mercadopago_status",
    entidade: "mercadopago",
    detalhes: {
      id: pag.id_externo,
      pedido: pedido?.status ?? "sem resposta",
      detalhe: pedido?.statusDetalhe,
      pix: pedido?.statusPagamento,
      origem: "consulta manual",
    },
  });
  await sincronizarPagamento(pag.id);
  revalidatePath("/painel/financeiro");
}
