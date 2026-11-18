import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaDeck } from "@/components/PaginaDeck";
import { BannerPatrocinado } from "@/components/Parceiros";
import { arteDoEvento } from "@/lib/artes";
import { NOMES_TIPO } from "@/lib/circuito";
import { buscarEvento } from "@/lib/dados";
import { decksDaClassificacao, TOP_PUBLICO } from "@/lib/decksEvento";
import { dataLonga } from "@/lib/formato";
import { lojaParaDeck } from "@/lib/parceiros";
import { buscarCartas } from "@/lib/scryfall";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; posicao: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, posicao } = await params;
  const evento = await buscarEvento(slug);
  if (!evento) return { title: "Deck" };
  const deck = (await decksDaClassificacao(evento.id)).find((d) => d.posicao === Number(posicao));
  return { title: `${deck?.arquetipo ?? deck?.deckNome ?? "Deck"} · ${deck?.nick ?? ""} · ${evento.titulo}` };
}

const etiqueta = "rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide";

/** Lista pública de um deck do top 8, depois do resultado publicado. */
export default async function DeckPublico({ params }: Props) {
  const { slug, posicao } = await params;
  const pos = Number(posicao);
  const evento = await buscarEvento(slug);
  if (!evento || !Number.isInteger(pos) || pos < 1 || pos > TOP_PUBLICO) notFound();

  const todos = await decksDaClassificacao(evento.id, true);
  const deck = todos.find((d) => d.posicao === pos);
  if (!deck?.principal) notFound();
  const sideboard = deck.sideboard ?? [];

  const [cartas, loja, { data: res }] = await Promise.all([
    buscarCartas([...deck.principal, ...sideboard].map((i) => i.nome)),
    lojaParaDeck(),
    criarClienteAdmin().from("resultados").select("vitorias, derrotas, empates").eq("evento_id", evento.id).eq("posicao", pos).maybeSingle(),
  ]);
  const pagina = `/eventos/${slug}/deck/${pos}`;
  const top = todos.filter((d) => d.posicao <= TOP_PUBLICO && d.temLista);

  return (
    <PaginaDeck
      principal={deck.principal}
      sideboard={sideboard}
      cartas={cartas}
      titulo={deck.arquetipo ?? deck.deckNome ?? "Deck"}
      pagina={pagina}
      arteReserva={arteDoEvento(evento)}
      loja={loja ? { id: loja.id, nome: loja.nome, aceitaLista: !!loja.url_compra_lista } : null}
      autor={{ nick: deck.nick, avatar: null }}
      detalhe={dataLonga(evento.inicio)}
      caminho={
        <>
          <Link href={`/ligas/${evento.formato === "pauper" ? "pauper" : "limited"}`}>{evento.formato === "pauper" ? "Pauper" : "Limited"}</Link>
          <span>/</span>
          <Link href={`/eventos/${slug}?aba=resultados`}>{evento.titulo}</Link>
        </>
      }
      etiquetas={
        <>
          <span className={`${etiqueta} bg-azul text-white`}>{pos}º lugar</span>
          {evento.tipo !== "etapa" && <span className={`${etiqueta} bg-ciano/20 text-ciano`}>{NOMES_TIPO[evento.tipo]}</span>}
          {res && (
            <span className={`${etiqueta} bg-preto/60 text-gelo ring-1 ring-borda`}>
              {res.vitorias}-{res.derrotas}
              {res.empates ? `-${res.empates}` : ""}
            </span>
          )}
        </>
      }
      rodape={
        <>
          <BannerPatrocinado posicao="deck" pagina={pagina} />
          {top.length > 1 && (
            <section className="flex flex-col gap-4 border-t border-borda pt-8">
              <h2 className="titulo text-3xl">Top 8 de {evento.titulo}</h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {top.map((d) => (
                  <li key={d.posicao}>
                    <Link
                      href={`/eventos/${slug}/deck/${d.posicao}`}
                      aria-current={d.posicao === pos ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-md p-3 text-gelo no-underline ring-1 hover:text-gelo hover:ring-ciano ${
                        d.posicao === pos ? "bg-azul/15 ring-azul" : "bg-grafite ring-borda"
                      }`}
                    >
                      <span className="titulo w-8 text-2xl text-cinza">{d.posicao}º</span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold">{d.arquetipo ?? d.deckNome ?? "Deck"}</span>
                        <span className="truncate text-xs text-texto2">{d.nick}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      }
    />
  );
}
