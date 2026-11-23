import Link from "next/link";
import { botao } from "@/components/Botao";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { criarClienteServidor } from "@/lib/supabase/server";
import { adicionarArquetipo, alternarArquetipo } from "./actions";

export const dynamic = "force-dynamic";

export default async function Arquetipos({
  searchParams,
}: {
  searchParams: Promise<{ formato?: string }>;
}) {
  const formato =
    (await searchParams).formato === "premodern" ? "premodern" : "pauper";
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("arquetipos")
    .select("id, nome, ativo")
    .eq("formato", formato)
    .order("nome");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="titulo text-5xl">Arquétipos</h1>
      <nav aria-label="Formato" className="flex gap-2">
        {[
          ["pauper", "Pauper"],
          ["premodern", "Premodern"],
        ].map(([v, r]) => (
          <Link
            key={v}
            href={`/painel/arquetipos?formato=${v}`}
            aria-current={formato === v ? "page" : undefined}
            className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold no-underline ring-1 ${formato === v ? "bg-vermelho text-white ring-vermelho hover:text-white" : "text-texto2 ring-borda-forte hover:text-marfim hover:ring-brasa"}`}
          >
            {r}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-texto2">
        Lista que os jogadores usam para classificar o deck. Arquétipos
        desativados somem da escolha, mas continuam nos eventos antigos.
      </p>
      <form action={adicionarArquetipo} className="flex flex-wrap gap-2">
        <input type="hidden" name="formato" value={formato} />
        <input
          name="nome"
          required
          placeholder={`Novo arquétipo de ${formato === "premodern" ? "Premodern" : "Pauper"}`}
          className="min-h-11 flex-1 rounded-lg border border-borda-forte bg-fundo2 px-3 text-marfim"
        />
        <BotaoEnviar className="min-h-11 rounded-lg bg-vermelho px-5 font-semibold text-white">
          Adicionar
        </BotaoEnviar>
      </form>
      <ul className="flex flex-col border-t border-borda text-sm">
        {(data ?? []).map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between border-b border-borda py-2"
          >
            <span className={a.ativo ? "" : "text-cinza line-through"}>
              {a.nome}
            </span>
            <form action={alternarArquetipo}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="ativo" value={String(a.ativo)} />
              <BotaoEnviar className={botao(a.ativo ? "perigo" : "secundario")}>
                {a.ativo ? "Desativar" : "Reativar"}
              </BotaoEnviar>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
