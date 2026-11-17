import { chaveCarta, grupoDaCarta, ORDEM_GRUPOS, total, type Carta, type ItemLista } from "@/lib/decklist";

/** Lista do deck organizada por tipo, curva de mana e imagem da carta ao passar o mouse. */
export function VisualDeck({
  principal,
  sideboard,
  cartas,
}: {
  principal: ItemLista[];
  sideboard: ItemLista[];
  cartas: Map<string, Carta>;
}) {
  const grupos = new Map<string, ItemLista[]>();
  for (const i of principal) {
    const g = grupoDaCarta(cartas.get(chaveCarta(i.nome))?.tipo ?? "");
    grupos.set(g, [...(grupos.get(g) ?? []), i]);
  }
  const ordenar = (itens: ItemLista[]) =>
    [...itens].sort(
      (a, b) =>
        (cartas.get(chaveCarta(a.nome))?.cmc ?? 0) - (cartas.get(chaveCarta(b.nome))?.cmc ?? 0) ||
        a.nome.localeCompare(b.nome),
    );

  // Curva de mana (sem terrenos): 0, 1, 2, 3, 4, 5, 6+
  const curva = [0, 0, 0, 0, 0, 0, 0];
  for (const i of principal) {
    const c = cartas.get(chaveCarta(i.nome));
    if (!c || grupoDaCarta(c.tipo) === "Terrenos") continue;
    curva[Math.min(6, Math.floor(Number(c.cmc)))] += i.qtd;
  }
  const maxCurva = Math.max(1, ...curva);

  const contar = (g: string) => total(grupos.get(g) ?? []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-8">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-texto2">
          <span>
            <strong className="text-gelo">{contar("Criaturas")}</strong> criaturas
          </span>
          <span>
            <strong className="text-gelo">{total(principal) - contar("Criaturas") - contar("Terrenos")}</strong> outras mágicas
          </span>
          <span>
            <strong className="text-gelo">{contar("Terrenos")}</strong> terrenos
          </span>
          <span>
            <strong className="text-gelo">{total(principal)}</strong> no deck · <strong className="text-gelo">{total(sideboard)}</strong> no sideboard
          </span>
        </div>
        <div aria-label="Curva de mana" className="flex items-end gap-1.5">
          {curva.map((q, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-cinza">{q || ""}</span>
              <div className="w-6 rounded-sm bg-azul" style={{ height: `${Math.max(2, (q / maxCurva) * 56)}px` }} />
              <span className="text-[10px] text-cinza">{i === 6 ? "6+" : i}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {ORDEM_GRUPOS.filter((g) => grupos.has(g)).map((g) => (
          <Bloco key={g} titulo={g} itens={ordenar(grupos.get(g)!)} cartas={cartas} />
        ))}
        {sideboard.length > 0 && <Bloco titulo="Sideboard" itens={ordenar(sideboard)} cartas={cartas} />}
      </div>
    </div>
  );
}

function Bloco({ titulo, itens, cartas }: { titulo: string; itens: ItemLista[]; cartas: Map<string, Carta> }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h3 className="mb-2 flex justify-between border-b border-borda pb-1 text-sm font-semibold text-cinza">
        <span>{titulo}</span>
        <span>{total(itens)}</span>
      </h3>
      <ul className="flex flex-col">
        {itens.map((i) => {
          const c = cartas.get(chaveCarta(i.nome));
          return (
            <li key={i.nome} className="group relative flex items-center gap-2 py-0.5 text-sm">
              <span className="w-5 text-right font-semibold text-ciano">{i.qtd}</span>
              <span className="flex-1 truncate">{c?.nome ?? i.nome}</span>
              {c?.custo && <span className="font-mono text-[11px] text-cinza">{c.custo.replace(/[{}]/g, "")}</span>}
              {c?.imagem_grande && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.imagem_grande}
                  alt=""
                  loading="lazy"
                  className="pointer-events-none absolute left-full top-0 z-20 ml-3 hidden w-56 rounded-xl shadow-2xl group-hover:block"
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
