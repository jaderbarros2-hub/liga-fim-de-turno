import Link from "next/link";
import { notFound } from "next/navigation";
import { VisualDeck } from "@/components/VisualDeck";
import type { ItemLista } from "@/lib/decklist";
import { buscarCartas } from "@/lib/scryfall";
import { criarClienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Organizador vê a lista registrada por qualquer inscrito. */
export default async function DeckInscrito({ params }: { params: Promise<{ id: string; inscricao: string }> }) {
  const { id, inscricao } = await params;
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("inscricoes")
    .select("deck_nome, deck_principal, deck_sideboard, deck_enviado_em, arquetipo:arquetipos(nome), jogador:jogadores(nick_endstep, nome), evento:eventos(titulo)")
    .eq("id", inscricao)
    .eq("evento_id", id)
    .maybeSingle();
  if (!data?.deck_principal) notFound();
  const i = data as unknown as {
    deck_nome: string;
    deck_principal: ItemLista[];
    deck_sideboard: ItemLista[];
    deck_enviado_em: string;
    arquetipo: { nome: string } | null;
    jogador: { nick_endstep: string | null; nome: string | null } | null;
    evento: { titulo: string } | null;
  };
  const cartas = await buscarCartas([...i.deck_principal, ...i.deck_sideboard].map((c) => c.nome));

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/painel/eventos/${id}`} className="text-sm">
        ← {i.evento?.titulo}
      </Link>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold tracking-widest text-ciano">{i.jogador?.nick_endstep || i.jogador?.nome}</span>
        <h1 className="titulo text-5xl">{i.deck_nome}</h1>
        <span className="text-sm text-cinza">
          {i.arquetipo?.nome} · registrado em {new Date(i.deck_enviado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </span>
      </div>
      <VisualDeck principal={i.deck_principal} sideboard={i.deck_sideboard} cartas={cartas} />
    </div>
  );
}
