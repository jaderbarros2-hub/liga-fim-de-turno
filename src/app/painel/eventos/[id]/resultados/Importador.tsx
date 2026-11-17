"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { calcularPremios, lerClassificacao, lerDistribuicao, type Inscrito, type LinhaResultado } from "@/lib/resultados";
import { salvarResultados, type EstadoResultados } from "./actions";

const reais = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const campo =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo focus:border-ciano focus:outline-none";

export function Importador({
  eventoId,
  inscritos,
  premioTotal,
  distribuicaoInicial,
  linhasIniciais,
  bloqueado,
}: {
  eventoId: string;
  inscritos: Inscrito[];
  premioTotal: number;
  distribuicaoInicial: string;
  linhasIniciais: LinhaResultado[];
  bloqueado: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [linhas, setLinhas] = useState<LinhaResultado[]>(linhasIniciais);
  const [distribuicao, setDistribuicao] = useState(distribuicaoInicial);
  const [estado, acao, enviando] = useActionState<EstadoResultados, FormData>(salvarResultados, {});

  const dist = lerDistribuicao(distribuicao);
  const valores = useMemo(
    () => (dist ? calcularPremios(premioTotal, dist, linhas.length) : []),
    [dist, premioTotal, linhas.length],
  );

  function ler() {
    setLinhas(lerClassificacao(texto, inscritos));
  }

  function associar(indice: number, jogadorId: string) {
    const inscrito = inscritos.find((i) => i.jogadorId === jogadorId);
    setLinhas((ls) =>
      ls.map((l, i) => (i === indice ? { ...l, jogadorId: jogadorId || null, nick: inscrito?.nick ?? l.nick } : l)),
    );
  }

  function mover(indice: number, delta: number) {
    setLinhas((ls) => {
      const novo = [...ls];
      const alvo = indice + delta;
      if (alvo < 0 || alvo >= novo.length) return ls;
      [novo[indice], novo[alvo]] = [novo[alvo], novo[indice]];
      return novo.map((l, i) => ({ ...l, posicao: i + 1 }));
    });
  }

  function remover(indice: number) {
    setLinhas((ls) => ls.filter((_, i) => i !== indice).map((l, i) => ({ ...l, posicao: i + 1 })));
  }

  function enviar(publicar: boolean) {
    const dados = new FormData();
    dados.set("evento_id", eventoId);
    dados.set("distribuicao", distribuicao);
    dados.set("linhas", JSON.stringify(linhas));
    dados.set("publicar", publicar ? "sim" : "nao");
    startTransition(() => acao(dados));
  }

  return (
    <div className="flex flex-col gap-6">
      {!bloqueado && (
        <section className="flex flex-col gap-3 rounded-xl border border-borda bg-grafite p-5">
          <h2 className="titulo text-2xl">1 · Classificação do Endstep</h2>
          <p className="text-sm text-texto2">
            No Endstep, abra a classificação final, selecione a tabela inteira, copie e cole aqui. Uma linha por jogador,
            na ordem final. Os nicks são reconhecidos pelo cadastro dos inscritos.
          </p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            placeholder={"1  nick_do_jogador  3-0  9\n2  outro_jogador  2-1  6\n..."}
            className={`${campo} py-2 font-mono text-sm`}
          />
          <button
            type="button"
            onClick={ler}
            disabled={!texto.trim()}
            className="inline-flex min-h-11 items-center self-start rounded-lg border border-borda-forte px-5 text-sm font-semibold text-gelo hover:border-ciano disabled:opacity-50"
          >
            Ler classificação
          </button>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-borda bg-grafite p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="titulo text-2xl">2 · Conferir e premiar</h2>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-cinza">Divisão do prêmio (%)</span>
            <input
              value={distribuicao}
              onChange={(e) => setDistribuicao(e.target.value)}
              disabled={bloqueado}
              className={`${campo} w-40`}
            />
          </label>
        </div>
        {!dist && <p className="text-sm text-erro">A divisão precisa somar 100%. Ex.: 50/30/10/10</p>}
        <p className="text-sm text-cinza">Prêmio total do evento: {reais(premioTotal)}</p>
        {bloqueado && (
          <p className="text-sm text-alerta">
            Classificação travada: já há prêmio marcado como pago neste evento, para evitar pagamento em dobro.
          </p>
        )}

        {linhas.length === 0 ? (
          <p className="text-sm text-texto2">Nenhuma classificação lida ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-cinza">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Nick no Endstep</th>
                  <th className="p-2">Jogador cadastrado</th>
                  <th className="p-2">V-D-E</th>
                  <th className="p-2">Pts</th>
                  <th className="p-2">Prêmio</th>
                  {!bloqueado && <th className="p-2" />}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => {
                  const premiado = i < valores.length && valores[i] > 0;
                  return (
                    <tr key={`${l.nick}-${i}`} className="border-t border-borda">
                      <td className="p-2 font-semibold text-ciano">{i + 1}</td>
                      <td className="p-2">{l.nick}</td>
                      <td className="p-2">
                        <select
                          value={l.jogadorId ?? ""}
                          onChange={(e) => associar(i, e.target.value)}
                          disabled={bloqueado}
                          className={`min-h-9 rounded-md border bg-fundo2 px-2 text-sm ${
                            !l.jogadorId && premiado ? "border-erro text-erro" : "border-borda-forte text-gelo"
                          }`}
                        >
                          <option value="">{premiado ? "— escolha (obrigatório) —" : "— sem cadastro —"}</option>
                          {inscritos.map((ins) => (
                            <option key={ins.jogadorId} value={ins.jogadorId}>
                              {ins.nick}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        {l.vitorias}-{l.derrotas}
                        {l.empates ? `-${l.empates}` : ""}
                      </td>
                      <td className="p-2">{l.pontos}</td>
                      <td className="p-2 text-ciano">{premiado ? reais(valores[i]) : ""}</td>
                      {!bloqueado && (
                        <td className="whitespace-nowrap p-2 text-cinza">
                          <button type="button" onClick={() => mover(i, -1)} aria-label="Subir" className="px-1 hover:text-gelo">
                            ↑
                          </button>
                          <button type="button" onClick={() => mover(i, 1)} aria-label="Descer" className="px-1 hover:text-gelo">
                            ↓
                          </button>
                          <button type="button" onClick={() => remover(i)} aria-label="Remover" className="px-1 hover:text-erro">
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!bloqueado && (
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => enviar(true)}
              disabled={enviando || !linhas.length || !dist}
              className="inline-flex min-h-11 items-center rounded-lg bg-azul px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-azul-escuro disabled:opacity-50"
            >
              {enviando ? "Salvando…" : "Publicar resultados"}
            </button>
            <button
              type="button"
              onClick={() => enviar(false)}
              disabled={enviando || !linhas.length || !dist}
              className="inline-flex min-h-11 items-center rounded-lg border border-borda-forte px-5 text-sm font-semibold text-gelo hover:border-ciano disabled:opacity-50"
            >
              Salvar sem publicar
            </button>
          </div>
        )}
        {(estado.erro || estado.ok) && (
          <div
            role={estado.erro ? "alert" : "status"}
            className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
              estado.erro ? "border-erro text-erro" : "border-ciano text-ciano"
            }`}
          >
            {estado.erro ?? estado.ok}
          </div>
        )}
      </section>
    </div>
  );
}
