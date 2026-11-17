import Link from "next/link";
import { srcArte } from "@/lib/artes";
import { arteDoArtigo, CATEGORIAS, minutosDeLeitura, type Artigo } from "@/lib/blog";
import { dataPublicacao } from "@/lib/formato";

export function capaDoArtigo(a: Artigo) {
  if (a.capa_url) return { src: a.capa_url, foco: "50% 40%" };
  const arte = arteDoArtigo(a);
  return { src: srcArte(arte), foco: arte.foco };
}

function Meta({ artigo }: { artigo: Artigo }) {
  return (
    <span className="text-sm text-cinza">
      {artigo.autor_nome} · {artigo.publicado_em ? dataPublicacao(artigo.publicado_em) : "rascunho"} ·{" "}
      {minutosDeLeitura(artigo.conteudo)} min
    </span>
  );
}

/** Cartão de artigo. `destaque` ocupa a largura toda, com a capa ao lado. */
export function CartaoArtigo({ artigo, destaque = false }: { artigo: Artigo; destaque?: boolean }) {
  const capa = capaDoArtigo(artigo);
  return (
    <Link
      href={`/blog/${artigo.slug}`}
      className={`group flex overflow-hidden rounded-lg bg-grafite text-gelo no-underline ring-1 ring-borda transition hover:ring-ciano ${
        destaque ? "flex-col md:col-span-full md:flex-row" : "flex-col"
      }`}
    >
      <div className={`relative overflow-hidden ${destaque ? "aspect-[16/9] md:aspect-auto md:min-h-80 md:flex-[1.4]" : "aspect-[16/9]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capa.src}
          alt=""
          loading="lazy"
          style={{ objectPosition: capa.foco }}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      </div>
      <div className={`flex flex-col gap-3 p-5 ${destaque ? "md:flex-1 md:justify-center md:p-8" : "flex-1"}`}>
        <span className="text-xs font-semibold uppercase tracking-widest text-ciano">{CATEGORIAS[artigo.categoria] ?? "Magic"}</span>
        <span className={`titulo ${destaque ? "text-4xl md:text-5xl" : "text-3xl"} group-hover:text-ciano`}>{artigo.titulo}</span>
        {artigo.resumo && <span className={`text-texto2 ${destaque ? "" : "line-clamp-3 text-sm"}`}>{artigo.resumo}</span>}
        <span className="mt-auto pt-2">
          <Meta artigo={artigo} />
        </span>
      </div>
    </Link>
  );
}

export function ListaArtigos({ artigos, primeiroDestaque = false }: { artigos: Artigo[]; primeiroDestaque?: boolean }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {artigos.map((a, i) => (
        <CartaoArtigo key={a.id} artigo={a} destaque={primeiroDestaque && i === 0} />
      ))}
    </div>
  );
}

export { Meta as MetaArtigo };
