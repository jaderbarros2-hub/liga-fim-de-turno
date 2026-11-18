import Link from "next/link";
import { Avatar, capaDoArtigo, MiniArtigo, SecaoArtigos, TileArtigo } from "@/components/Artigos";
import { Compartilhar } from "@/components/Compartilhar";
import { Markdown } from "@/components/Markdown";
import { BannerPatrocinado } from "@/components/Parceiros";
import { creditoArte } from "@/lib/artes";
import { arteDoArtigo, CATEGORIAS, minutosDeLeitura, nomeDoAutor, type Artigo } from "@/lib/blog";
import { dataPublicacao } from "@/lib/formato";

type Props = {
  artigo: Artigo;
  publicado: boolean;
  populares: Artigo[];
  doAutor: Artigo[];
  ultimos: Artigo[];
  mesmaCategoria: Artigo[];
  loja: { id: string; nome: string } | null;
};

/** Página do artigo no formato de portal: texto à esquerda, coluna com anúncio e mais lidos à direita. */
export function ArtigoCompleto({ artigo, publicado, populares, doAutor, ultimos, mesmaCategoria, loja }: Props) {
  const autor = nomeDoAutor(artigo);
  const categoria = CATEGORIAS[artigo.categoria] ?? "Magic";
  const capa = capaDoArtigo(artigo);
  const caminho = `/blog/${artigo.slug}`;

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

      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0">
          <header className="flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-azul">
              <Link href={`/blog?categoria=${artigo.categoria}`} className="text-azul no-underline hover:text-ciano">
                {categoria}
              </Link>{" "}
              | {artigo.tipo}
            </span>
            <h1 className="font-[family-name:var(--font-titulo)] text-4xl font-bold leading-[1.05] sm:text-5xl">{artigo.titulo}</h1>
            {artigo.resumo && <p className="text-lg italic text-texto2">{artigo.resumo}</p>}
            <p className="text-sm text-cinza">
              Por <span className="font-semibold text-ciano">{autor}</span> | Publicado{" "}
              {artigo.publicado_em ? dataPublicacao(artigo.publicado_em) : "—"} | {minutosDeLeitura(artigo.conteudo)} min de leitura
            </p>
            <Compartilhar titulo={artigo.titulo} caminho={caminho} />
          </header>

          <figure className="relative mt-6 overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capa.src} alt="" style={{ objectPosition: capa.foco }} className="aspect-[16/9] w-full object-cover" />
            <span className="absolute bottom-3 left-3 rounded bg-preto/75 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {categoria}
            </span>
            {!artigo.capa_url && (
              <figcaption className="absolute bottom-3 right-3 hidden text-[11px] text-white/60 sm:block">{creditoArte(arteDoArtigo(artigo))}</figcaption>
            )}
          </figure>

          <div className="mt-8">
            <Markdown texto={artigo.conteudo} loja={loja} pagina={caminho} />
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {[
              { href: `/blog?categoria=${artigo.categoria}`, rotulo: categoria },
              { href: "/blog", rotulo: artigo.tipo },
            ].map((t) => (
              <Link key={t.rotulo} href={t.href} className="rounded-full bg-grafite px-3 py-1 text-xs font-semibold text-texto2 no-underline ring-1 ring-borda hover:text-gelo">
                {t.rotulo}
              </Link>
            ))}
          </div>

          <div className="mt-6 flex gap-4 border-t border-borda pt-6">
            <Avatar autor={artigo.autor} nome={autor} tamanho={64} />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cinza">Escrito por</span>
              <span className="font-semibold text-ciano">{autor}</span>
              {artigo.autor?.bio && <p className="text-sm text-texto2">{artigo.autor.bio}</p>}
              {artigo.autor?.link && (
                <a href={artigo.autor.link} target="_blank" rel="noopener" className="text-sm font-semibold">
                  Acompanhe {autor} →
                </a>
              )}
            </div>
          </div>
        </article>

        <aside className="flex flex-col gap-10">
          <BannerPatrocinado posicao="evento" pagina={caminho} coluna />
          {populares.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="titulo text-2xl">Mais lidos</h2>
              <div className="grid grid-cols-2 gap-2">
                {populares.map((a) => (
                  <TileArtigo key={a.id} artigo={a} />
                ))}
              </div>
            </section>
          )}
          {doAutor.length > 0 && (
            <section className="flex flex-col">
              <h2 className="titulo text-2xl">Mais de {autor}</h2>
              <div className="divide-y divide-borda">
                {doAutor.map((a) => (
                  <MiniArtigo key={a.id} artigo={a} />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      {(ultimos.length > 0 || mesmaCategoria.length > 0) && (
        <div className="border-t border-borda bg-fundo2">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
            <SecaoArtigos titulo="Últimos artigos" artigos={ultimos} href="/blog" />
            <SecaoArtigos titulo={`Mais de ${categoria}`} artigos={mesmaCategoria} href={`/blog?categoria=${artigo.categoria}`} />
          </div>
        </div>
      )}
    </>
  );
}
