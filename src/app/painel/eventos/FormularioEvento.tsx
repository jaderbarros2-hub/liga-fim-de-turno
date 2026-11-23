"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { CamposLimited } from "./CamposLimited";
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
  loja_id?: string;
  valor: string;
  vagas: string;
  minimo: string;
  percentual_premio: string;
  detalhes: string;
  perguntas?: string;
  status: string;
  link_endstep: string;
  colecao_codigo?: string;
  colecao_icone?: string | null;
  pacotes?: string;
  cubo_link?: string;
  cubo?: {
    cubecobra_id: string;
    nome: string;
    dono: string | null;
    imagem_url: string | null;
    total_cartas: number;
  } | null;
};

const campo =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-marfim focus:border-brasa focus:outline-none";

/** A liga sai do formato: Pauper vai para a Liga Pauper; draft, selado e cubo, para a Liga Limited. */
export function FormularioEvento({
  valores,
  lojas = [],
}: {
  valores: ValoresEvento;
  ligas?: { id: number; nome: string }[];
  lojas?: { id: string; nome: string; cidade: string | null }[];
}) {
  const [modalidade, setModalidade] = useState(valores.modalidade);
  const [estado, acao, enviando] = useActionState<EstadoEvento, FormData>(
    salvarEvento,
    {},
  );
  const aviso = useRef<HTMLDivElement>(null);
  const [formato, setFormato] = useState(valores.formato);

  useEffect(() => {
    if (estado.erro || estado.ok)
      aviso.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
        estado.erro ? "border-erro text-erro" : "border-brasa text-brasa"
      }`}
    >
      {estado.erro ?? estado.ok}
    </div>
  );

  return (
    <form onSubmit={enviar} className="grid gap-5 md:grid-cols-2">
      {valores.id && <input type="hidden" name="id" value={valores.id} />}
      <Campo rotulo="Título" id="titulo" largo>
        <input
          id="titulo"
          name="titulo"
          required
          defaultValue={valores.titulo}
          placeholder="Etapa 1 · Pauper"
          className={campo}
        />
      </Campo>
      <Campo rotulo="Formato" id="formato">
        <select
          id="formato"
          name="formato"
          value={formato}
          onChange={(e) => setFormato(e.target.value)}
          className={campo}
        >
          <option value="pauper">Pauper</option>
          <option value="premodern">Premodern</option>
          <option value="draft">Draft</option>
          <option value="selado">Selado</option>
          <option value="cubo">Cube Draft</option>
        </select>
      </Campo>
      <Campo rotulo="Tipo no circuito" id="tipo">
        <select
          id="tipo"
          name="tipo"
          defaultValue={valores.tipo}
          className={campo}
        >
          <option value="etapa">Etapa (vale pontos no ranking)</option>
          <option value="final_trimestre">
            Final do Trimestre (define campeão e vice)
          </option>
          <option value="player_of_the_year">
            Player of the Year (final do ano)
          </option>
        </select>
      </Campo>
      <CamposLimited
        formato={formato}
        inicial={{
          colecao_codigo: valores.colecao_codigo ?? "",
          colecao_nome: valores.colecao,
          colecao_icone: valores.colecao_icone ?? null,
          pacotes: valores.pacotes ?? "",
          cubo_link: valores.cubo_link ?? "",
          cubo: valores.cubo ?? null,
        }}
      />
      <Campo rotulo="Status" id="status">
        <select
          id="status"
          name="status"
          defaultValue={valores.status}
          className={campo}
        >
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
        <input
          id="inicio"
          name="inicio"
          type="datetime-local"
          required
          defaultValue={valores.inicio}
          className={campo}
        />
      </Campo>
      <Campo rotulo="Inscrições até" id="inscricoes_ate">
        <input
          id="inscricoes_ate"
          name="inscricoes_ate"
          type="datetime-local"
          required
          defaultValue={valores.inscricoes_ate}
          className={campo}
        />
      </Campo>
      <Campo rotulo="Modalidade" id="modalidade">
        <select
          id="modalidade"
          name="modalidade"
          value={modalidade}
          onChange={(e) => setModalidade(e.target.value)}
          className={campo}
        >
          <option value="online">Online (Endstep)</option>
          <option value="presencial">Presencial</option>
        </select>
      </Campo>
      {modalidade === "presencial" ? (
        <>
          <Campo rotulo="Loja (obrigatório para publicar)" id="loja_id">
            <select
              id="loja_id"
              name="loja_id"
              defaultValue={valores.loja_id ?? ""}
              className={campo}
            >
              <option value="">Escolha a loja</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                  {l.cidade ? ` · ${l.cidade}` : ""}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-cinza">
              {lojas.length
                ? "Endereço, mapa e contato vêm do cadastro da loja."
                : "Nenhuma loja marcada como sede."}{" "}
              <a href="/painel/parceiros#form" target="_blank">
                Cadastrar loja
              </a>
            </span>
          </Campo>
          <Campo rotulo="Observação do local (opcional)" id="local">
            <input
              id="local"
              name="local"
              defaultValue={valores.local}
              placeholder="Ex.: sala do 2º andar, entrada pela lateral"
              className={campo}
            />
          </Campo>
        </>
      ) : (
        <input type="hidden" name="local" value="" />
      )}
      <Campo rotulo="Valor da inscrição (R$)" id="valor">
        <input
          id="valor"
          name="valor"
          inputMode="decimal"
          required
          defaultValue={valores.valor}
          className={campo}
        />
      </Campo>
      <Campo rotulo="Vagas (vazio = sem limite)" id="vagas">
        <input
          id="vagas"
          name="vagas"
          type="number"
          min="1"
          defaultValue={valores.vagas}
          className={campo}
        />
      </Campo>
      <Campo rotulo="Mínimo de jogadores" id="minimo">
        <input
          id="minimo"
          name="minimo"
          type="number"
          min="2"
          defaultValue={valores.minimo}
          className={campo}
        />
      </Campo>
      <Campo rotulo="% da inscrição para o prêmio" id="percentual_premio">
        <input
          id="percentual_premio"
          name="percentual_premio"
          type="number"
          min="0"
          max="100"
          defaultValue={valores.percentual_premio}
          className={campo}
        />
      </Campo>
      <Campo
        rotulo="Link privado do evento no Endstep"
        id="link_endstep"
        largo
        ajuda="Obrigatório para publicar um evento online. Só aparece para quem tem ingresso confirmado."
      >
        <input
          id="link_endstep"
          name="link_endstep"
          type="text"
          inputMode="url"
          defaultValue={valores.link_endstep}
          placeholder="https://endstep.cc/..."
          className={campo}
        />
      </Campo>
      <Campo rotulo="Informações extras (opcional)" id="detalhes" largo>
        <textarea
          id="detalhes"
          name="detalhes"
          rows={4}
          defaultValue={valores.detalhes}
          className={`${campo} py-2`}
        />
      </Campo>
      <Campo
        rotulo="Perguntas frequentes deste evento (opcional)"
        id="perguntas"
        largo
        ajuda="Aparecem junto das perguntas padrão. Primeira linha = pergunta, linhas seguintes = resposta. Deixe uma linha em branco entre uma pergunta e outra."
      >
        <textarea
          id="perguntas"
          name="perguntas"
          rows={5}
          defaultValue={valores.perguntas}
          placeholder={
            "Tem estacionamento?\nSim, na rua de trás, gratuito.\n\nVai ter lanche?\nA loja tem lanchonete aberta durante o evento."
          }
          className={`${campo} py-2`}
        />
      </Campo>

      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex min-h-11 items-center rounded-lg bg-vermelho px-6 font-semibold uppercase tracking-wide text-white disabled:opacity-60"
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
