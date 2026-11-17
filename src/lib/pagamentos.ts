import "server-only";
import { buscarPedido } from "@/lib/mercadopago";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export type SituacaoPagamento = "pendente" | "aprovado" | "expirado" | "cancelado" | "reembolsado";

/** Marca o pagamento como aprovado e confirma a inscrição. Idempotente. */
export async function confirmarPagamento(pagamentoId: string, pagoEm?: string, origem = "mercadopago") {
  const db = criarClienteAdmin();
  const { data: pag } = await db
    .from("pagamentos")
    .select("id, status, inscricao_id")
    .eq("id", pagamentoId)
    .maybeSingle();
  if (!pag) return;

  const quando = pagoEm ?? new Date().toISOString();
  if (pag.status !== "aprovado") {
    await db.from("pagamentos").update({ status: "aprovado", pago_em: quando }).eq("id", pag.id);
  }
  // Confirma mesmo que o Pix tenha chegado depois da expiração da tela: o dinheiro entrou.
  await db
    .from("inscricoes")
    .update({ status: "confirmada", confirmado_em: quando, cancelado_em: null })
    .eq("id", pag.inscricao_id)
    .neq("status", "confirmada");

  await db.from("registro_atividades").insert({
    acao: "pagamento_confirmado",
    entidade: "pagamentos",
    entidade_id: pag.id,
    detalhes: { origem },
  });
}

/**
 * Consulta o Mercado Pago e atualiza o pagamento e a inscrição.
 * Chamado pela tela de pagamento (consulta periódica) e pelo webhook.
 */
export async function sincronizarPagamento(pagamentoId: string): Promise<SituacaoPagamento | null> {
  const db = criarClienteAdmin();
  const { data: pag } = await db
    .from("pagamentos")
    .select("id, status, id_externo, expira_em, inscricao_id")
    .eq("id", pagamentoId)
    .maybeSingle();
  if (!pag) return null;
  if (pag.status !== "pendente") return pag.status as SituacaoPagamento;

  if (pag.id_externo) {
    const pedido = await buscarPedido(pag.id_externo);
    if (pedido?.status === "processed") {
      await confirmarPagamento(pag.id, pedido.pagoEm);
      return "aprovado";
    }
    if (pedido && ["canceled", "expired", "failed"].includes(pedido.status)) {
      await expirar(pag.id, pag.inscricao_id, pedido.status === "canceled" ? "cancelado" : "expirado");
      return pedido.status === "canceled" ? "cancelado" : "expirado";
    }
  }

  // Passou do prazo do Pix (com folga de 2 min para avisos atrasados)
  if (pag.expira_em && new Date(pag.expira_em).getTime() + 120_000 < Date.now()) {
    await expirar(pag.id, pag.inscricao_id, "expirado");
    return "expirado";
  }
  return "pendente";
}

async function expirar(pagamentoId: string, inscricaoId: string, status: "expirado" | "cancelado") {
  const db = criarClienteAdmin();
  await db.from("pagamentos").update({ status }).eq("id", pagamentoId).eq("status", "pendente");
  await db
    .from("inscricoes")
    .update({ status: "expirada" })
    .eq("id", inscricaoId)
    .eq("status", "aguardando_pagamento");
}

/** Usado pelo webhook: o Mercado Pago avisa com o id do pedido. */
export async function sincronizarPorIdExterno(idExterno: string) {
  const db = criarClienteAdmin();
  const { data } = await db.from("pagamentos").select("id").eq("id_externo", idExterno).maybeSingle();
  if (data) await sincronizarPagamento(data.id);
}
