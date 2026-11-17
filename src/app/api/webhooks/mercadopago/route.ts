import { NextResponse } from "next/server";
import { assinaturaValida } from "@/lib/mercadopago";
import { sincronizarPorIdExterno } from "@/lib/pagamentos";

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

  if (!assinaturaValida(req.headers.get("x-signature"), req.headers.get("x-request-id"), dataId)) {
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  }

  try {
    await sincronizarPorIdExterno(dataId);
  } catch (e) {
    console.error("Webhook Mercado Pago:", e);
    return NextResponse.json({ erro: "falha" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
