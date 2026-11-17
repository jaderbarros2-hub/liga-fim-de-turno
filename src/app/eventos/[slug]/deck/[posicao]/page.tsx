import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcoesLista, ComprarDeck } from "@/components/ComprarDeck";
import { BannerPatrocinado } from "@/components/Parceiros";
import { VisualDeck } from "@/components/VisualDeck";
import { lojaParaDeck } from "@/lib/parceiros";
import { buscarEvento } from "@/lib/dados";
import { decksDaClassificacao, TOP_PUBLICO } from "@/lib/decksEvento";
import { buscarCartas } from "@/lib/scryfall";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Deck" };

/** Lista pública de um deck do top 8, depois do resultado publicado. */
export default async function DeckPublico({ params }: { params: Promise<{ slug: string; posicao: string }> }) {
  const { slug, posicao } = await params;
  const pos = Number(posicao);
  const evento = await buscarEvento(slug);
  if (!evento || !Number.isInteger(pos) || pos < 1 || pos > TOP_PUBLICO) notFound();

  const deck = (await decksDaClassificacao(evento.id, true)).find((d) => d.posicao === pos);
  if (!deck?.principal) notFound();
  const [cartas, loja] = await Promise.all([
    buscarCartas([...deck.principal, ...(deck.sideboard ?? [])].map((i) => i.nome)),
    lojaParaDeck(),
  ]);
  const lista = [
    ...deck.principal.map((i) => `${i.qtd} ${i.nome}`),
    ...(deck.sideboard?.length ? ["", "Sideboard", ...deck.sideboard.map((i) => `${i.qtd} ${i.nome}`)] : []),
  ].join("\n");
  const pagina = `/eventos/${slug}/deck/${pos}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <Link href={`/eventos/${slug}?aba=resultados`} className="text-sm">
        ← {evento.titulo}
      </Link>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold tracking-widest text-ciano">{pos}º LUGAR · {deck.nick}</span>
        <h1 className="titulo text-5xl">{deck.arquetipo ?? deck.deckNome}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {loja && (
          <ComprarDeck loja={{ id: loja.id, nome: loja.nome, aceitaLista: !!loja.url_compra_lista }} lista={lista} pagina={pagina} />
        )}
        <AcoesLista lista={lista} nome={`${deck.arquetipo ?? deck.deckNome ?? "deck"} - ${deck.nick}`} />
      </div>
      <VisualDeck principal={deck.principal} sideboard={deck.sideboard ?? []} cartas={cartas} />
      <BannerPatrocinado posicao="deck" pagina={pagina} />
    </div>
  );
}
