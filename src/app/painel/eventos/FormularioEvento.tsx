"use client";

import { useActionState, useEffect, useRef, startTransition } from "react";
import { salvarEvento, type EstadoEvento } from "./actions";

export type ValoresEvento = {
  id?: string;
  titulo: string;
  liga_id: number;
  formato: string;
  tipo: string;
  colecao: string;
  inicio: string;
  inscricoes_ate: string;
  modalidade: string;
  local: string;
  valor: string;
  vagas: string;
  minimo: string;
  percentual_premio: string;
  detalhes: string;
  status: string;
  link_endstep: string;
};

const campo =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo focus:border-ciano focus:outline-none";

export function FormularioEvento({ valores, ligas }: { valores: ValoresEvento; ligas: { id: number; nome: string }[] }) {
  const [estado, acao, enviando] = useActionState<EstadoEvento, FormData>(salvarEvento, {});
  const aviso = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estado.erro || estado.ok) aviso.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [estado]);

  // Envio sem "form action": assim o formulário não volta aos valores antigos depois de salvar
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    startTransition(() => acao(dados));
  }

  const mensagem = (estado.erro || estado.ok) && (
    <div
      ref={aviso}
      role={estado.erro ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm font-semibold md:col-span-2 ${
        estado.erro ? "border-erro text-erro" : "border-ciano text-ciano"
      }`}
    >
      {estado.erro ?? estado.ok}
    </div>
  );

  return (
    <form onSubmit={enviar} className="grid gap-5 md:grid-cols-2">
      {valores.id && <input type="hidden" name="id" value={valores.id} />}
      <Campo rotulo="Título" id="titulo" largo>
        <input id="titulo" name="titulo" required defaultValue={valores.titulo} placeholder="Etapa 1 · Pauper" className={campo} />
      </Campo>
      <Campo rotulo="Liga" id="liga_id">
        <select id="liga_id" name="liga_id" defaultValue={valores.liga_id} className={campo}>
          {ligas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Formato" id="formato">
        <select id="formato" name="formato" defaultValue={valores.formato} className={campo}>
          <option value="pauper">Pauper</option>
          <option value="draft">Draft</option>
          <option value="selado">Selado</option>
          <option value="cubo">Cubo</option>
        </select>
      </Campo>
      <Campo rotulo="Tipo no circuito" id="tipo">
        <select id="tipo" name="tipo" defaultValue={valores.tipo} className={campo}>
          <option value="etapa">Etapa (vale pontos no ranking)</option>
          <option value="final_trimestre">Final do Trimestre (define campeão e vice)</option>
          <option value="player_of_the_year">Player of the Year (final do ano)</option>
        </select>
      </Campo>
      <Campo rotulo="Coleção ou cubo (Limited)" id="colecao">
        <input id="colecao" name="colecao" defaultValue={valores.colecao} className={campo} />
      </Campo>
      <Campo rotulo="Status" id="status">
        <select id="status" name="status" defaultValue={valores.status} className={campo}>
          <option value="rascunho">Rascunho (não aparece no site)</option>
          <option value="aberto">Inscrições abertas</option>
          <option value="fechado">Inscrições encerradas</option>
          <option value="em_andamento">Em andamento</option>
          <option value="encerrado">Encerrado (aguardando resultados)</option>
          <option value="resultados">Resultados publicados</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </Campo>
      <Campo rotulo="Início (horário de Brasília)" id="inicio">
        <input id="inicio" name="inicio" type="datetime-local" required defaultValue={valores.inicio} className={campo} />
      </Campo>
      <Campo rotulo="Inscrições até" id="inscricoes_ate">
        <input id="inscricoes_ate" name="inscricoes_ate" type="datetime-local" required defaultValue={valores.inscricoes_ate} className={campo} />
      </Campo>
      <Campo rotulo="Modalidade" id="modalidade">
        <select id="modalidade" name="modalidade" defaultValue={valores.modalidade} className={campo}>
          <option value="online">Online (Endstep)</option>
          <option value="presencial">Presencial</option>
        </select>
      </Campo>
      <Campo rotulo="Local (presencial)" id="local">
        <input id="local" name="local" defaultValue={valores.local} className={campo} />
      </Campo>
      <Campo rotulo="Valor da inscrição (R$)" id="valor">
        <input id="valor" name="valor" inputMode="decimal" required defaultValue={valores.valor} className={campo} />
      </Campo>
      <Campo rotulo="Vagas (vazio = sem limite)" id="vagas">
        <input id="vagas" name="vagas" type="number" min="1" defaultValue={valores.vagas} className={campo} />
      </Campo>
      <Campo rotulo="Mínimo de jogadores" id="minimo">
        <input id="minimo" name="minimo" type="number" min="2" defaultValue={valores.minimo} className={campo} />
      </Campo>
      <Campo rotulo="% da inscrição para o prêmio" id="percentual_premio">
        <input id="percentual_premio" name="percentual_premio" type="number" min="0" max="100" defaultValue={valores.percentual_premio} className={campo} />
      </Campo>
      <Campo rotulo="Link privado do evento no Endstep" id="link_endstep" largo ajuda="Só aparece para quem tem inscrição confirmada.">
        <input id="link_endstep" name="link_endstep" type="text" inputMode="url" defaultValue={valores.link_endstep} placeholder="https://endstep.cc/..." className={campo} />
      </Campo>
      <Campo rotulo="Informações extras (opcional)" id="detalhes" largo>
        <textarea id="detalhes" name="detalhes" rows={4} defaultValue={valores.detalhes} className={`${campo} py-2`} />
      </Campo>

      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex min-h-11 items-center rounded-lg bg-azul px-6 font-semibold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar evento"}
        </button>
      </div>
      {mensagem}
    </form>
  );
}

function Campo({
  rotulo,
  id,
  ajuda,
  largo,
  children,
}: {
  rotulo: string;
  id: string;
  ajuda?: string;
  largo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${largo ? "md:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {rotulo}
      </label>
      {children}
      {ajuda && <span className="text-xs text-cinza">{ajuda}</span>}
    </div>
  );
}
