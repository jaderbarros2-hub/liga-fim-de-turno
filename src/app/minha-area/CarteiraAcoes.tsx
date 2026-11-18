"use client";

import { useActionState, useState } from "react";
import { enviarParaLoja, solicitarSaque, type EstadoCarteira } from "./carteira";

const CAMPO = "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo focus:border-ciano focus:outline-none";

type Loja = { id: string; nome: string; instrucoes: string | null; bonus: number };

/** Sacar por Pix ou enviar para loja parceira. Usar em ingresso acontece no checkout. */
export function CarteiraAcoes({
  saldo,
  saldoTexto,
  minimo,
  minimoTexto,
  chavePix,
  lojas,
}: {
  saldo: number;
  saldoTexto: string;
  minimo: number;
  minimoTexto: string;
  chavePix: string;
  lojas: Loja[];
}) {
  const [aba, setAba] = useState<"saque" | "loja">("saque");
  const [estadoSaque, sacar, sacando] = useActionState<EstadoCarteira, FormData>(solicitarSaque, {});
  const [estadoLoja, enviar, enviando] = useActionState<EstadoCarteira, FormData>(enviarParaLoja, {});
  const [lojaId, setLojaId] = useState(lojas[0]?.id ?? "");
  const loja = lojas.find((l) => l.id === lojaId);
  const podeSacar = saldo >= minimo;

  return (
    <div className="flex flex-col gap-4 rounded-md bg-grafite p-5 ring-1 ring-borda">
      <div className="flex gap-2">
        {[
          ["saque", "Sacar por Pix"],
          ["loja", "Enviar para loja"],
        ].map(([id, r]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id as "saque" | "loja")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${aba === id ? "bg-azul text-white" : "text-texto2 ring-1 ring-borda hover:text-gelo"}`}
          >
            {r}
          </button>
        ))}
      </div>

      {aba === "saque" ? (
        <form action={sacar} className="flex flex-col gap-3">
          <p className="text-sm text-texto2">
            Saque mínimo de <strong className="text-gelo">{minimoTexto}</strong> (o prêmio do campeão numa etapa de 8 jogadores). O Pix vai
            para a chave <strong className="text-gelo">{chavePix || "não cadastrada"}</strong> em até 48 horas.
          </p>
          {podeSacar ? (
            <div className="flex flex-wrap items-center gap-3">
              <input name="valor" inputMode="decimal" placeholder={saldoTexto} className={`${CAMPO} max-w-40`} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="tudo" className="h-4 w-4 accent-[#2e6bff]" /> Sacar tudo ({saldoTexto})
              </label>
              <button type="submit" disabled={sacando} className="min-h-11 rounded-lg bg-azul px-5 text-sm font-semibold text-white disabled:opacity-60">
                {sacando ? "Solicitando…" : "Solicitar saque"}
              </button>
            </div>
          ) : (
            <p className="rounded-md border-l-4 border-azul bg-fundo2 p-3 text-sm text-texto2">
              Seu saldo ainda não chegou ao mínimo para saque. Use no próximo ingresso, envie para uma loja ou espere: saldo parado há
              30 dias é depositado automaticamente no seu Pix.
            </p>
          )}
          {estadoSaque.erro && <p className="text-sm text-erro">{estadoSaque.erro}</p>}
          {estadoSaque.ok && <p className="text-sm font-semibold text-ciano">{estadoSaque.ok}</p>}
        </form>
      ) : lojas.length === 0 ? (
        <p className="text-sm text-texto2">Nenhuma loja parceira recebendo crédito da liga no momento.</p>
      ) : (
        <form action={enviar} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <select name="parceiro_id" value={lojaId} onChange={(e) => setLojaId(e.target.value)} className={CAMPO}>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                  {l.bonus ? ` (+${l.bonus}% de bônus)` : ""}
                </option>
              ))}
            </select>
            <input name="valor" inputMode="decimal" placeholder="Valor (R$)" required className={CAMPO} />
          </div>
          {loja?.instrucoes && <p className="text-sm text-texto2">{loja.instrucoes}</p>}
          {loja?.bonus ? <p className="text-sm text-ciano">A {loja.nome} acrescenta {loja.bonus}% ao valor enviado, em crédito na loja.</p> : null}
          <button type="submit" disabled={enviando || !saldo} className="min-h-11 self-start rounded-lg bg-azul px-5 text-sm font-semibold text-white disabled:opacity-60">
            {enviando ? "Enviando…" : "Enviar para a loja"}
          </button>
          <p className="text-xs text-cinza">A liga repassa o valor à loja e a loja libera o seu crédito. Você acompanha o status no histórico.</p>
          {estadoLoja.erro && <p className="text-sm text-erro">{estadoLoja.erro}</p>}
          {estadoLoja.ok && <p className="text-sm font-semibold text-ciano">{estadoLoja.ok}</p>}
        </form>
      )}
    </div>
  );
}
