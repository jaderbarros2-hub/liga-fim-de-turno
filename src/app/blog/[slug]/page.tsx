import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { capaDoArtigo } from "@/components/Artigos";
import { ArtigoCompleto } from "@/components/ArtigoCompleto";
import {
  artigosPopulares,
  buscarArtigo,
  listarArtigos,
  registrarLeitura,
} from "@/lib/blog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artigo = await buscarArtigo((await params).slug);
  if (!artigo) return { title: "Artigo" };
  return {
    title: artigo.titulo,
    description: artigo.resumo ?? undefined,
    openGraph: {
      title: artigo.titulo,
      description: artigo.resumo ?? undefined,
      type: "article",
      images: [capaDoArtigo(artigo).src],
    },
  };
}

export default async function PaginaArtigo({ params }: Props) {
  const { slug } = await params;
  const artigo = await buscarArtigo(slug);
  if (!artigo) notFound();
  const publicado =
    artigo.status === "publicado" &&
    !!artigo.publicado_em &&
    artigo.publicado_em <= new Date().toISOString();

  const [populares, doAutor, ultimos, mesmaCategoria] = await Promise.all([
    artigosPopulares(6, artigo.id),
    artigo.autor_id
      ? listarArtigos(5, { autor: artigo.autor_id, excluir: artigo.id })
      : Promise.resolve([]),
    listarArtigos(4, { excluir: artigo.id }),
    listarArtigos(4, { categoria: artigo.categoria, excluir: artigo.id }),
    publicado ? registrarLeitura(artigo.slug) : Promise.resolve(),
  ]);

  return (
    <ArtigoCompleto
      artigo={artigo}
      publicado={publicado}
      populares={populares}
      doAutor={doAutor}
      ultimos={ultimos}
      mesmaCategoria={mesmaCategoria}
      loja={null}
    />
  );
}
