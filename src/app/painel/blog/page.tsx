import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { CATEGORIAS, type Artigo } from "@/lib/blogComum";
import { dataPublicacao } from "@/lib/formato";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export default async function PainelBlog() {
  const { data } = await criarClienteAdmin()
    .from("artigos")
    .select("id, slug, titulo, categoria, status, publicado_em, atualizado_em")
    .order("atualizado_em", { ascending: false });
  const artigos = (data as (Artigo & { atualizado_em: string })[] | null) ?? [];
  const agora = new Date().toISOString();

  const situacao = (a: Artigo) =>
    a.status === "rascunho"
      ? "Rascunho"
      : a.publicado_em && a.publicado_em > agora
        ? `Agendado · ${dataPublicacao(a.publicado_em)}`
        : "Publicado";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-4xl">Blog</h1>
        <div className="flex items-center gap-5">
          <Link href="/painel/blog/autores" className="text-sm font-semibold">
            Autores
          </Link>
          <BotaoLink href="/painel/blog/novo">Novo artigo</BotaoLink>
        </div>
      </div>
      {artigos.length === 0 ? (
        <p className="text-texto2">Nenhum artigo ainda. Escreva o primeiro.</p>
      ) : (
        <ul className="flex flex-col border-t border-borda">
          {artigos.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-borda py-3 text-sm"
            >
              <Link
                href={`/painel/blog/${a.id}`}
                className="min-w-60 flex-1 text-base font-semibold text-marfim"
              >
                {a.titulo}
              </Link>
              <span className="text-cinza">
                {CATEGORIAS[a.categoria] ?? a.categoria}
              </span>
              <span
                className={
                  a.status === "publicado" ? "text-brasa" : "text-cinza"
                }
              >
                {situacao(a)}
              </span>
              <span className="text-cinza">
                editado {dataPublicacao(a.atualizado_em)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
