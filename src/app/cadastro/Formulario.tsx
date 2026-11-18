"use client";

import { useActionState, useState } from "react";
import { salvarCadastro, type EstadoCadastro } from "./actions";

type Inicial = {
  nome: string;
  email: string;
  nascimento: string;
  nick_endstep: string;
  cpf: string;
  chave_pix: string;
  pix_tipo?: string;
  responsavel_nome: string;
  responsavel_cpf: string;
};

const estiloCampo =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo placeholder:text-cinza focus:border-ciano focus:outline-none";

export function FormularioCadastro({ inicial, voltar }: { inicial: Inicial; voltar: string }) {
  const [estado, acao, enviando] = useActionState<EstadoCadastro, FormData>(salvarCadastro, {});
  const [nascimento, setNascimento] = useState(inicial.nascimento);

  const menor = (() => {
    if (!nascimento) return false;
    const n = new Date(`${nascimento}T12:00:00`);
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - 18);
    return n > limite;
  })();

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="voltar" value={voltar} />
      <Campo rotulo="Nome completo" id="nome">
        <input id="nome" name="nome" required defaultValue={inicial.nome} className={estiloCampo} autoComplete="name" />
      </Campo>
      <Campo rotulo="E-mail" id="email">
        <input id="email" name="email" type="email" required defaultValue={inicial.email} className={estiloCampo} autoComplete="email" />
      </Campo>
      <Campo rotulo="Data de nascimento" id="nascimento">
        <input
          id="nascimento"
          name="nascimento"
          type="date"
          required
          value={nascimento}
          onChange={(e) => setNascimento(e.target.value)}
          className={estiloCampo}
        />
      </Campo>
      <Campo rotulo="Nick no Endstep" id="nick_endstep" ajuda="Exatamente como aparece no Endstep. É por ele que encontramos você nos resultados.">
        <input id="nick_endstep" name="nick_endstep" required defaultValue={inicial.nick_endstep} className={estiloCampo} />
      </Campo>
      <Campo rotulo="CPF" id="cpf" ajuda="Usado só para identificar quem paga e evitar contas duplicadas. Nunca aparece no site.">
        <input id="cpf" name="cpf" required inputMode="numeric" defaultValue={inicial.cpf} placeholder="000.000.000-00" className={estiloCampo} />
      </Campo>
      <fieldset className="flex flex-col gap-3 rounded-xl border border-borda p-4">
        <legend className="px-2 text-sm font-semibold">Chave Pix (prêmios, saques e reembolsos)</legend>
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <select name="pix_tipo" required defaultValue={inicial.pix_tipo || "cpf"} aria-label="Tipo da chave" className={estiloCampo}>
            <option value="cpf">CPF</option>
            <option value="email">E-mail</option>
            <option value="telefone">Telefone</option>
            <option value="aleatoria">Chave aleatória</option>
          </select>
          <input id="chave_pix" name="chave_pix" required defaultValue={inicial.chave_pix} placeholder="Sua chave Pix" className={estiloCampo} />
        </div>
        <span className="text-xs text-cinza">
          A chave precisa estar no seu nome (ou do responsável, se você for menor). Recomendamos a chave CPF: o portal
          confere na hora se é o seu. No primeiro pagamento, a organização confere o nome do titular no banco.
        </span>
        <label className="flex items-start gap-2 text-sm text-texto2">
          <input type="checkbox" name="pix_titular" required className="mt-0.5 h-4 w-4 accent-[#2e6bff]" />
          Confirmo que a chave está no meu nome (ou do meu responsável).
        </label>
      </fieldset>

      {menor && (
        <fieldset className="flex flex-col gap-4 rounded-xl border border-alerta p-4">
          <legend className="px-2 text-sm font-semibold text-alerta">Responsável legal (menores de 18 anos)</legend>
          <Campo rotulo="Nome do responsável" id="responsavel_nome">
            <input id="responsavel_nome" name="responsavel_nome" required defaultValue={inicial.responsavel_nome} className={estiloCampo} />
          </Campo>
          <Campo rotulo="CPF do responsável" id="responsavel_cpf">
            <input id="responsavel_cpf" name="responsavel_cpf" required inputMode="numeric" defaultValue={inicial.responsavel_cpf} className={estiloCampo} />
          </Campo>
        </fieldset>
      )}

      <label className="flex items-start gap-3 text-sm text-texto2">
        <input type="checkbox" name="aceite" required className="mt-1 h-5 w-5 accent-[#2e6bff]" />
        <span>
          Li e aceito os <a href="/termos" target="_blank">Termos de uso</a>, a{" "}
          <a href="/privacidade" target="_blank">Política de privacidade</a> e as <a href="/regras" target="_blank">Regras da liga</a>.
        </span>
      </label>

      {estado.erro && (
        <p role="alert" className="rounded-lg border border-erro p-3 text-sm text-erro">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-azul px-6 font-semibold uppercase tracking-wide text-white disabled:opacity-60"
      >
        {enviando ? "Salvando…" : "Salvar e continuar"}
      </button>
    </form>
  );
}

function Campo({ rotulo, id, ajuda, children }: { rotulo: string; id: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {rotulo}
      </label>
      {children}
      {ajuda && <span className="text-xs text-cinza">{ajuda}</span>}
    </div>
  );
}
