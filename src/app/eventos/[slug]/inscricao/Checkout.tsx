"use client";

import { botao } from "@/components/Botao";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  aplicarCupom,
  gerarPix,
  pagarComCredito,
  salvarDeckRapido,
  type EstadoDeckRapido,
  type EstadoInscricao,
  type ResultadoCupom,
} from "./actions";

type DeckOpcao = {
  id: string;
  nome: string;
  legal: boolean;
  arquetipo: string | null;
};

const campo =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo focus:border-ciano focus:outline-none";

function Bloco({
  n,
  titulo,
  feito,
  children,
}: {
  n: number;
  titulo: string;
  feito?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex gap-4">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ring-1 ${
          feito
            ? "bg-ciano text-preto ring-ciano"
            : "bg-azul/15 text-ciano ring-azul/50"
        }`}
      >
        {feito ? "✓" : n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3 border-b border-borda pb-7">
        <h2 className="titulo text-3xl leading-9">{titulo}</h2>
        {children}
      </div>
    </section>
  );
}

/** Checkout do ingresso numa tela só: dados, deck (Pauper), regras e pagamento. */
export function Checkout({
  slug,
  pauper,
  formato,
  presencial,
  valor,
  valorCentavos,
  saldo,
  jogador,
  decks: decksIniciais,
  arquetipos,
  aviso,
}: {
  slug: string;
  pauper: boolean;
  formato: string;
  presencial: string | null; // nome da loja, se o evento for presencial
  valor: string;
  valorCentavos: number;
  saldo: { centavos: number; texto: string; cobre: boolean };
  jogador: { nick: string; pix: string; email: string };
  decks: DeckOpcao[];
  arquetipos: { id: number; nome: string }[];
  aviso?: string | null;
}) {
  const [decks, setDecks] = useState(decksIniciais);
  const [deckId, setDeckId] = useState(
    decksIniciais.find((d) => d.legal)?.id ?? "",
  );
  const [novo, setNovo] = useState(decksIniciais.length === 0);
  const [aceite, setAceite] = useState(false);
  const [metodoEscolhido, setMetodo] = useState<"pix" | "credito">(
    saldo.cobre ? "credito" : "pix",
  );
  const [estadoPix, acaoPix, gerando] = useActionState<
    EstadoInscricao,
    FormData
  >(gerarPix, {});
  const [estadoCred, acaoCred, usando] = useActionState<
    EstadoInscricao,
    FormData
  >(pagarComCredito, {});
  const [estadoDeck, acaoDeck, salvando] = useActionState<
    EstadoDeckRapido,
    FormData
  >(async (anterior, form) => {
    const r = await salvarDeckRapido(anterior, form);
    if (r.deck) {
      setDecks((ds) => [
        { id: r.deck!.id, nome: r.deck!.nome, legal: true, arquetipo: null },
        ...ds,
      ]);
      setDeckId(r.deck.id);
      setNovo(false);
    }
    return r;
  }, {});

  const [codigo, setCodigo] = useState("");
  const [cupom, setCupom] = useState<ResultadoCupom | null>(null);
  const [conferindo, conferir] = useTransition();
  const final = cupom?.codigo ? cupom.final! : valorCentavos;
  const finalTexto = cupom?.codigo ? cupom.finalTexto! : valor;
  const gratis = final === 0;
  const creditoCobre = saldo.centavos >= final;
  const deck = decks.find((d) => d.id === deckId);
  const deckOk = !pauper || Boolean(deck?.legal);
  const pronto = deckOk && aceite;
  const metodo =
    metodoEscolhido === "credito" && !creditoCobre ? "pix" : metodoEscolhido;
  const ocultos = (
    <>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="deck_id" value={deckId} />
      {cupom?.codigo && (
        <input type="hidden" name="cupom" value={cupom.codigo} />
      )}
      {aceite && <input type="hidden" name="aceite" value="on" />}
    </>
  );
  let n = 1;

  return (
    <div className="flex flex-col gap-7">
      {aviso && (
        <p className="rounded-md border-l-4 border-alerta bg-grafite p-4 text-sm">
          {aviso}
        </p>
      )}

      <Bloco n={n++} titulo="Seus dados" feito>
        <dl className="grid gap-3 rounded-md bg-grafite p-4 text-sm ring-1 ring-borda sm:grid-cols-3">
          <div>
            <dt className="text-cinza">Nick no Endstep</dt>
            <dd className="font-semibold">{jogador.nick}</dd>
          </div>
          <div>
            <dt className="text-cinza">Chave Pix (prêmios e reembolsos)</dt>
            <dd className="font-semibold">{jogador.pix || "—"}</dd>
          </div>
          <div>
            <dt className="text-cinza">E-mail</dt>
            <dd className="truncate font-semibold">{jogador.email}</dd>
          </div>
        </dl>
        <span className="text-sm text-texto2">
          Algo errado?{" "}
          <Link href="/minha-area?aba=dados" target="_blank">
            Altere em Meus dados
          </Link>{" "}
          (abre em outra aba, esta tela continua aqui).
        </span>
      </Bloco>

      {pauper && (
        <Bloco n={n++} titulo="Seu deck" feito={deckOk}>
          <p className="text-sm text-texto2">
            O ingresso só é emitido com o deck registrado. A lista alimenta o
            metagame e as estatísticas da liga: o arquétipo de todos aparece nos
            dados públicos e as listas do top 8 são publicadas depois do
            resultado. Você pode trocar de deck até o início do evento.
          </p>
          {decks.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {decks.map((d) => (
                <li key={d.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-md p-3 ring-1 ${
                      deckId === d.id
                        ? "bg-azul/15 ring-azul"
                        : "bg-grafite ring-borda hover:ring-borda-forte"
                    } ${d.legal ? "" : "cursor-not-allowed opacity-60"}`}
                  >
                    <input
                      type="radio"
                      name="deck_escolha"
                      checked={deckId === d.id}
                      disabled={!d.legal}
                      onChange={() => setDeckId(d.id)}
                      className="accent-[#2e6bff]"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{d.nome}</span>
                      <span
                        className={`text-xs ${d.legal ? "text-cinza" : "text-alerta"}`}
                      >
                        {d.legal
                          ? (d.arquetipo ??
                            (formato === "premodern" ? "Premodern" : "Pauper"))
                          : "Com pendências"}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {!novo ? (
            <button
              type="button"
              onClick={() => setNovo(true)}
              className={`${botao("secundario")} self-start`}
            >
              + Cadastrar outro deck
            </button>
          ) : (
            <form
              action={acaoDeck}
              className="flex flex-col gap-3 rounded-md bg-grafite p-4 ring-1 ring-borda"
            >
              <input type="hidden" name="formato" value={formato} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="nome"
                  placeholder="Nome do deck"
                  required
                  className={campo}
                />
                <select
                  name="arquetipo_id"
                  required
                  defaultValue=""
                  className={campo}
                >
                  <option value="" disabled>
                    Arquétipo
                  </option>
                  {arquetipos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                name="lista"
                rows={8}
                required
                placeholder={
                  "Cole a lista exportada do Endstep\n4 Spellstutter Sprite\n4 Counterspell\n...\n\nSideboard\n2 Hydroblast"
                }
                className={`${campo} py-2 font-mono text-sm`}
              />
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={salvando}
                  className="min-h-10 rounded-lg bg-azul px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {salvando
                    ? "Conferindo as cartas…"
                    : "Salvar e usar este deck"}
                </button>
                {decks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNovo(false)}
                    className={botao("secundario")}
                  >
                    Cancelar
                  </button>
                )}
              </div>
              {estadoDeck.erro && (
                <div className="text-sm text-erro">
                  {estadoDeck.erro}
                  {estadoDeck.problemas && (
                    <ul className="ml-5 mt-1 list-disc">
                      {estadoDeck.problemas.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </form>
          )}
        </Bloco>
      )}

      <Bloco n={n++} titulo="Regras do ingresso" feito={aceite}>
        <ul className="flex flex-col gap-2 rounded-md bg-grafite p-4 text-sm text-texto2 ring-1 ring-borda">
          <li>
            <strong className="text-gelo">Cancelamento:</strong> até 24 horas
            antes do início, com reembolso por Pix ou o valor de volta na sua
            Carteira (você escolhe). Depois disso, o ingresso não é reembolsado.
          </li>
          <li>
            <strong className="text-gelo">Evento cancelado</strong> (menos
            jogadores que o mínimo): reembolso ou valor na Carteira para todos.
          </li>
          <li>
            <strong className="text-gelo">No dia:</strong>{" "}
            {presencial
              ? `o evento é presencial, em ${presencial}. Chegue 15 minutos antes para o check-in; endereço e mapa estão na página do evento.`
              : "o link do Endstep aparece na página do evento e na sua Minha área. Faça o check-in até 10 minutos antes."}
          </li>
          {pauper && (
            <li>
              <strong className="text-gelo">Deck:</strong> a lista registrada é
              a que vale; dá para trocar até o início.
            </li>
          )}
        </ul>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#2e6bff]"
          />
          <span>
            Li e concordo com as regras do ingresso e com o{" "}
            <Link href="/regras" target="_blank">
              regulamento da liga
            </Link>
            .
          </span>
        </label>
      </Bloco>

      <Bloco n={n++} titulo="Pagamento">
        <div className="flex flex-col gap-2 rounded-md bg-grafite p-4 ring-1 ring-borda">
          {cupom?.codigo ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded bg-ciano/15 px-2 py-1 font-mono text-sm font-bold text-ciano">
                {cupom.codigo}
              </span>
              <span className="text-sm">
                {cupom.rotulo}{" "}
                <span className="text-cinza">(− {cupom.desconto})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setCupom(null);
                  setCodigo("");
                }}
                className="ml-auto text-sm font-semibold text-cinza hover:text-gelo"
              >
                Remover
              </button>
            </div>
          ) : (
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                conferir(async () =>
                  setCupom(await aplicarCupom(slug, codigo)),
                );
              }}
            >
              <label htmlFor="cupom" className="sr-only">
                Cupom
              </label>
              <input
                id="cupom"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Tem um cupom?"
                autoComplete="off"
                className={`${campo} max-w-60 flex-1 font-mono uppercase`}
              />
              <button
                type="submit"
                disabled={!codigo || conferindo}
                className="min-h-11 rounded-lg px-4 text-sm font-semibold ring-1 ring-borda-forte hover:ring-ciano disabled:opacity-50"
              >
                {conferindo ? "Conferindo…" : "Aplicar"}
              </button>
              {cupom?.erro && (
                <span className="basis-full text-sm text-erro">
                  {cupom.erro}
                </span>
              )}
            </form>
          )}
          <div className="flex items-baseline justify-between border-t border-borda pt-3">
            <span className="text-sm text-cinza">Total</span>
            <span className="flex items-baseline gap-2">
              {cupom?.codigo && (
                <span className="text-sm text-cinza line-through">{valor}</span>
              )}
              <span className="titulo text-3xl">
                {gratis ? "Grátis" : finalTexto}
              </span>
            </span>
          </div>
        </div>

        {gratis ? (
          <form action={acaoPix} className="flex flex-col gap-3">
            {ocultos}
            <button
              type="submit"
              disabled={!pronto || gerando}
              className="corte inline-flex min-h-14 items-center justify-center bg-azul px-8 font-semibold uppercase tracking-wide text-white hover:bg-azul-escuro disabled:cursor-not-allowed disabled:opacity-40"
            >
              {gerando ? "Emitindo…" : "Emitir ingresso gratuito"}
            </button>
            {!pronto && (
              <span className="text-xs text-cinza">
                {!deckOk
                  ? "Escolha o deck para continuar."
                  : "Aceite as regras para continuar."}
              </span>
            )}
            {estadoPix.erro && (
              <p role="alert" className="text-sm text-erro">
                {estadoPix.erro}
              </p>
            )}
          </form>
        ) : (
          <>
            <div
              role="radiogroup"
              aria-label="Forma de pagamento"
              className="grid gap-2 sm:grid-cols-3"
            >
              {[
                {
                  id: "pix",
                  rotulo: "Pix",
                  texto: "Confirmação na hora",
                  ativo: true,
                },
                {
                  id: "credito",
                  rotulo: "Saldo da Carteira",
                  texto: saldo.centavos ? `Saldo ${saldo.texto}` : "Sem saldo",
                  ativo: creditoCobre && saldo.centavos > 0,
                },
                {
                  id: "cartao",
                  rotulo: "Cartão",
                  texto: "Em breve",
                  ativo: false,
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={metodo === m.id}
                  disabled={!m.ativo}
                  onClick={() => setMetodo(m.id as "pix" | "credito")}
                  className={`flex flex-col items-start rounded-md p-3 text-left ring-1 disabled:cursor-not-allowed disabled:opacity-45 ${
                    metodo === m.id
                      ? "bg-azul/15 ring-azul"
                      : "bg-grafite ring-borda hover:ring-borda-forte"
                  }`}
                >
                  <span className="font-semibold">{m.rotulo}</span>
                  <span className="text-xs text-cinza">{m.texto}</span>
                </button>
              ))}
            </div>

            {metodo === "pix" ? (
              <form action={acaoPix} className="flex flex-col gap-3">
                {ocultos}
                <ol className="grid gap-2 text-sm text-texto2 sm:grid-cols-3">
                  <li>
                    1. Gere o Pix e copie o código ou leia o QR no app do banco.
                  </li>
                  <li>
                    2. Pague em até 30 minutos. A vaga fica reservada nesse
                    tempo.
                  </li>
                  <li>
                    3. Esta tela confirma sozinha e mostra o seu ingresso.
                  </li>
                </ol>
                <button
                  type="submit"
                  disabled={!pronto || gerando}
                  className="corte inline-flex min-h-14 items-center justify-center bg-azul px-8 font-semibold uppercase tracking-wide text-white hover:bg-azul-escuro disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {gerando ? "Gerando o Pix…" : `Gerar Pix de ${finalTexto}`}
                </button>
                {!pronto && (
                  <span className="text-xs text-cinza">
                    {!deckOk
                      ? "Escolha o deck para continuar."
                      : "Aceite as regras para continuar."}
                  </span>
                )}
                {estadoPix.erro && (
                  <p role="alert" className="text-sm text-erro">
                    {estadoPix.erro}
                  </p>
                )}
              </form>
            ) : (
              <form action={acaoCred} className="flex flex-col gap-3">
                {ocultos}
                <p className="text-sm text-texto2">
                  O valor do ingresso ({finalTexto}) sai do saldo da sua
                  Carteira ({saldo.texto}). A confirmação é imediata.
                </p>
                <button
                  type="submit"
                  disabled={!pronto || usando}
                  className="corte inline-flex min-h-14 items-center justify-center bg-azul px-8 font-semibold uppercase tracking-wide text-white hover:bg-azul-escuro disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {usando
                    ? "Emitindo…"
                    : "Pagar com a Carteira e emitir ingresso"}
                </button>
                {estadoCred.erro && (
                  <p role="alert" className="text-sm text-erro">
                    {estadoCred.erro}
                  </p>
                )}
              </form>
            )}
          </>
        )}
      </Bloco>
    </div>
  );
}
