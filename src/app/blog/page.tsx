import type { Metadata } from "next";
import Link from "next/link";
import { GradeArtigos } from "@/components/Artigos";
import { CATEGORIAS, paginaDeArtigos, POR_PAGINA } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Artigos",
  description:
    "Guias de deck, metagame, relatórios das etapas e notícias da First Strike.",
};

type Props = { searchParams: Promise<{ categoria?: string; pagina?: string }> };

export default async function Blog({ searchParams }: Props) {
  const { categoria, pagina: p } = await searchParams;
  const filtro = categoria && CATEGORIAS[categoria] ? categoria : undefined;
  const pagina = Math.max(1, Number(p) || 1);
  const { artigos, total } = await paginaDeArtigos(pagina, filtro);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const link = (q: { categoria?: string; pagina?: number }) => {
    const s = new URLSearchParams();
    if (q.categoria) s.set("categoria", q.categoria);
    if (q.pagina && q.pagina > 1) s.set("pagina", String(q.pagina));
    return `/blog${s.size ? `?${s}` : ""}`;
  };

  return (
    <>
      <nav
        aria-label="Seções do blog"
        className="border-b border-borda bg-fundo2"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-6 text-sm font-semibold">
          <span className="titulo shrink-0 py-3 text-xl">Blog da liga</span>
          <Link
            href="/blog"
            className="shrink-0 border-b-2 border-vermelho py-3 text-marfim no-underline"
          >
            Artigos
          </Link>
          <Link
            href="/resultados"
            className="shrink-0 py-3 text-texto2 no-underline hover:text-marfim"
          >
            Resultados
          </Link>
          <Link
            href="/como-jogar"
            className="shrink-0 py-3 text-texto2 no-underline hover:text-marfim"
          >
            Como jogar
          </Link>
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 pb-16 pt-10">
        <h1 className="titulo text-5xl">Artigos</h1>
        <nav
          aria-label="Categorias"
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
        >
          {[
            [undefined, "Todos os artigos"] as const,
            ...Object.entries(CATEGORIAS),
          ].map(([v, r]) => (
            <Link
              key={r}
              href={link({ categoria: v })}
              aria-current={filtro === v ? "page" : undefined}
              className={
                filtro === v
                  ? "font-semibold text-brasa underline underline-offset-4"
                  : "text-texto2 no-underline hover:text-marfim"
              }
            >
              {r}
            </Link>
          ))}
        </nav>

        {artigos.length === 0 ? (
          <p className="mt-4 border-l-2 border-vermelho py-2 pl-4 text-texto2">
            {filtro
              ? "Nenhum artigo nesta categoria ainda."
              : "Os primeiros artigos estão sendo escritos. Volte em breve."}
          </p>
        ) : (
          <div className="mt-2">
            <GradeArtigos artigos={artigos} />
          </div>
        )}

        {paginas > 1 && (
          <nav
            aria-label="Páginas"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            {pagina > 1 && (
              <Link
                href={link({ categoria: filtro, pagina: pagina - 1 })}
                className="rounded px-3 py-2 ring-1 ring-borda no-underline"
              >
                ← Anteriores
              </Link>
            )}
            {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={link({ categoria: filtro, pagina: n })}
                aria-current={n === pagina ? "page" : undefined}
                className={`grid h-9 w-9 place-items-center rounded no-underline ${n === pagina ? "bg-vermelho text-white" : "text-texto2 ring-1 ring-borda"}`}
              >
                {n}
              </Link>
            ))}
            {pagina < paginas && (
              <Link
                href={link({ categoria: filtro, pagina: pagina + 1 })}
                className="rounded px-3 py-2 ring-1 ring-borda no-underline"
              >
                Próximos →
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
