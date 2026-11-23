import Link from "next/link";
import type { Autor } from "@/lib/blogComum";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { Editor } from "../Editor";

export default async function NovoArtigo() {
  const { data } = await criarClienteAdmin()
    .from("autores")
    .select("id, nome, bio, avatar_url, link")
    .order("nome");
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link href="/painel/blog" className="text-sm">
        ← Blog
      </Link>
      <h1 className="titulo text-4xl">Novo artigo</h1>
      <Editor autores={(data as Autor[] | null) ?? []} />
    </div>
  );
}
