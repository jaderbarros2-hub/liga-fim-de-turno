import { NOME_LIGA } from "@/lib/formatos";
import { botao } from "@/components/Botao";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { contarUsos, descreverCupom, type Cupom } from "@/lib/cupons";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { alternarCupom } from "./actions";
import { FormCupom } from "./FormCupom";

const data = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })
    : null;

export default async function Cupons() {
  const db = criarClienteAdmin();
  const [{ data: cupons }, { data: eventos }, usos] = await Promise.all([
    db.from("cupons").select("*").order("criado_em", { ascending: false }),
    db
      .from("eventos")
      .select("id, titulo")
      .in("status", ["rascunho", "aberto", "fechado"])
      .order("inicio"),
    contarUsos(),
  ]);
  const lista = (cupons as Cupom[] | null) ?? [];
  const nomeEvento = new Map((eventos ?? []).map((e) => [e.id, e.titulo]));

  // Lotes aparecem agrupados numa linha só
  const linhas: {
    chave: string;
    cupom: Cupom;
    codigos: number;
    usados: number;
    ativos: number;
  }[] = [];
  for (const c of lista) {
    const chave = c.lote ?? c.id;
    const l = linhas.find((x) => x.chave === chave);
    if (l) {
      l.codigos++;
      l.usados += usos.get(c.id) ?? 0;
      if (c.ativo) l.ativos++;
    } else
      linhas.push({
        chave,
        cupom: c,
        codigos: 1,
        usados: usos.get(c.id) ?? 0,
        ativos: c.ativo ? 1 : 0,
      });
  }

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="titulo text-4xl">Cupons</h1>
        <p className="text-sm text-texto2">
          Descontos no ingresso, inclusive gratuito. O jogador digita o código
          na tela de ingresso; o uso conta quando o ingresso é confirmado.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-cinza">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Desconto</th>
              <th className="p-3">Vale para</th>
              <th className="p-3">Validade</th>
              <th className="p-3">Usos</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="border-t border-borda p-3 text-texto2"
                >
                  Nenhum cupom ainda.
                </td>
              </tr>
            )}
            {linhas.map(({ chave, cupom: c, codigos, usados, ativos }) => (
              <tr
                key={chave}
                className={`border-t border-borda ${ativos ? "" : "opacity-50"}`}
              >
                <td className="p-3">
                  <span className="font-mono font-bold">
                    {c.lote ? `${c.lote}-*****` : c.codigo}
                  </span>
                  {c.descricao && (
                    <span className="block text-xs text-cinza">
                      {c.descricao}
                    </span>
                  )}
                </td>
                <td className="p-3">{descreverCupom(c)}</td>
                <td className="p-3 text-texto2">
                  {c.evento_id
                    ? (nomeEvento.get(c.evento_id) ?? "Evento")
                    : c.formato
                      ? (NOME_LIGA[c.formato] ?? c.formato)
                      : "Qualquer evento"}
                </td>
                <td className="p-3 text-texto2">
                  {c.valido_ate ? `até ${data(c.valido_ate)}` : "Sem prazo"}
                </td>
                <td className="p-3">
                  {c.lote
                    ? `${usados} de ${codigos} códigos`
                    : `${usados}${c.limite_usos ? ` de ${c.limite_usos}` : ""}`}
                </td>
                <td className="p-3 text-right">
                  {!c.lote && (
                    <form action={alternarCupom}>
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        type="hidden"
                        name="ativo"
                        value={String(c.ativo)}
                      />
                      <BotaoEnviar
                        className={botao(c.ativo ? "perigo" : "secundario")}
                      >
                        {c.ativo ? "Desativar" : "Reativar"}
                      </BotaoEnviar>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormCupom
        eventos={(eventos ?? []).map((e) => ({ id: e.id, titulo: e.titulo }))}
      />
    </div>
  );
}
