import type { Metadata } from "next";
import Link from "next/link";
import { ListaArtigos } from "@/components/Artigos";
import { CATEGORIAS, listarArtigos } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Blog",
  description: "Artigos sobre Pauper, Limited, metagame e os bastidores da Liga Fim de Turno.",
};

export default async function Blog({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const filtro = categoria && CATEGORIAS[categoria] ? categoria : undefined;
  const artigos = await listarArtigos(60, filtro);

  const aba = (valor: string | undefined, rotulo: string) => (
    <Link
      key={rotulo}
      href={valor ? `/blog?categoria=${valor}` : "/blog"}
      aria-current={filtro === valor ? "page" : undefined}
      className={`py-4 no-underline ${filtro === valor ? "border-b-2 border-azul text-gelo" : "text-cinza hover:text-gelo"}`}
    >
      {rotulo}
    </Link>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="titulo text-6xl sm:text-7xl">Blog</h1>
        <p className="max-w-2xl text-lg text-texto2">
          Metagame, guias de deck, relatórios das etapas e tudo o que acontece na liga.
        </p>
      </div>
      <nav aria-label="Categorias" className="flex flex-wrap gap-x-6 border-b border-borda text-sm font-semibold">
        {aba(undefined, "Todos")}
        {Object.entries(CATEGORIAS).map(([v, r]) => aba(v, r))}
      </nav>
      {artigos.length === 0 ? (
        <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
          {filtro ? "Nenhum artigo nesta categoria ainda." : "Os primeiros artigos estão sendo escritos. Volte em breve."}
        </p>
      ) : (
        <ListaArtigos artigos={artigos} primeiroDestaque={!filtro} />
      )}
    </div>
  );
}
