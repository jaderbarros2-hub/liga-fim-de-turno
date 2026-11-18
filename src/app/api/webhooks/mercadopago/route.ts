import { NextResponse } from "next/server";
import { assinaturaValida, buscarPedido } from "@/lib/mercadopago";
import { sincronizarPorIdExterno } from "@/lib/pagamentos";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Aviso do Mercado Pago (tópico "Order"). O aviso só dispara uma nova consulta
 * à API; nenhuma informação do corpo é usada para confirmar pagamento.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  let corpo: { type?: string; data?: { id?: string } } = {};
  try {
    corpo = await req.json();
  } catch {
    // corpo vazio ou inválido
  }
  const dataId = url.searchParams.get("data.id") ?? corpo.data?.id ?? "";
  if (!dataId) return NextResponse.json({ ok: true });

  const valida = assinaturaValida(req.headers.get("x-signature"), req.headers.get("x-request-id"), dataId);
  // Registro de cada aviso recebido (ajuda a conferir os testes no Painel)
  await criarClienteAdmin()
    .from("registro_atividades")
    .insert({ acao: valida ? "webhook_recebido" : "webhook_assinatura_invalida", entidade: "mercadopago", detalhes: { id: dataId, tipo: corpo.type ?? url.searchParams.get("type") } })
    .then(() => undefined, () => undefined);
  if (!valida) {
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  }

  try {
    // Diagnóstico: guarda o que o Mercado Pago diz sobre o pedido neste momento
    const pedido = await buscarPedido(dataId).catch(() => null);
    await criarClienteAdmin()
      .from("registro_atividades")
      .insert({
        acao: "mercadopago_status",
        entidade: "mercadopago",
        detalhes: { id: dataId, pedido: pedido?.status, detalhe: pedido?.statusDetalhe, pix: pedido?.statusPagamento },
      })
      .then(() => undefined, () => undefined);
    await sincronizarPorIdExterno(dataId);
  } catch (e) {
    console.error("Webhook Mercado Pago:", e);
    return NextResponse.json({ erro: "falha" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** O painel do Mercado Pago às vezes confere se o endereço responde. */
export async function GET() {
  return NextResponse.json({ ok: true, servico: "webhook Mercado Pago · Liga Fim de Turno" });
}
