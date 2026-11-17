import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { capaDoArtigo, ListaArtigos, MetaArtigo } from "@/components/Artigos";
import { Markdown } from "@/components/Markdown";
import { BannerPatrocinado } from "@/components/Parceiros";
import { creditoArte } from "@/lib/artes";
import { arteDoArtigo, buscarArtigo, CATEGORIAS, listarArtigos } from "@/lib/blog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artigo = await buscarArtigo((await params).slug);
  if (!artigo) return { title: "Artigo" };
  return {
    title: artigo.titulo,
    description: artigo.resumo ?? undefined,
    openGraph: { title: artigo.titulo, description: artigo.resumo ?? undefined, type: "article", images: [capaDoArtigo(artigo).src] },
  };
}

export default async function PaginaArtigo({ params }: Props) {
  const { slug } = await params;
  const artigo = await buscarArtigo(slug);
  if (!artigo) notFound();
  const publicado = artigo.status === "publicado" && !!artigo.publicado_em && artigo.publicado_em <= new Date().toISOString();
  const capa = capaDoArtigo(artigo);
  const outros = (await listarArtigos(4)).filter((a) => a.id !== artigo.id).slice(0, 3);

  return (
    <>
      {!publicado && (
        <p className="bg-azul px-6 py-2 text-center text-sm font-semibold text-white">
          Pré-visualização: este artigo ainda não está publicado.{" "}
          <Link href={`/painel/blog/${artigo.id}`} className="text-white underline">
            Voltar ao editor
          </Link>
        </p>
      )}
      <header className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={capa.src} alt="" style={{ objectPosition: capa.foco }} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-preto via-preto/80 to-preto/30" />
        <div className="mx-auto flex min-h-[380px] max-w-3xl flex-col justify-end gap-4 px-6 pb-12 pt-20">
          <Link href={`/blog?categoria=${artigo.categoria}`} className="text-xs font-semibold uppercase tracking-widest text-ciano no-underline">
            {CATEGORIAS[artigo.categoria] ?? "Magic"}
          </Link>
          <h1 className="titulo text-5xl sm:text-6xl">{artigo.titulo}</h1>
          {artigo.resumo && <p className="text-lg text-texto2">{artigo.resumo}</p>}
          <MetaArtigo artigo={artigo} />
        </div>
        {!artigo.capa_url && (
          <span className="absolute bottom-3 right-4 hidden text-[11px] text-white/50 sm:block">{creditoArte(arteDoArtigo(artigo))}</span>
        )}
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <Markdown texto={artigo.conteudo} />
      </article>

      <div className="mx-auto max-w-3xl px-6 pb-12">
        <BannerPatrocinado posicao="home" pagina={`/blog/${artigo.slug}`} />
      </div>

      {outros.length > 0 && (
        <section className="border-t border-borda bg-fundo2">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="titulo text-4xl">Continue lendo</h2>
              <Link href="/blog" className="text-sm font-semibold">
                Todos os artigos →
              </Link>
            </div>
            <ListaArtigos artigos={outros} />
          </div>
        </section>
      )}
    </>
  );
}
