import { botao } from "@/components/Botao";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { criarClienteServidor } from "@/lib/supabase/server";
import { adicionarArquetipo, alternarArquetipo } from "./actions";

export const dynamic = "force-dynamic";

export default async function Arquetipos() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("arquetipos")
    .select("id, nome, ativo")
    .eq("formato", "pauper")
    .order("nome");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="titulo text-5xl">Arquétipos · Pauper</h1>
      <p className="text-sm text-texto2">
        Lista que os jogadores usam para classificar o deck. Arquétipos
        desativados somem da escolha, mas continuam nos eventos antigos.
      </p>
      <form action={adicionarArquetipo} className="flex flex-wrap gap-2">
        <input
          name="nome"
          required
          placeholder="Novo arquétipo"
          className="min-h-11 flex-1 rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo"
        />
        <BotaoEnviar className="min-h-11 rounded-lg bg-azul px-5 font-semibold text-white">
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
