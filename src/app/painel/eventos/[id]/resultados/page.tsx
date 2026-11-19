import { BotaoEnviar } from "@/components/BotaoEnviar";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reais } from "@/lib/formato";
import { type Inscrito, type LinhaResultado } from "@/lib/resultados";
import { criarClienteServidor } from "@/lib/supabase/server";
import { liberarPremiosNaCarteira } from "./actions";
import { Importador } from "./Importador";

export const dynamic = "force-dynamic";

type Premio = {
  id: string;
  posicao: number | null;
  valor_centavos: number;
  status: string;
  pago_em: string | null;
  jogador: {
    nick_endstep: string | null;
    nome: string | null;
    chave_pix: string | null;
    responsavel_nome: string | null;
  } | null;
};

export default async function ResultadosEvento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data: evento } = await supabase
    .from("eventos")
    .select(
      "id, slug, titulo, formato, status, valor_centavos, percentual_premio, distribuicao_premio",
    )
    .eq("id", id)
    .maybeSingle();
  if (!evento) notFound();

  const [{ data: inscricoes }, { data: resultados }, { data: premios }] =
    await Promise.all([
      supabase
        .from("inscricoes")
        .select("jogador_id, jogador:jogadores(nick_endstep, nome)")
        .eq("evento_id", id)
        .eq("status", "confirmada"),
      supabase
        .from("resultados")
        .select(
          "posicao, nick_endstep, jogador_id, pontos, vitorias, empates, derrotas",
        )
        .eq("evento_id", id)
        .order("posicao"),
      supabase
        .from("premios")
        .select(
          "id, posicao, valor_centavos, status, pago_em, jogador:jogadores(nick_endstep, nome, chave_pix, responsavel_nome)",
        )
        .eq("evento_id", id)
        .order("posicao"),
    ]);

  type InscricaoLinha = {
    jogador_id: string;
    jogador: { nick_endstep: string | null; nome: string | null } | null;
  };
  const inscritos: Inscrito[] = (
    (inscricoes as unknown as InscricaoLinha[]) ?? []
  ).map((i) => ({
    jogadorId: i.jogador_id,
    nick: i.jogador?.nick_endstep || i.jogador?.nome || "?",
  }));
  const premioTotal = Math.floor(
    (evento.valor_centavos * inscritos.length * evento.percentual_premio) / 100,
  );
  const linhasIniciais: LinhaResultado[] = (resultados ?? []).map((r) => ({
    posicao: r.posicao,
    nick: r.nick_endstep,
    jogadorId: r.jogador_id,
    vitorias: r.vitorias,
    derrotas: r.derrotas,
    empates: r.empates,
    pontos: r.pontos,
  }));
  const lista = (premios as unknown as Premio[]) ?? [];
  const algumPago = lista.some((p) => p.status === "pago");

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/painel/eventos/${id}`} className="text-sm">
        ← {evento.titulo}
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="titulo text-5xl">Resultados</h1>
        <span className="text-sm text-cinza">
          {inscritos.length} confirmados · prêmio total {reais(premioTotal)}
        </span>
      </div>

      <Importador
        eventoId={id}
        inscritos={inscritos}
        premioTotal={premioTotal}
        formato={evento.formato}
        distribuicaoInicial={(evento.distribuicao_premio ?? []).join("/")}
        linhasIniciais={linhasIniciais}
        bloqueado={algumPago}
      />

      <section className="flex flex-col gap-3 rounded-xl border border-borda bg-grafite p-5">
        <h2 className="titulo text-2xl">3 · Liberar prêmios na Carteira</h2>
        {lista.length === 0 ? (
          <p className="text-sm text-texto2">
            Os prêmios aparecem aqui depois de salvar a classificação.
          </p>
        ) : (
          <>
            <ul className="flex flex-col border-t border-borda text-sm">
              {lista.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-borda py-3"
                >
                  <span className="w-8 font-semibold text-ciano">
                    {p.posicao}º
                  </span>
                  <span className="min-w-36 flex-1 font-semibold">
                    {p.jogador?.nick_endstep || p.jogador?.nome}
                  </span>
                  <span className="text-ciano">{reais(p.valor_centavos)}</span>
                  {p.status === "pago" ? (
                    <span className="text-ciano">
                      ✓ Na Carteira{" "}
                      {p.pago_em
                        ? new Date(p.pago_em).toLocaleDateString("pt-BR")
                        : ""}
                    </span>
                  ) : (
                    <span className="text-alerta">Aguardando liberação</span>
                  )}
                </li>
              ))}
            </ul>
            {lista.some((p) => p.status !== "pago") && (
              <form
                action={liberarPremiosNaCarteira}
                className="flex flex-wrap items-center gap-4"
              >
                <input type="hidden" name="evento_id" value={id} />
                <BotaoEnviar className="min-h-11 rounded-lg bg-azul px-5 font-semibold text-white">
                  Liberar prêmios na Carteira
                </BotaoEnviar>
                <span className="text-xs text-cinza">
                  Depois de liberar, a classificação fica travada. Saques
                  aparecem em Painel → Financeiro.
                </span>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}
