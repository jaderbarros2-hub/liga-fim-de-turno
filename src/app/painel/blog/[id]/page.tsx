import { BotaoEnviar } from "@/components/BotaoEnviar";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Artigo, Autor } from "@/lib/blogComum";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { apagarArtigo } from "../actions";
import { Editor } from "../Editor";

export default async function EditarArtigo({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  const { id } = await params;
  const { salvo } = await searchParams;
  const db = criarClienteAdmin();
  const [{ data }, { data: autores }] = await Promise.all([
    db.from("artigos").select("*").eq("id", id).maybeSingle(),
    db.from("autores").select("id, nome, bio, avatar_url, link").order("nome"),
  ]);
  if (!data) notFound();
  const artigo = data as Artigo;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link href="/painel/blog" className="text-sm">
        ← Blog
      </Link>
      <h1 className="titulo text-5xl">Editar artigo</h1>
      {salvo && (
        <p className="rounded-lg border border-ciano/50 bg-ciano/10 p-4 font-semibold text-ciano">
          Artigo criado.
        </p>
      )}
      <Editor
        key={artigo.id}
        artigo={artigo}
        autores={(autores as Autor[] | null) ?? []}
      />
      <form action={apagarArtigo} className="border-t border-borda pt-6">
        <input type="hidden" name="id" value={artigo.id} />
        <BotaoEnviar className="text-sm font-semibold text-red-400 hover:text-red-300">
          Apagar artigo (não dá para desfazer)
        </BotaoEnviar>
      </form>
    </div>
  );
}
