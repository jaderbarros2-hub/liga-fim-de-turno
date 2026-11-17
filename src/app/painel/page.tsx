import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { dataCurta, hora, NOMES_STATUS } from "@/lib/formato";

export default async function VisaoGeral() {
  const supabase = await criarClienteServidor();
  const { data: eventos } = await supabase
    .from("eventos")
    .select("id, slug, titulo, inicio, status")
    .in("status", ["rascunho", "aberto", "fechado", "em_andamento", "encerrado"])
    .order("inicio", { ascending: true })
    .limit(10);

  const ids = (eventos ?? []).map((e) => e.id);
  const { data: inscricoes } = ids.length
    ? await supabase.from("inscricoes").select("evento_id, status").in("evento_id", ids)
    : { data: [] as { evento_id: string; status: string }[] };

  const contar = (id: string, status: string) =>
    (inscricoes ?? []).filter((i) => i.evento_id === id && i.status === status).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-5xl">Visão geral</h1>
        <BotaoLink href="/painel/eventos/novo">Novo evento</BotaoLink>
      </div>
      <h2 className="titulo text-3xl">Próximos eventos</h2>
      {(eventos ?? []).length === 0 ? (
        <p className="text-texto2">Nenhum evento ainda. Crie o primeiro.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-borda">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-cinza">
              <tr>
                <th className="p-3">Evento</th>
                <th className="p-3">Data</th>
                <th className="p-3">Status</th>
                <th className="p-3">Confirmados</th>
                <th className="p-3">Pix pendentes</th>
              </tr>
            </thead>
            <tbody>
              {(eventos ?? []).map((e) => (
                <tr key={e.id} className="border-t border-borda">
                  <td className="p-3">
                    <Link href={`/painel/eventos/${e.id}`}>{e.titulo}</Link>
                  </td>
                  <td className="p-3">
                    {dataCurta(e.inicio)} {hora(e.inicio)}
                  </td>
                  <td className="p-3">{NOMES_STATUS[e.status]}</td>
                  <td className="p-3">{contar(e.id, "confirmada")}</td>
                  <td className="p-3">{contar(e.id, "aguardando_pagamento")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
