import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

/** Retorno do login com Discord: cria a sessão e manda para o cadastro se faltar algo. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const voltarBruto = searchParams.get("voltar") ?? "/minha-area";
  const voltar = voltarBruto.startsWith("/") ? voltarBruto : "/minha-area";

  if (!code) return NextResponse.redirect(`${origin}/entrar?erro=1`);

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user)
    return NextResponse.redirect(`${origin}/entrar?erro=1`);

  const { data: jogador } = await supabase
    .from("jogadores")
    .select("aceite_termos_em")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!jogador?.aceite_termos_em) {
    return NextResponse.redirect(
      `${origin}/cadastro?voltar=${encodeURIComponent(voltar)}`,
    );
  }
  return NextResponse.redirect(`${origin}${voltar}`);
}
