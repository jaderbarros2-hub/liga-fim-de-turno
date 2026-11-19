import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaDeck } from "@/components/PaginaDeck";
import { arteFixa } from "@/lib/artes";
import type { ItemLista } from "@/lib/decklist";
import { buscarCartas } from "@/lib/scryfall";
import { criarClienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Organizador vê a lista registrada por qualquer inscrito (mesmo padrão da página pública). */
export default async function DeckInscrito({
  params,
}: {
  params: Promise<{ id: string; inscricao: string }>;
}) {
  const { id, inscricao } = await params;
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("inscricoes")
    .select(
      "deck_nome, deck_principal, deck_sideboard, deck_enviado_em, arquetipo:arquetipos(nome), jogador:jogadores(nick_endstep, nome, avatar_url), evento:eventos(titulo)",
    )
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
    jogador: {
      nick_endstep: string | null;
      nome: string | null;
      avatar_url: string | null;
    } | null;
    evento: { titulo: string } | null;
  };
  const cartas = await buscarCartas(
    [...i.deck_principal, ...i.deck_sideboard].map((c) => c.nome),
  );

  return (
    <div className="-mx-8 -my-8">
      <PaginaDeck
        principal={i.deck_principal}
        sideboard={i.deck_sideboard ?? []}
        cartas={cartas}
        titulo={i.deck_nome}
        pagina={`/painel/eventos/${id}`}
        arteReserva={arteFixa(inscricao, "pauper")}
        autor={{
          nick: i.jogador?.nick_endstep || i.jogador?.nome || "Jogador",
          avatar: i.jogador?.avatar_url ?? null,
        }}
        detalhe={`${i.arquetipo?.nome ?? "Arquétipo não informado"} · registrado em ${new Date(
          i.deck_enviado_em,
        ).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "short",
          timeStyle: "short",
        })}`}
        caminho={
          <>
            <Link href="/painel/eventos">Painel</Link>
            <span>/</span>
            <Link href={`/painel/eventos/${id}`}>{i.evento?.titulo}</Link>
          </>
        }
      />
    </div>
  );
}
