import Link from "next/link";
import { srcArte } from "@/lib/artes";
import {
  arteDoArtigo,
  CATEGORIAS,
  minutosDeLeitura,
  nomeDoAutor,
  type Artigo,
  type Autor,
} from "@/lib/blog";
import { dataCartao } from "@/lib/formato";

export function capaDoArtigo(a: Artigo) {
  if (a.capa_url) return { src: a.capa_url, foco: "50% 40%" };
  const arte = arteDoArtigo(a);
  return { src: srcArte(arte), foco: arte.foco };
}

export function Avatar({
  autor,
  nome,
  tamanho = 28,
}: {
  autor: Autor | null;
  nome: string;
  tamanho?: number;
}) {
  if (autor?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={autor.avatar_url}
        alt=""
        width={tamanho}
        height={tamanho}
        className="shrink-0 rounded-full object-cover"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-vermelho font-semibold text-white"
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }}
    >
      {nome.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function Relogio() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx="6"
        cy="6"
        r="5"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
      <path
        d="M6 3.2V6l1.8 1.2"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Cartão no padrão de portal: capa com formato e tempo de leitura, tipo, título, linha fina, autor e data. */
export function CartaoArtigo({ artigo }: { artigo: Artigo }) {
  const capa = capaDoArtigo(artigo);
  const autor = nomeDoAutor(artigo);
  return (
    <Link
      href={`/blog/${artigo.slug}`}
      className="group flex flex-col overflow-hidden rounded-md bg-grafite text-marfim no-underline ring-1 ring-borda transition hover:-translate-y-0.5 hover:text-marfim hover:ring-brasa"
    >
      <div className="relative aspect-[2/1] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capa.src}
          alt=""
          loading="lazy"
          style={{ objectPosition: capa.foco }}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-preto/90 to-transparent" />
        <span className="absolute bottom-2.5 left-3 text-sm font-bold uppercase tracking-wide text-white">
          {CATEGORIAS[artigo.categoria] ?? "Magic"}
        </span>
        <span className="absolute bottom-2.5 right-3 flex items-center gap-1 text-xs font-medium text-white/90">
          <Relogio /> {minutosDeLeitura(artigo.conteudo)} min de leitura
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-3.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-vermelho">
          {artigo.tipo}
        </span>
        <span className="line-clamp-2 text-[17px] font-bold leading-snug group-hover:text-brasa">
          {artigo.titulo}
        </span>
        {artigo.resumo && (
          <span className="line-clamp-2 text-sm text-texto2">
            {artigo.resumo}
          </span>
        )}
        <span className="mt-auto flex items-center justify-between gap-3 pt-3 text-[13px] text-cinza">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar autor={artigo.autor} nome={autor} tamanho={24} />
            <span className="truncate text-texto2">{autor}</span>
          </span>
          {artigo.publicado_em && (
            <span className="shrink-0">{dataCartao(artigo.publicado_em)}</span>
          )}
        </span>
      </div>
    </Link>
  );
}

export function GradeArtigos({ artigos }: { artigos: Artigo[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {artigos.map((a) => (
        <CartaoArtigo key={a.id} artigo={a} />
      ))}
    </div>
  );
}

/** Faixa com título, "Ver todos" e a grade de cartões (home e fim do artigo). */
export function SecaoArtigos({
  titulo,
  artigos,
  href,
  grande = false,
}: {
  titulo: string;
  artigos: Artigo[];
  href: string;
  grande?: boolean;
}) {
  if (!artigos.length) return null;
  return (
    <section className={`flex flex-col ${grande ? "gap-8" : "gap-4"}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className={`titulo ${grande ? "text-4xl" : "text-2xl"}`}>
          {titulo}
        </h2>
        <Link href={href} className="text-sm font-semibold">
          Ver todos →
        </Link>
      </div>
      <GradeArtigos artigos={artigos} />
    </section>
  );
}

/** Bloco escuro com título sobre a arte (coluna "Mais lidos"). */
export function TileArtigo({ artigo }: { artigo: Artigo }) {
  const capa = capaDoArtigo(artigo);
  return (
    <Link
      href={`/blog/${artigo.slug}`}
      className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-md p-3 text-white no-underline ring-1 ring-borda hover:text-white hover:ring-brasa"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={capa.src}
        alt=""
        loading="lazy"
        style={{ objectPosition: capa.foco }}
        className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-preto via-preto/75 to-preto/10" />
      <span className="line-clamp-3 text-sm font-bold leading-snug">
        {artigo.titulo}
      </span>
      <span className="mt-1 truncate text-[11px] text-white/70">
        Por {nomeDoAutor(artigo)}
      </span>
    </Link>
  );
}

/** Linha compacta com miniatura (coluna "Mais de"). */
export function MiniArtigo({ artigo }: { artigo: Artigo }) {
  const capa = capaDoArtigo(artigo);
  return (
    <Link
      href={`/blog/${artigo.slug}`}
      className="group flex gap-3 py-3 text-marfim no-underline hover:text-marfim"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={capa.src}
        alt=""
        loading="lazy"
        style={{ objectPosition: capa.foco }}
        className="h-14 w-14 shrink-0 rounded object-cover"
      />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-brasa">
          {artigo.titulo}
        </span>
        {artigo.publicado_em && (
          <span className="text-xs text-cinza">
            {dataCartao(artigo.publicado_em)}
          </span>
        )}
      </span>
    </Link>
  );
}
