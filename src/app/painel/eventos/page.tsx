import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { dataCurta, hora, NOMES_STATUS, reais } from "@/lib/formato";

export default async function EventosPainel() {
  const supabase = await criarClienteServidor();
  const { data: eventos } = await supabase
    .from("eventos")
    .select(
      "id, slug, titulo, inicio, status, valor_centavos, liga:ligas(nome)",
    )
    .order("inicio", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-5xl">Eventos</h1>
        <BotaoLink href="/painel/eventos/novo">Novo evento</BotaoLink>
      </div>
      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-cinza">
            <tr>
              <th className="p-3">Evento</th>
              <th className="p-3">Liga</th>
              <th className="p-3">Data</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(eventos ?? []).map((e) => (
              <tr key={e.id} className="border-t border-borda">
                <td className="p-3">
                  <Link href={`/painel/eventos/${e.id}`}>{e.titulo}</Link>
                </td>
                <td className="p-3">
                  {(e.liga as unknown as { nome: string } | null)?.nome}
                </td>
                <td className="p-3">
                  {dataCurta(e.inicio)} {hora(e.inicio)}
                </td>
                <td className="p-3">{reais(e.valor_centavos)}</td>
                <td className="p-3">{NOMES_STATUS[e.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
