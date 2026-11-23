"use client";

import { useActionState, useState } from "react";
import { IDENTIFICACAO } from "@/lib/lojas";
import {
  enviarParaLoja,
  solicitarSaque,
  type EstadoCarteira,
} from "./carteira";

const CAMPO =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-marfim focus:border-brasa focus:outline-none";

type Loja = {
  id: string;
  nome: string;
  slug: string | null;
  logo: string | null;
  cidade: string;
  instrucoes: string | null;
  bonus: number;
  cadastro: string | null;
  identificacao: string;
};

const brl = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
  const [estadoSaque, sacar, sacando] = useActionState<
    EstadoCarteira,
    FormData
  >(solicitarSaque, {});
  const [estadoLoja, enviar, enviando] = useActionState<
    EstadoCarteira,
    FormData
  >(enviarParaLoja, {});
  const [lojaId, setLojaId] = useState(lojas[0]?.id ?? "");
  const loja = lojas.find((l) => l.id === lojaId);
  // Por padrão, o saldo inteiro
  const [valorTexto, setValorTexto] = useState(
    saldo > 0 ? (saldo / 100).toFixed(2).replace(".", ",") : "",
  );
  const valorDigitado =
    Math.round(
      Number(valorTexto.replace(/[^\d,.]/g, "").replace(",", ".")) * 100,
    ) || 0;
  const creditoPrevisto = Math.round(
    valorDigitado * (1 + (loja?.bonus ?? 0) / 100),
  );
  const podeSacar = saldo >= minimo;

  return (
    <div className="flex flex-col gap-4 rounded-md bg-grafite p-5 ring-1 ring-borda">
      <div className="flex gap-2">
        {[
          ["saque", "Sacar por Pix"],
          ["loja", "Resgatar em loja"],
        ].map(([id, r]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id as "saque" | "loja")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${aba === id ? "bg-vermelho text-white" : "text-texto2 ring-1 ring-borda hover:text-marfim"}`}
          >
            {r}
          </button>
        ))}
      </div>

      {aba === "saque" ? (
        <form action={sacar} className="flex flex-col gap-3">
          <p className="text-sm text-texto2">
            Saque mínimo de{" "}
            <strong className="text-marfim">{minimoTexto}</strong> (o prêmio do
            campeão numa etapa de 8 jogadores). O Pix vai para a chave{" "}
            <strong className="text-marfim">
              {chavePix || "não cadastrada"}
            </strong>{" "}
            em até 48 horas.
          </p>
          {podeSacar ? (
            <div className="flex flex-wrap items-center gap-3">
              <input
                name="valor"
                inputMode="decimal"
                placeholder={saldoTexto}
                className={`${CAMPO} max-w-40`}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="tudo"
                  className="h-4 w-4 accent-[#d8392a]"
                />{" "}
                Sacar tudo ({saldoTexto})
              </label>
              <button
                type="submit"
                disabled={sacando}
                className="min-h-11 rounded-lg bg-vermelho px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {sacando ? "Solicitando…" : "Solicitar saque"}
              </button>
            </div>
          ) : (
            <p className="rounded-md border-l-4 border-vermelho bg-fundo2 p-3 text-sm text-texto2">
              Seu saldo ainda não chegou ao mínimo para saque. Use no próximo
              ingresso, envie para uma loja ou espere: saldo parado há 30 dias é
              depositado automaticamente no seu Pix.
            </p>
          )}
          {estadoSaque.erro && (
            <p className="text-sm text-erro">{estadoSaque.erro}</p>
          )}
          {estadoSaque.ok && (
            <p className="text-sm font-semibold text-brasa">{estadoSaque.ok}</p>
          )}
        </form>
      ) : lojas.length === 0 ? (
        <p className="text-sm text-texto2">
          Nenhuma loja parceira aceitando resgate no momento.
        </p>
      ) : saldo <= 0 ? (
        <div className="flex flex-col gap-3">
          <p className="rounded-md border-l-4 border-vermelho bg-fundo2 p-3 text-sm text-texto2">
            Seu saldo está zerado. Quando você premiar numa etapa, o valor cai
            aqui e pode ser resgatado em uma destas lojas:
          </p>
          <ul className="flex flex-wrap gap-2">
            {lojas.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-2 rounded-md bg-fundo2 px-3 py-2 text-sm ring-1 ring-borda"
              >
                {l.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.logo}
                    alt=""
                    className="h-6 w-6 rounded bg-white object-contain p-0.5"
                  />
                ) : null}
                {l.nome}
                {l.bonus > 0 && (
                  <span className="text-xs font-bold text-brasa">
                    +{l.bonus}%
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <form action={enviar} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">
              Escolha a loja parceira
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {lojas.map((l) => (
                <label
                  key={l.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md p-3 ring-1 ${lojaId === l.id ? "bg-vermelho/10 ring-vermelho" : "bg-fundo2 ring-borda hover:ring-borda-forte"}`}
                >
                  <input
                    type="radio"
                    name="parceiro_id"
                    value={l.id}
                    checked={lojaId === l.id}
                    onChange={() => setLojaId(l.id)}
                    className="sr-only"
                  />
                  {l.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.logo}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded bg-white object-contain p-1"
                    />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-vermelho font-bold text-white">
                      {l.nome.charAt(0)}
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{l.nome}</span>
                    <span className="text-xs text-cinza">
                      {l.cidade || "Loja online"}
                    </span>
                  </span>
                  {l.bonus > 0 && (
                    <span className="rounded bg-brasa/15 px-2 py-0.5 text-xs font-bold text-brasa">
                      +{l.bonus}%
                    </span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Valor a resgatar
              <input
                name="valor"
                inputMode="decimal"
                placeholder={saldoTexto}
                required
                value={valorTexto}
                onChange={(e) => setValorTexto(e.target.value)}
                className={CAMPO}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {IDENTIFICACAO[loja?.identificacao ?? "email"]}
              <input
                name="conta_loja"
                required
                placeholder={
                  loja?.identificacao === "cpf"
                    ? "000.000.000-00"
                    : loja?.identificacao === "usuario"
                      ? "seu usuário"
                      : "voce@email.com"
                }
                className={CAMPO}
              />
            </label>
          </div>

          {loja && valorDigitado > 0 && (
            <p className="rounded-md bg-fundo2 p-3 text-sm ring-1 ring-borda">
              Sai da Carteira{" "}
              <strong className="text-marfim">{brl(valorDigitado)}</strong> →
              você recebe{" "}
              <strong className="text-brasa">{brl(creditoPrevisto)}</strong> de
              crédito na {loja.nome}
              {loja.bonus ? ` (+${loja.bonus}% de bônus da parceria)` : ""}.
            </p>
          )}
          {loja?.instrucoes && (
            <p className="text-sm text-texto2">{loja.instrucoes}</p>
          )}

          <div className="flex flex-col gap-2 rounded-md border-l-4 border-alerta bg-fundo2 p-3 text-sm text-texto2">
            <span>
              <strong className="text-marfim">
                Você precisa ter cadastro e login na {loja?.nome ?? "loja"}
              </strong>{" "}
              para usar o crédito.
              {loja?.cadastro && (
                <>
                  {" "}
                  <a href={loja.cadastro} target="_blank" rel="noopener">
                    Criar conta na loja
                  </a>
                </>
              )}
            </span>
            <span>
              A liga faz o Pix para a loja e a loja gera o crédito na sua conta
              em até <strong className="text-marfim">2 dias úteis</strong>.
              Depois de liberado, o crédito é da loja, segue as regras dela e
              não volta para a Carteira.
            </span>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="ciente"
              required
              className="mt-0.5 h-4 w-4 accent-[#d8392a]"
            />
            <span>
              Tenho cadastro na loja, li as regras e autorizo enviar meu nome,
              e-mail e a conta acima para a {loja?.nome ?? "loja"}.
            </span>
          </label>
          <button
            type="submit"
            disabled={enviando}
            className="min-h-11 self-start rounded-lg bg-vermelho px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {enviando ? "Enviando…" : "Resgatar na loja"}
          </button>
          {estadoLoja.erro && (
            <p className="text-sm text-erro">{estadoLoja.erro}</p>
          )}
          {estadoLoja.ok && (
            <p className="rounded-md border border-brasa/50 bg-brasa/10 p-3 text-sm font-semibold text-brasa">
              {estadoLoja.ok}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
