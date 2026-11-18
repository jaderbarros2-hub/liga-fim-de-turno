import { reais } from "@/lib/formato";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { cancelarMovimento, concluirMovimento } from "./actions";

type Pendente = {
  id: string;
  tipo: "saque" | "envio_loja";
  valor_centavos: number;
  descricao: string | null;
  automatico: boolean;
  chave_pix: string | null;
  criado_em: string;
  jogador: { nick_endstep: string | null; nome: string | null; chave_pix: string | null; pix_tipo: string | null; pix_verificado_em: string | null; responsavel_nome: string | null } | null;
  parceiro: { id: string; nome: string; bonus_credito_pct: number } | null;
};

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const NOME_TIPO: Record<string, string> = { cpf: "CPF", email: "E-mail", telefone: "Telefone", aleatoria: "Aleatória" };

export default async function Financeiro() {
  const db = criarClienteAdmin();
  const [{ data }, { data: saldos }, { data: avisos }] = await Promise.all([
    db
      .from("carteira_movimentos")
      .select(
        "id, tipo, valor_centavos, descricao, automatico, chave_pix, criado_em, jogador:jogadores(nick_endstep, nome, chave_pix, pix_tipo, pix_verificado_em, responsavel_nome), parceiro:parceiros(id, nome, bonus_credito_pct)",
      )
      .eq("status", "pendente")
      .order("criado_em"),
    db.from("carteira_movimentos").select("valor_centavos").neq("status", "cancelado"),
    db.from("registro_atividades").select("id, acao, detalhes, criado_em").in("acao", ["webhook_recebido", "webhook_assinatura_invalida", "pagamento_confirmado"]).order("criado_em", { ascending: false }).limit(10),
  ]);
  const pendentes = (data as unknown as Pendente[]) ?? [];
  const saques = pendentes.filter((p) => p.tipo === "saque");
  const envios = pendentes.filter((p) => p.tipo === "envio_loja");
  const porLoja = new Map<string, Pendente[]>();
  for (const e of envios) porLoja.set(e.parceiro?.nome ?? "Loja", [...(porLoja.get(e.parceiro?.nome ?? "Loja") ?? []), e]);
  const emCarteiras = (saldos ?? []).reduce((s, m) => s + m.valor_centavos, 0);

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="titulo text-5xl">Financeiro</h1>
        <p className="text-sm text-texto2">Saques por Pix, envios para lojas parceiras e o total guardado nas Carteiras.</p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Saques a pagar", reais(-saques.reduce((s, m) => s + m.valor_centavos, 0)), `${saques.length} pedido(s)`],
          ["Repasses a lojas", reais(-envios.reduce((s, m) => s + m.valor_centavos, 0)), `${envios.length} pedido(s)`],
          ["Saldo nas Carteiras", reais(emCarteiras), "Disponível para os jogadores"],
        ].map(([r, v, t]) => (
          <div key={r} className="flex flex-col gap-1 rounded-xl border border-borda bg-grafite p-5">
            <dt className="text-xs font-bold uppercase tracking-wider text-cinza">{r}</dt>
            <dd className="titulo text-3xl">{v}</dd>
            <span className="text-sm text-texto2">{t}</span>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-3xl">Saques por Pix</h2>
        <p className="text-sm text-cinza">
          Faça o Pix pelo app do banco e confira se o nome do titular bate com o cadastro. Marque a conferência na primeira vez: a
          chave fica verificada.
        </p>
        {saques.length === 0 ? (
          <p className="text-texto2">Nenhum saque pendente.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda">
            {saques.map((s) => {
              const chave = s.chave_pix ?? s.jogador?.chave_pix;
              return (
                <li key={s.id} className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                    <span className="min-w-40 flex-1">
                      <strong>{s.jogador?.nick_endstep || s.jogador?.nome}</strong>
                      <span className="block text-xs text-cinza">
                        {s.jogador?.nome}
                        {s.jogador?.responsavel_nome ? ` · responsável: ${s.jogador.responsavel_nome}` : ""}
                      </span>
                    </span>
                    <span className="text-sm text-texto2">
                      {s.descricao}
                      {s.automatico && " · automático"} · {quando(s.criado_em)}
                    </span>
                    <strong className="titulo text-2xl text-ciano">{reais(-s.valor_centavos)}</strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span>
                      Pix ({NOME_TIPO[s.jogador?.pix_tipo ?? ""] ?? "chave"}): <strong className="select-all font-mono">{chave ?? "não cadastrada"}</strong>
                    </span>
                    {s.jogador?.pix_verificado_em ? (
                      <span className="text-ciano">✓ titular conferido</span>
                    ) : (
                      <span className="text-alerta">titular ainda não conferido</span>
                    )}
                    <form action={concluirMovimento} className="ml-auto flex flex-wrap items-center gap-3">
                      <input type="hidden" name="id" value={s.id} />
                      {!s.jogador?.pix_verificado_em && (
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name="titular_conferido" className="h-4 w-4 accent-[#2e6bff]" /> Conferi o nome do titular
                        </label>
                      )}
                      <button type="submit" className="min-h-9 rounded-lg bg-azul px-4 font-semibold text-white">
                        Marcar como pago
                      </button>
                    </form>
                    <form action={cancelarMovimento}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="motivo" value="Chave Pix com problema" />
                      <button type="submit" className="font-semibold text-cinza hover:text-erro" title="Devolve o valor para a Carteira do jogador">
                        Devolver à Carteira
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-3xl">Envios para lojas parceiras</h2>
        <p className="text-sm text-cinza">
          Repasse o valor à loja (com o bônus dela, se houver, por conta da loja). Quando a loja liberar o crédito, anote o código e
          marque como repassado: o jogador vê o código na Carteira.
        </p>
        {porLoja.size === 0 ? (
          <p className="text-texto2">Nenhum envio pendente.</p>
        ) : (
          [...porLoja.entries()].map(([loja, itens]) => (
            <div key={loja} className="flex flex-col rounded-xl border border-borda">
              <div className="flex items-center justify-between border-b border-borda bg-grafite px-4 py-3">
                <strong>{loja}</strong>
                <span className="text-sm">
                  Total a repassar: <strong className="text-ciano">{reais(-itens.reduce((s, m) => s + m.valor_centavos, 0))}</strong>
                </span>
              </div>
              <ul className="divide-y divide-borda">
                {itens.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
                    <span className="min-w-36 flex-1 font-semibold">{e.jogador?.nick_endstep || e.jogador?.nome}</span>
                    <span>
                      {reais(-e.valor_centavos)}
                      {e.parceiro?.bonus_credito_pct ? (
                        <span className="text-ciano"> → {reais(Math.round(-e.valor_centavos * (1 + e.parceiro.bonus_credito_pct / 100)))} na loja</span>
                      ) : null}
                    </span>
                    <span className="text-cinza">{quando(e.criado_em)}</span>
                    <form action={concluirMovimento} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={e.id} />
                      <input name="codigo_loja" placeholder="Código do crédito" className="min-h-9 w-40 rounded-md border border-borda-forte bg-fundo2 px-2" />
                      <button type="submit" className="font-semibold text-ciano">
                        Marcar repassado
                      </button>
                    </form>
                    <form action={cancelarMovimento}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="text-cinza hover:text-erro">
                        Cancelar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-3xl">Avisos do Mercado Pago</h2>
        <p className="text-sm text-cinza">Últimos avisos automáticos (webhook) e pagamentos confirmados. Útil para conferir os testes.</p>
        {(avisos ?? []).length === 0 ? (
          <p className="text-texto2">Nenhum aviso recebido ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda text-sm">
            {(avisos ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5">
                <span className="w-32 text-cinza">{quando(a.criado_em)}</span>
                <span className={a.acao === "webhook_assinatura_invalida" ? "font-semibold text-erro" : "font-semibold"}>
                  {a.acao === "webhook_recebido" ? "Aviso recebido" : a.acao === "pagamento_confirmado" ? "Pagamento confirmado" : "Assinatura inválida"}
                </span>
                <span className="font-mono text-xs text-texto2">{JSON.stringify(a.detalhes)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
