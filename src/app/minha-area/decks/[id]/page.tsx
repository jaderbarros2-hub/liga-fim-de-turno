import { botao } from "@/components/Botao";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PaginaDeck } from "@/components/PaginaDeck";
import { arteFixa } from "@/lib/artes";
import type { ItemLista } from "@/lib/decklist";
import { buscarCartas } from "@/lib/scryfall";
import { criarClienteServidor } from "@/lib/supabase/server";
import { apagarDeck } from "../actions";
import { FormularioDeck } from "../FormularioDeck";

export const metadata: Metadata = { title: "Deck" };
export const dynamic = "force-dynamic";

const paraTexto = (principal: ItemLista[], sideboard: ItemLista[]) =>
  [
    ...principal.map((i) => `${i.qtd} ${i.nome}`),
    "",
    "Sideboard",
    ...sideboard.map((i) => `${i.qtd} ${i.nome}`),
  ].join("\n");

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
    .select(
      "id, jogador_id, nome, formato, arquetipo_id, principal, sideboard, legal, problemas, arquetipo:arquetipos(nome)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!deck || deck.jogador_id !== user.id) notFound();

  const principal = deck.principal as ItemLista[];
  const sideboard = deck.sideboard as ItemLista[];
  const arquetipo = (deck.arquetipo as unknown as { nome: string } | null)
    ?.nome;

  if (editar) {
    const { data: arquetipos } = await supabase
      .from("arquetipos")
      .select("id, nome, formato")
      .eq("ativo", true)
      .order("nome");
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <Link href={`/minha-area/decks/${id}`} className="text-sm">
          ← {deck.nome}
        </Link>
        <h1 className="titulo text-4xl">Editar deck</h1>
        <FormularioDeck
          arquetipos={(arquetipos ?? []).sort((a, b) =>
            a.nome === "Outro" ? 1 : b.nome === "Outro" ? -1 : 0,
          )}
          valores={{
            id: deck.id,
            nome: deck.nome,
            arquetipo_id: deck.arquetipo_id,
            formato: deck.formato,
            lista: paraTexto(principal, sideboard),
          }}
        />
      </div>
    );
  }

  const [cartas, { data: eu }] = await Promise.all([
    buscarCartas([...principal, ...sideboard].map((i) => i.nome)),
    supabase
      .from("jogadores")
      .select("nick_endstep, discord_nome, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return (
    <PaginaDeck
      principal={principal}
      sideboard={sideboard}
      cartas={cartas}
      titulo={deck.nome}
      pagina={`/minha-area/decks/${id}`}
      arteReserva={arteFixa(id, "pauper")}
      autor={{
        nick: eu?.nick_endstep || eu?.discord_nome || "Você",
        avatar: eu?.avatar_url ?? null,
      }}
      detalhe={`Pauper${arquetipo ? ` · ${arquetipo}` : ""}`}
      caminho={
        <>
          <Link href="/minha-area">Minha área</Link>
          <span>/</span>
          <Link href="/minha-area?aba=decks">Meus decks</Link>
        </>
      }
      etiquetas={
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${deck.legal ? "bg-brasa/20 text-brasa" : "bg-alerta/20 text-alerta"}`}
        >
          {deck.legal ? "Legal no Pauper" : "Com pendências"}
        </span>
      }
      acoes={
        <>
          <Link
            href={`/minha-area/decks/${id}?editar=1`}
            className="text-sm font-semibold"
          >
            Editar lista
          </Link>
          <form action={apagarDeck}>
            <input type="hidden" name="id" value={id} />
            <BotaoEnviar className={botao("perigo")} pendente="Apagando…">
              Apagar deck
            </BotaoEnviar>
          </form>
        </>
      }
      aviso={
        !deck.legal && (
          <ul className="list-disc rounded-md border border-alerta bg-grafite py-4 pl-9 pr-5 text-sm text-alerta">
            {(deck.problemas as string[]).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )
      }
    />
  );
}
