"use client";

import { useActionState, useState } from "react";
import { criarCupons, type EstadoCupom } from "./actions";

const CAMPO =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo focus:border-ciano focus:outline-none";
const ROTULO = "flex flex-col gap-1 text-sm font-semibold";

export function FormCupom({
  eventos,
}: {
  eventos: { id: string; titulo: string }[];
}) {
  const [estado, acao, salvando] = useActionState<EstadoCupom, FormData>(
    criarCupons,
    {},
  );
  const [tipo, setTipo] = useState("gratis");
  const [lote, setLote] = useState(false);

  return (
    <form
      action={acao}
      className="grid gap-4 rounded-xl border border-borda p-6 sm:grid-cols-2"
    >
      <h2 className="titulo text-3xl sm:col-span-2">Novo cupom</h2>
      <div className="flex gap-2 sm:col-span-2">
        {[
          [false, "Um código"],
          [true, "Lote de códigos únicos"],
        ].map(([v, r]) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setLote(v as boolean)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${lote === v ? "bg-azul text-white" : "text-texto2 ring-1 ring-borda"}`}
          >
            {r as string}
          </button>
        ))}
      </div>
      <label className={ROTULO}>
        {lote ? "Prefixo do lote" : "Código"}
        <input
          name="codigo"
          required
          placeholder={lote ? "NATAL" : "BEMVINDO"}
          className={`${CAMPO} font-mono uppercase`}
        />
        {lote && (
          <span className="font-normal text-cinza">
            Gera NATAL-7K2QF, NATAL-M9XPA… cada um usado uma vez.
          </span>
        )}
      </label>
      {lote ? (
        <label className={ROTULO}>
          Quantidade
          <input
            name="quantidade"
            type="number"
            min={2}
            max={500}
            defaultValue={20}
            className={CAMPO}
          />
        </label>
      ) : (
        <label className={ROTULO}>
          Limite de usos (vazio = ilimitado)
          <input
            name="limite_usos"
            type="number"
            min={1}
            placeholder="Ex.: 10 primeiros"
            className={CAMPO}
          />
        </label>
      )}
      <label className={ROTULO}>
        Desconto
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className={CAMPO}
        >
          <option value="gratis">Ingresso gratuito (100%)</option>
          <option value="percentual">Percentual</option>
          <option value="valor">Valor em reais</option>
        </select>
      </label>
      {tipo !== "gratis" && (
        <label className={ROTULO}>
          {tipo === "percentual" ? "Percentual (%)" : "Valor (R$)"}
          <input
            name="valor"
            required
            inputMode="decimal"
            placeholder={tipo === "percentual" ? "50" : "5,00"}
            className={CAMPO}
          />
        </label>
      )}
      <label className={ROTULO}>
        Vale para
        <select name="evento_id" defaultValue="" className={CAMPO}>
          <option value="">Qualquer evento</option>
          {eventos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.titulo}
            </option>
          ))}
        </select>
      </label>
      <label className={ROTULO}>
        Formato
        <select name="formato" defaultValue="" className={CAMPO}>
          <option value="">Todos os formatos</option>
          <option value="pauper">Só Pauper</option>
          <option value="premodern">Só Premodern</option>
          <option value="limited">Só Limited</option>
        </select>
      </label>
      <label className={ROTULO}>
        Válido a partir de (opcional)
        <input name="valido_de" type="datetime-local" className={CAMPO} />
      </label>
      <label className={ROTULO}>
        Válido até (opcional)
        <input name="valido_ate" type="datetime-local" className={CAMPO} />
      </label>
      <label className={`${ROTULO} sm:col-span-2`}>
        Descrição interna
        <input
          name="descricao"
          placeholder="Ex.: Sorteio no Discord de dezembro"
          className={CAMPO}
        />
      </label>
      <p className="text-xs text-cinza sm:col-span-2">
        Cada jogador usa o mesmo cupom uma vez. O uso só conta quando o ingresso
        é confirmado.
      </p>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={salvando}
          className="min-h-11 rounded-lg bg-azul px-6 font-semibold text-white disabled:opacity-60"
        >
          {salvando ? "Criando…" : lote ? "Gerar lote" : "Criar cupom"}
        </button>
        {estado.erro && (
          <span className="text-sm text-erro">{estado.erro}</span>
        )}
        {estado.ok && (
          <span className="text-sm font-semibold text-ciano">{estado.ok}</span>
        )}
      </div>
      {estado.codigos && (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm text-texto2">
            Códigos gerados (copie e distribua):
          </span>
          <textarea
            readOnly
            rows={Math.min(10, estado.codigos.length)}
            value={estado.codigos.join("\n")}
            className={`${CAMPO} py-2 font-mono text-sm`}
          />
        </div>
      )}
    </form>
  );
}
