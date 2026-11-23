import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { FormularioDeck } from "../FormularioDeck";

export const metadata: Metadata = { title: "Novo deck" };
export const dynamic = "force-dynamic";

export default async function NovoDeck({
  searchParams,
}: {
  searchParams: Promise<{ formato?: string }>;
}) {
  const { formato } = await searchParams;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/minha-area/decks/novo");
  const { data: arquetipos } = await supabase
    .from("arquetipos")
    .select("id, nome, formato")
    .eq("ativo", true)
    .order("nome");
  // "Outro" sempre por último
  const lista = (arquetipos ?? []).sort((a, b) =>
    a.nome === "Outro" ? 1 : b.nome === "Outro" ? -1 : 0,
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <Link href="/minha-area?aba=decks" className="text-sm">
        ← Meus decks
      </Link>
      <h1 className="titulo text-4xl">Novo deck</h1>
      <FormularioDeck
        arquetipos={lista}
        formatoInicial={formato === "premodern" ? "premodern" : "pauper"}
      />
    </div>
  );
}
