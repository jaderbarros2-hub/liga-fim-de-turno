import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BotaoLink, Etiqueta } from "@/components/Botao";
import { criarClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Meus decks" };
export const dynamic = "force-dynamic";

export default async function MeusDecks() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/minha-area/decks");

  const { data } = await supabase
    .from("decks")
    .select("id, nome, legal, qtd_principal, qtd_sideboard, atualizado_em, arquetipo:arquetipos(nome)")
    .eq("jogador_id", user.id)
    .order("atualizado_em", { ascending: false });
  const decks =
    (data as unknown as {
      id: string;
      nome: string;
      legal: boolean;
      qtd_principal: number;
      qtd_sideboard: number;
      arquetipo: { nome: string } | null;
    }[]) ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <Link href="/minha-area" className="text-sm">
        ← Minha área
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="titulo text-5xl">Meus decks</h1>
        <BotaoLink href="/minha-area/decks/novo">Novo deck</BotaoLink>
      </div>
      {decks.length === 0 ? (
        <p className="text-texto2">
          Nenhum deck ainda. Importe a lista que você montou no Endstep para usar nas etapas da Liga Pauper.
        </p>
      ) : (
        <ul className="flex flex-col border-t border-borda">
          {decks.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-borda py-3">
              <Link href={`/minha-area/decks/${d.id}`} className="min-w-56 flex-1 font-semibold text-gelo no-underline hover:text-ciano">
                {d.nome}
              </Link>
              <span className="text-sm text-cinza">{d.arquetipo?.nome}</span>
              <span className="text-sm text-cinza">
                {d.qtd_principal} + {d.qtd_sideboard}
              </span>
              <Etiqueta tipo={d.legal ? "ciano" : "alerta"}>{d.legal ? "Legal no Pauper" : "Com pendências"}</Etiqueta>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
