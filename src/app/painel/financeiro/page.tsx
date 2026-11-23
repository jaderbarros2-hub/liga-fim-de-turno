import { botao } from "@/components/Botao";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { reais } from "@/lib/formato";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import {
  cancelarMovimento,
  concluirMovimento,
  consultarPix,
  reenviarEmailLoja,
} from "./actions";

type Pendente = {
  id: string;
  tipo: "saque" | "envio_loja";
  valor_centavos: number;
  descricao: string | null;
  automatico: boolean;
  chave_pix: string | null;
  criado_em: string;
  jogador: {
    nick_endstep: string | null;
    nome: string | null;
    chave_pix: string | null;
    pix_tipo: string | null;
    pix_verificado_em: string | null;
    responsavel_nome: string | null;
  } | null;
  credito_centavos: number | null;
  conta_loja: string | null;
  codigo_loja: string | null;
  parceiro: {
    id: string;
    nome: string;
    bonus_credito_pct: number;
    credito: {
      pix_tipo: string | null;
      pix_chave: string | null;
      pix_titular: string | null;
      email_pedidos: string | null;
    } | null;
  } | null;
};

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
const NOME_TIPO: Record<string, string> = {
  cpf: "CPF",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Aleatória",
};

const CONFIRMACOES: Record<string, string> = {
  saque:
    "Saque confirmado. O jogador recebeu um e-mail avisando que o Pix foi feito.",
  envio_loja:
    "Pix para a loja confirmado. A loja recebeu por e-mail o pedido para gerar o crédito do jogador.",
  cancelado: "Pedido cancelado. O valor voltou para a Carteira do jogador.",
  reenviado:
    "Pedido reenviado para a loja. Confira o resultado em Painel → E-mails.",
};

