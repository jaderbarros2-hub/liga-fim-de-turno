const imagem = (nome: string) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(nome)}&format=image&version=normal`;

export type LojaDaCarta = { id: string; nome: string } | null;

/**
 * Carta em destaque no meio do artigo (linha só com [[Nome]]): imagem grande, link para o Scryfall
 * e, quando há loja parceira, botão de compra com clique rastreado.
 */
export function CartaDestaque({ nome, loja, pagina }: { nome: string; loja?: LojaDaCarta; pagina?: string }) {
  const comprar = loja
    ? `/ir/${loja.id}?${new URLSearchParams({ o: "deck", p: pagina ?? "/blog", lista: `1 ${nome}` })}`
    : null;
  return (
    <figure className="not-prose my-8 flex flex-col items-center gap-5 rounded-lg bg-grafite p-5 ring-1 ring-borda sm:flex-row sm:items-start">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imagem(nome)} alt={nome} loading="lazy" className="!my-0 w-56 shrink-0 rounded-[4.75%/3.5%] shadow-xl shadow-preto" />
      <figcaption className="flex flex-col gap-3 self-center">
        <span className="text-2xl font-bold text-gelo">{nome}</span>
        <div className="flex flex-wrap gap-3">
          {comprar && (
            <a href={comprar} target="_blank" rel="sponsored noopener" className="corte inline-flex min-h-10 items-center bg-azul px-5 text-sm font-semibold text-white no-underline hover:bg-azul-escuro hover:text-white">
              Comprar na {loja!.nome}
            </a>
          )}
          <a
            href={`https://scryfall.com/search?q=${encodeURIComponent(`!"${nome}"`)}`}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-10 items-center rounded px-4 text-sm font-semibold text-gelo no-underline ring-1 ring-borda-forte hover:text-gelo hover:ring-ciano"
          >
            Ver no Scryfall
          </a>
        </div>
      </figcaption>
    </figure>
  );
}
