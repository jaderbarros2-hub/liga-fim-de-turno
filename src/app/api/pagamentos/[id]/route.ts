import { NextResponse } from "next/server";
import { sincronizarPagamento } from "@/lib/pagamentos";
import { criarClienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Consulta da tela de pagamento: só o dono do pagamento pode perguntar. */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ erro: "não autenticado" }, { status: 401 });

  // A regra de acesso (RLS) só devolve o pagamento se ele for do jogador
  const { data } = await supabase
    .from("pagamentos")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!data)
    return NextResponse.json({ erro: "não encontrado" }, { status: 404 });

  const status = await sincronizarPagamento(id);
  return NextResponse.json({ status });
}
