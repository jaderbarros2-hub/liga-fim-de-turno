import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Etiqueta } from "@/components/Botao";
import { VisualDeck } from "@/components/VisualDeck";
import type { ItemLista } from "@/lib/decklist";
import { buscarCartas } from "@/lib/scryfall";
import { criarClienteServidor } from "@/lib/supabase/server";
import { apagarDeck } from "../actions";
import { FormularioDeck } from "../FormularioDeck";

export const metadata: Metadata = { title: "Deck" };
export const dynamic = "force-dynamic";

const paraTexto = (principal: ItemLista[], sideboard: ItemLista[]) =>
  [...principal.map((i) => `${i.qtd} ${i.nome}`), "", "Sideboard", ...sideboard.map((i) => `${i.qtd} ${i.nome}`)].join("\n");

export default async function Deck({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  const { id } = await params;
  const { editar } = await searchParams;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?voltar=/minha-area/decks/${id}`);

  const { data: deck } = await supabase
    .from("decks")
    .select("id, jogador_id, nome, arquetipo_id, principal, sideboard, legal, problemas, arquetipo:arquetipos(nome)")
    .eq("id", id)
    .maybeSingle();
  if (!deck || deck.jogador_id !== user.id) notFound();

  const principal = deck.principal as ItemLista[];
  const sideboard = deck.sideboard as ItemLista[];
  const arquetipo = (deck.arquetipo as unknown as { nome: string } | null)?.nome;

  if (editar) {
    const { data: arquetipos } = await supabase.from("arquetipos").select("id, nome").eq("ativo", true).order("nome");
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <Link href={`/minha-area/decks/${id}`} className="text-sm">
          ← {deck.nome}
        </Link>
        <h1 className="titulo text-5xl">Editar deck</h1>
        <FormularioDeck
          arquetipos={(arquetipos ?? []).sort((a, b) => (a.nome === "Outro" ? 1 : b.nome === "Outro" ? -1 : 0))}
          valores={{ id: deck.id, nome: deck.nome, arquetipo_id: deck.arquetipo_id, lista: paraTexto(principal, sideboard) }}
        />
      </div>
    );
  }

  const cartas = await buscarCartas([...principal, ...sideboard].map((i) => i.nome));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <Link href="/minha-area/decks" className="text-sm">
        ← Meus decks
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="titulo text-5xl">{deck.nome}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-texto2">
            <span>Pauper · {arquetipo}</span>
            <Etiqueta tipo={deck.legal ? "ciano" : "alerta"}>{deck.legal ? "✓ Legal no Pauper" : "Com pendências"}</Etiqueta>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <Link href={`/minha-area/decks/${id}?editar=1`}>Editar lista</Link>
          <form action={apagarDeck}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="text-cinza hover:text-erro">
              Apagar
            </button>
          </form>
        </div>
      </div>
      {!deck.legal && (
        <ul className="list-disc rounded-xl border border-alerta bg-grafite py-4 pl-9 pr-5 text-sm text-alerta">
          {(deck.problemas as string[]).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      <VisualDeck principal={principal} sideboard={sideboard} cartas={cartas} />
    </div>
  );
}