export default async function Financeiro({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const db = criarClienteAdmin();
  const [
    { data },
    { data: saldos },
    { data: avisos },
    { data: pixPendentes },
    { data: recentes },
  ] = await Promise.all([
    db
      .from("carteira_movimentos")
      .select(
        "id, tipo, valor_centavos, descricao, automatico, chave_pix, criado_em, jogador:jogadores(nick_endstep, nome, chave_pix, pix_tipo, pix_verificado_em, responsavel_nome), parceiro:parceiros(id, nome, bonus_credito_pct, credito:lojas_credito(pix_tipo, pix_chave, pix_titular, email_pedidos)), credito_centavos, conta_loja, codigo_loja",
      )
      .eq("status", "pendente")
      .order("criado_em"),
    db
      .from("carteira_movimentos")
      .select("valor_centavos")
      .neq("status", "cancelado"),
    db
      .from("registro_atividades")
      .select("id, acao, detalhes, criado_em")
      .in("acao", [
        "webhook_recebido",
        "webhook_assinatura_invalida",
        "pagamento_confirmado",
        "mercadopago_status",
      ])
      .order("criado_em", { ascending: false })
      .limit(10),
    db
      .from("pagamentos")
      .select(
        "id, id_externo, valor_centavos, criado_em, expira_em, inscricao:inscricoes(jogador:jogadores(nick_endstep), evento:eventos(titulo))",
      )
      .eq("status", "pendente")
      .eq("provedor", "mercadopago")
      .order("criado_em", { ascending: false })
      .limit(10),
    db
      .from("carteira_movimentos")
      .select(
        "id, tipo, status, valor_centavos, credito_centavos, codigo_loja, concluido_em, criado_em, jogador:jogadores(nick_endstep, nome), parceiro:parceiros(nome)",
      )
      .in("tipo", ["saque", "envio_loja"])
      .neq("status", "pendente")
      .order("criado_em", { ascending: false })
      .limit(8),
  ]);
  const pendentes = (data as unknown as Pendente[]) ?? [];
  const saques = pendentes.filter((p) => p.tipo === "saque");
  const envios = pendentes.filter((p) => p.tipo === "envio_loja");
  const porLoja = new Map<string, Pendente[]>();
  for (const e of envios)
    porLoja.set(e.parceiro?.nome ?? "Loja", [
      ...(porLoja.get(e.parceiro?.nome ?? "Loja") ?? []),
      e,
    ]);
  const emCarteiras = (saldos ?? []).reduce((s, m) => s + m.valor_centavos, 0);

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="titulo text-5xl">Financeiro</h1>
        <p className="text-sm text-texto2">
          Saques por Pix, envios para lojas parceiras e o total guardado nas
          Carteiras.
        </p>
        {ok && CONFIRMACOES[ok] && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-md border border-brasa/50 bg-brasa/10 p-3 text-sm font-semibold text-brasa"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              aria-hidden="true"
            >
              <path d="m5 12 5 5L20 7" />
            </svg>
            {CONFIRMACOES[ok]}
          </p>
        )}
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          [
            "Saques a pagar",
            reais(Math.abs(saques.reduce((s, m) => s + m.valor_centavos, 0))),
            `${saques.length} pedido(s)`,
          ],
          [
            "Resgates em lojas",
            reais(Math.abs(envios.reduce((s, m) => s + m.valor_centavos, 0))),
            `${envios.length} pedido(s)`,
          ],
          [
            "Saldo nas Carteiras",
            reais(emCarteiras),
            "Disponível para os jogadores",
          ],
        ].map(([r, v, t]) => (
          <div
            key={r}
            className="flex flex-col gap-1 rounded-xl border border-borda bg-grafite p-5"
          >
            <dt className="text-xs font-bold uppercase tracking-wider text-cinza">
              {r}
            </dt>
            <dd className="titulo text-3xl">{v}</dd>
            <span className="text-sm text-texto2">{t}</span>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-3xl">Saques por Pix</h2>
        <p className="text-sm text-cinza">
          Faça o Pix pelo app do banco e confira se o nome do titular bate com o
          cadastro. Marque a conferência na primeira vez: a chave fica
          verificada.
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
                      <strong>
                        {s.jogador?.nick_endstep || s.jogador?.nome}
                      </strong>
                      <span className="block text-xs text-cinza">
                        {s.jogador?.nome}
                        {s.jogador?.responsavel_nome
                          ? ` · responsável: ${s.jogador.responsavel_nome}`
                          : ""}
                      </span>
                    </span>
                    <span className="text-sm text-texto2">
                      {s.descricao}
                      {s.automatico && " · automático"} · {quando(s.criado_em)}
                    </span>
                    <strong className="titulo text-2xl text-brasa">
                      {reais(-s.valor_centavos)}
                    </strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span>
                      Pix ({NOME_TIPO[s.jogador?.pix_tipo ?? ""] ?? "chave"}):{" "}
                      <strong className="select-all font-mono">
                        {chave ?? "não cadastrada"}
                      </strong>
                    </span>
                    {s.jogador?.pix_verificado_em ? (
                      <span className="text-brasa">✓ titular conferido</span>
                    ) : (
                      <span className="text-alerta">
                        titular ainda não conferido
                      </span>
                    )}
                    <form
                      action={concluirMovimento}
                      className="ml-auto flex flex-wrap items-center gap-3"
                    >
                      <input type="hidden" name="id" value={s.id} />
                      {!s.jogador?.pix_verificado_em && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="titular_conferido"
                            className="h-4 w-4 accent-[#d8392a]"
                          />{" "}
                          Conferi o nome do titular
                        </label>
                      )}
                      <BotaoEnviar
                        className={botao("primario")}
                        pendente="Registrando…"
                      >
                        Confirmar Pix enviado
                      </BotaoEnviar>
                    </form>
                    <form action={cancelarMovimento}>
                      <input type="hidden" name="id" value={s.id} />
                      <input
                        type="hidden"
                        name="motivo"
                        value="Chave Pix com problema"
                      />
                      <BotaoEnviar
                        className={botao("perigo")}
                        title="Devolve o valor para a Carteira do jogador"
                      >
                        Devolver à Carteira
                      </BotaoEnviar>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-3xl">Resgates em lojas parceiras</h2>
        <p className="text-sm text-cinza">
          Faça o Pix do valor para a chave da loja (o bônus é por conta da loja)
          e clique em{" "}
          <strong className="text-marfim">Confirmar Pix enviado</strong>: a loja
          recebe por e-mail o pedido para gerar o crédito em até 2 dias úteis. O
          jogador já recebeu o código quando pediu.
        </p>
        {porLoja.size === 0 ? (
          <p className="text-texto2">Nenhum resgate pendente.</p>
        ) : (
          [...porLoja.entries()].map(([loja, itens]) => {
            const c = itens[0].parceiro?.credito;
            return (
              <div
                key={loja}
                className="flex flex-col rounded-xl border border-borda"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borda bg-grafite px-4 py-3">
                  <span className="flex flex-col">
                    <strong>{loja}</strong>
                    <span className="text-xs text-cinza">
                      Pix{" "}
                      {c?.pix_tipo
                        ? `(${NOME_TIPO[c.pix_tipo] ?? c.pix_tipo.toUpperCase()})`
                        : ""}
                      :{" "}
                      <span className="select-all font-mono text-texto2">
                        {c?.pix_chave ?? "não cadastrada"}
                      </span>
                      {c?.pix_titular ? ` · ${c.pix_titular}` : ""} · pedidos
                      para {c?.email_pedidos ?? "—"}
                    </span>
                  </span>
                  <span className="text-sm">
                    Total a enviar:{" "}
                    <strong className="text-brasa">
                      {reais(-itens.reduce((s, m) => s + m.valor_centavos, 0))}
                    </strong>
                  </span>
                </div>
                <ul className="divide-y divide-borda">
                  {itens.map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm"
                    >
                      <span className="flex min-w-44 flex-1 flex-col">
                        <span className="font-semibold">
                          {e.jogador?.nick_endstep || e.jogador?.nome}
                        </span>
                        <span className="text-xs text-cinza">
                          Conta na loja:{" "}
                          <span className="select-all text-texto2">
                            {e.conta_loja ?? "—"}
                          </span>{" "}
                          · {e.codigo_loja}
                        </span>
                      </span>
                      <span>
                        Pix {reais(-e.valor_centavos)}
                        {e.credito_centavos &&
                        e.credito_centavos !== -e.valor_centavos ? (
                          <span className="text-brasa">
                            {" "}
                            → {reais(e.credito_centavos)} de crédito
                          </span>
                        ) : null}
                      </span>
                      <span className="text-cinza">{quando(e.criado_em)}</span>
                      <form action={concluirMovimento}>
                        <input type="hidden" name="id" value={e.id} />
                        <BotaoEnviar
                          className={botao("primario")}
                          pendente="Registrando…"
                        >
                          Confirmar Pix enviado
                        </BotaoEnviar>
                      </form>
                      <form action={cancelarMovimento}>
                        <input type="hidden" name="id" value={e.id} />
                        <BotaoEnviar
                          className={botao("perigo")}
                          title="Cancela o pedido e devolve o valor para a Carteira do jogador"
                        >
                          Cancelar e devolver
                        </BotaoEnviar>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-3xl">Concluídos recentemente</h2>
        {(recentes ?? []).length === 0 ? (
          <p className="text-texto2">Nada concluído ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda text-sm">
            {(
              recentes as unknown as {
                id: string;
                tipo: string;
                status: string;
                valor_centavos: number;
                credito_centavos: number | null;
                codigo_loja: string | null;
                concluido_em: string | null;
                criado_em: string;
                jogador: {
                  nick_endstep: string | null;
                  nome: string | null;
                } | null;
                parceiro: { nome: string } | null;
              }[]
            ).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3"
              >
                <span className="w-32 text-cinza">
                  {quando(r.concluido_em ?? r.criado_em)}
                </span>
                <span className="min-w-40 flex-1">
                  <strong>{r.jogador?.nick_endstep || r.jogador?.nome}</strong>
                  <span className="text-texto2">
                    {" "}
                    ·{" "}
                    {r.tipo === "saque"
                      ? "Saque por Pix"
                      : `Resgate na ${r.parceiro?.nome ?? "loja"}`}
                    {r.codigo_loja ? ` · ${r.codigo_loja}` : ""}
                  </span>
                </span>
                <span>{reais(Math.abs(r.valor_centavos))}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${r.status === "concluido" ? "bg-brasa/15 text-brasa" : "bg-erro/15 text-erro"}`}
                >
                  {r.status === "concluido"
                    ? r.tipo === "saque"
                      ? "Pago"
                      : "Pix enviado à loja"
                    : "Cancelado"}
                </span>
                {r.tipo === "envio_loja" && r.status === "concluido" && (
                  <form action={reenviarEmailLoja}>
                    <input type="hidden" name="id" value={r.id} />
                    <BotaoEnviar
                      className={botao("secundario")}
                      pendente="Reenviando…"
                    >
                      Reenviar e-mail à loja
                    </BotaoEnviar>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-3xl">Pix aguardando pagamento</h2>
        {(pixPendentes ?? []).length === 0 ? (
          <p className="text-texto2">Nenhum Pix em aberto.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda text-sm">
            {(
              (pixPendentes as unknown as {
                id: string;
                id_externo: string | null;
                valor_centavos: number;
                criado_em: string;
                inscricao: {
                  jogador: { nick_endstep: string | null } | null;
                  evento: { titulo: string } | null;
                } | null;
              }[]) ?? []
            ).map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5"
              >
                <span className="w-32 text-cinza">{quando(p.criado_em)}</span>
                <span className="min-w-40 flex-1">
                  <strong>{p.inscricao?.jogador?.nick_endstep}</strong> ·{" "}
                  {p.inscricao?.evento?.titulo}
                </span>
                <span>{reais(p.valor_centavos)}</span>
                <span className="font-mono text-xs text-cinza">
                  {p.id_externo}
                </span>
                <form action={consultarPix}>
                  <input type="hidden" name="id" value={p.id} />
                  <BotaoEnviar
                    className={botao("secundario")}
                    pendente="Consultando…"
                  >
                    Consultar no Mercado Pago
                  </BotaoEnviar>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-3xl">Avisos do Mercado Pago</h2>
        <p className="text-sm text-cinza">
          Últimos avisos automáticos (webhook) e pagamentos confirmados. Útil
          para conferir os testes.
        </p>
        {(avisos ?? []).length === 0 ? (
          <p className="text-texto2">Nenhum aviso recebido ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda text-sm">
            {(avisos ?? []).map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5"
              >
                <span className="w-32 text-cinza">{quando(a.criado_em)}</span>
                <span
                  className={
                    a.acao === "webhook_assinatura_invalida"
                      ? "font-semibold text-erro"
                      : "font-semibold"
                  }
                >
                  {a.acao === "webhook_recebido"
                    ? "Aviso recebido"
                    : a.acao === "pagamento_confirmado"
                      ? "Pagamento confirmado"
                      : a.acao === "mercadopago_status"
                        ? "Situação no Mercado Pago"
                        : "Assinatura inválida"}
                </span>
                <span className="font-mono text-xs text-texto2">
                  {JSON.stringify(a.detalhes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
