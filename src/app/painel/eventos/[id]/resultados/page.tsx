import Link from "next/link";
import { notFound } from "next/navigation";
import { reais } from "@/lib/formato";
import { DISTRIBUICAO_PADRAO, type Inscrito, type LinhaResultado } from "@/lib/resultados";
import { criarClienteServidor } from "@/lib/supabase/server";
import { marcarPremioPago } from "./actions";
import { Importador } from "./Importador";

export const dynamic = "force-dynamic";

type Premio = {
  id: string;
  posicao: number | null;
  valor_centavos: number;
  status: string;
  pago_em: string | null;
  jogador: { nick_endstep: string | null; nome: string | null; chave_pix: string | null; responsavel_nome: string | null } | null;
};

export default async function ResultadosEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data: evento } = await supabase
    .from("eventos")
    .select("id, slug, titulo, status, valor_centavos, percentual_premio, distribuicao_premio")
    .eq("id", id)
    .maybeSingle();
  if (!evento) notFound();

  const [{ data: inscricoes }, { data: resultados }, { data: premios }] = await Promise.all([
    supabase
      .from("inscricoes")
      .select("jogador_id, jogador:jogadores(nick_endstep, nome)")
      .eq("evento_id", id)
      .eq("status", "confirmada"),
    supabase
      .from("resultados")
      .select("posicao, nick_endstep, jogador_id, pontos, vitorias, empates, derrotas")
      .eq("evento_id", id)
      .order("posicao"),
    supabase
      .from("premios")
      .select("id, posicao, valor_centavos, status, pago_em, jogador:jogadores(nick_endstep, nome, chave_pix, responsavel_nome)")
      .eq("evento_id", id)
      .order("posicao"),
  ]);

  type InscricaoLinha = { jogador_id: string; jogador: { nick_endstep: string | null; nome: string | null } | null };
  const inscritos: Inscrito[] = ((inscricoes as unknown as InscricaoLinha[]) ?? []).map((i) => ({
    jogadorId: i.jogador_id,
    nick: i.jogador?.nick_endstep || i.jogador?.nome || "?",
  }));
  const premioTotal = Math.floor((evento.valor_centavos * inscritos.length * evento.percentual_premio) / 100);
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
        distribuicaoInicial={(evento.distribuicao_premio ?? DISTRIBUICAO_PADRAO).join("/")}
        linhasIniciais={linhasIniciais}
        bloqueado={algumPago}
      />

      <section className="flex flex-col gap-3 rounded-xl border border-borda bg-grafite p-5">
        <h2 className="titulo text-2xl">3 · Pagar prêmios</h2>
        {lista.length === 0 ? (
          <p className="text-sm text-texto2">Os prêmios aparecem aqui depois de salvar a classificação.</p>
        ) : (
          <ul className="flex flex-col border-t border-borda text-sm">
            {lista.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-borda py-3">
                <span className="w-8 font-semibold text-ciano">{p.posicao}º</span>
                <span className="min-w-36 flex-1 font-semibold">{p.jogador?.nick_endstep || p.jogador?.nome}</span>
                <span className="text-ciano">{reais(p.valor_centavos)}</span>
                <span className="text-cinza">
                  Pix: <strong className="select-all text-gelo">{p.jogador?.chave_pix || "não cadastrado"}</strong>
                  {p.jogador?.responsavel_nome ? ` · responsável: ${p.jogador.responsavel_nome}` : ""}
                </span>
                {p.status === "pago" ? (
                  <span className="text-ciano">✓ Pago {p.pago_em ? new Date(p.pago_em).toLocaleDateString("pt-BR") : ""}</span>
                ) : (
                  <form action={marcarPremioPago} className="flex items-center gap-2">
                    <input type="hidden" name="premio_id" value={p.id} />
                    <input type="hidden" name="evento_id" value={id} />
                    <input
                      name="observacao"
                      placeholder="ID do Pix (opcional)"
                      className="min-h-9 w-44 rounded-md border border-borda-forte bg-fundo2 px-2 text-sm"
                    />
                    <button type="submit" className="font-semibold text-ciano hover:text-gelo">
                      Marcar como pago
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-cinza">
          Faça o Pix pelo app do banco e marque aqui; o prazo é de 48h.
        </p>
      </section>
    </div>
  );
}
