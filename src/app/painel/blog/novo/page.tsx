import Link from "next/link";
import { usuarioAtual } from "@/lib/dados";
import { Editor } from "../Editor";

export default async function NovoArtigo() {
  const eu = await usuarioAtual();
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link href="/painel/blog" className="text-sm">
        ← Blog
      </Link>
      <h1 className="titulo text-5xl">Novo artigo</h1>
      <Editor autorPadrao={eu?.nick_endstep || eu?.nome || ""} />
    </div>
  );
}
