"use client";

import { startTransition, useActionState, useState } from "react";
import { enderecoLinha, linkMapa } from "@/lib/lojas";
import { salvarParceiro, type EstadoLoja } from "./actions";

const CAMPO =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo focus:border-ciano focus:outline-none";
const ROTULO = "flex flex-col gap-1 text-sm font-semibold";
const DICA = "text-xs font-normal text-cinza";
const BLOCO = "grid gap-4 rounded-xl border border-borda p-5 sm:grid-cols-2";
const LEGENDA = "px-2 text-sm font-bold uppercase tracking-wider text-ciano";

export type LojaForm = {
  id?: string;
  nome?: string;
  slug?: string | null;
  descricao?: string | null;
  logo_url?: string | null;
  foto_url?: string | null;
  site_url?: string | null;
  url_compra_lista?: string | null;
  compra_deck?: boolean;
  mostrar_logo?: boolean;
  sede_eventos?: boolean;
  aceita_credito?: boolean;
  instrucoes_credito?: string | null;
  bonus_credito_pct?: number;
  ativo?: boolean;
  ordem?: number;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  mapa_url?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  horario?: string | null;
  mesas?: number | null;
  observacoes_local?: string | null;
  credito?: {
    razao_social: string | null;
    cnpj: string | null;
    pix_tipo: string | null;
    pix_chave: string | null;
    pix_titular: string | null;
    email_pedidos: string | null;
    url_cadastro: string | null;
    identificacao: string;
  } | null;
};

export function FormularioLoja({ atual }: { atual: LojaForm | null }) {
  const [estado, acao, salvando] = useActionState<EstadoLoja, FormData>(
    salvarParceiro,
    {},
  );
  const [papeis, setPapeis] = useState({
    sede: atual?.sede_eventos ?? false,
    credito: atual?.aceita_credito ?? false,
    venda: atual?.compra_deck ?? false,
  });
  const [end, setEnd] = useState({
    cep: atual?.cep ?? "",
    logradouro: atual?.logradouro ?? "",
    numero: atual?.numero ?? "",
    complemento: atual?.complemento ?? "",
    bairro: atual?.bairro ?? "",
    cidade: atual?.cidade ?? "",
    uf: atual?.uf ?? "",
    mapa_url: atual?.mapa_url ?? "",
  });
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState("");
  const c = atual?.credito;

  async function buscarCep(valor: string) {
    const cep = valor.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setBuscandoCep(true);
    setAvisoCep("");
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = (await r.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (d.erro) setAvisoCep("CEP não encontrado. Preencha o endereço à mão.");
      else
        setEnd((e) => ({
          ...e,
          logradouro: d.logradouro || e.logradouro,
          bairro: d.bairro || e.bairro,
          cidade: d.localidade || e.cidade,
          uf: d.uf || e.uf,
        }));
    } catch {
      setAvisoCep("Não foi possível buscar o CEP agora. Preencha à mão.");
    } finally {
      setBuscandoCep(false);
    }
  }

  const campoEnd = (
    k: keyof typeof end,
    rotulo: string,
    extra?: { classe?: string; placeholder?: string; obrigatorio?: boolean },
  ) => (
    <label className={`${ROTULO} ${extra?.classe ?? ""}`}>
      {rotulo}
      <input
        name={k}
        value={end[k]}
        required={extra?.obrigatorio}
        placeholder={extra?.placeholder}
        onChange={(e) => setEnd({ ...end, [k]: e.target.value })}
        className={CAMPO}
      />
    </label>
  );
  const temEndereco = end.logradouro && end.cidade;

  return (
    <form
      id="form"
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        startTransition(() => acao(dados)); // mantém o que foi digitado se houver erro
      }}
      className="flex scroll-mt-20 flex-col gap-5"
    >
      <h2 className="titulo text-3xl">
        {atual?.id ? `Editar ${atual.nome}` : "Nova loja ou parceiro"}
      </h2>
      {atual?.id && <input type="hidden" name="id" value={atual.id} />}

      <fieldset className={BLOCO}>
        <legend className={LEGENDA}>Identidade</legend>
        <label className={ROTULO}>
          Nome
          <input
            name="nome"
            required
            defaultValue={atual?.nome}
            className={CAMPO}
          />
        </label>
        <label className={ROTULO}>
          Site (opcional)
          <input
            name="site_url"
            defaultValue={atual?.site_url ?? ""}
            placeholder="https://"
            className={CAMPO}
          />
        </label>
        <label className={`${ROTULO} sm:col-span-2`}>
          Descrição curta
          <input
            name="descricao"
            defaultValue={atual?.descricao ?? ""}
            placeholder="Loja de cards em Pinheiros com mesas para 40 jogadores"
            className={CAMPO}
          />
        </label>
        <label className={ROTULO}>
          Logo (PNG, SVG ou WebP, até 3 MB)
          <input
            type="file"
            name="logo"
            accept="image/png,image/svg+xml,image/webp,image/jpeg"
            className="text-sm font-normal"
          />
          {atual?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={atual.logo_url}
              alt=""
              className="mt-2 h-10 w-auto self-start object-contain"
            />
          )}
        </label>
        <label className={ROTULO}>
          Foto da loja (opcional, horizontal)
          <input
            type="file"
            name="foto"
            accept="image/png,image/webp,image/jpeg"
            className="text-sm font-normal"
          />
          {atual?.foto_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={atual.foto_url}
              alt=""
              className="mt-2 h-16 w-auto self-start rounded object-cover"
            />
          )}
        </label>
      </fieldset>

      <fieldset className={BLOCO}>
        <legend className={LEGENDA}>O que a loja faz com a liga</legend>
        {[
          [
            "mostrar_logo",
            "Parceiro / patrocinador",
            "Logo na faixa de parceiros e na página /parceiros.",
            atual?.mostrar_logo ?? true,
            null,
          ],
          [
            "sede_eventos",
            "Sede de eventos presenciais",
            "Aparece para escolher no cadastro de eventos presenciais.",
            papeis.sede,
            "sede",
          ],
          [
            "aceita_credito",
            "Recebe resgate de prêmios",
            "Jogadores trocam saldo da Carteira por crédito na loja.",
            papeis.credito,
            "credito",
          ],
          [
            "compra_deck",
            "Vende cartas",
            "Só informativo, para a organização.",
            papeis.venda,
            "venda",
          ],
        ].map(([nome, rotulo, dica, valor, chave]) => (
          <label
            key={nome as string}
            className="flex cursor-pointer items-start gap-3 rounded-lg bg-grafite p-3 ring-1 ring-borda"
          >
            <input
              type="checkbox"
              name={nome as string}
              defaultChecked={valor as boolean}
              onChange={
                chave
                  ? (e) =>
                      setPapeis({
                        ...papeis,
                        [chave as string]: e.target.checked,
                      })
                  : undefined
              }
              className="mt-1 h-4 w-4 accent-[#2e6bff]"
            />
            <span className="flex flex-col">
              <span className="font-semibold">{rotulo as string}</span>
              <span className={DICA}>{dica as string}</span>
            </span>
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={atual?.ativo ?? true}
            className="h-4 w-4 accent-[#2e6bff]"
          />{" "}
          Ativa (desmarque para esconder do site)
        </label>
        <label className={ROTULO}>
          Ordem na faixa de parceiros
          <input
            name="ordem"
            type="number"
            defaultValue={atual?.ordem ?? 0}
            className={CAMPO}
          />
        </label>
      </fieldset>

      <fieldset className={BLOCO}>
        <legend className={LEGENDA}>
          Endereço{" "}
          {papeis.sede
            ? "(obrigatório para sede)"
            : "(opcional para loja online)"}
        </legend>
        <label className={ROTULO}>
          CEP
          <input
            name="cep"
            inputMode="numeric"
            value={end.cep}
            placeholder="00000-000"
            onChange={(e) => {
              setEnd({ ...end, cep: e.target.value });
              buscarCep(e.target.value);
            }}
            className={CAMPO}
          />
          <span className={DICA}>
            {buscandoCep
              ? "Buscando endereço…"
              : avisoCep || "Preenche rua, bairro, cidade e UF."}
          </span>
        </label>
        {campoEnd("logradouro", "Rua / avenida", { obrigatorio: papeis.sede })}
        <div className="grid grid-cols-2 gap-4">
          {campoEnd("numero", "Número", { obrigatorio: papeis.sede })}
          {campoEnd("complemento", "Complemento", { placeholder: "Sala 2" })}
        </div>
        {campoEnd("bairro", "Bairro")}
        <div className="grid grid-cols-[1fr_80px] gap-4">
          {campoEnd("cidade", "Cidade", { obrigatorio: papeis.sede })}
          {campoEnd("uf", "UF", { obrigatorio: papeis.sede })}
        </div>
        <label className={ROTULO}>
          Link do Google Maps (opcional)
          <input
            name="mapa_url"
            value={end.mapa_url}
            onChange={(e) => setEnd({ ...end, mapa_url: e.target.value })}
            placeholder="https://maps.app.goo.gl/…"
            className={CAMPO}
          />
          <span className={DICA}>
            Sem link, o mapa é montado pelo endereço.
          </span>
        </label>
        {temEndereco && (
          <p className="text-sm text-texto2 sm:col-span-2">
            {enderecoLinha(end)} ·{" "}
            <a
              href={linkMapa({ ...end, nome: atual?.nome })}
              target="_blank"
              rel="noopener"
            >
              conferir no mapa
            </a>
          </p>
        )}
      </fieldset>

      <fieldset className={BLOCO}>
        <legend className={LEGENDA}>Contato e funcionamento</legend>
        <label className={ROTULO}>
          Instagram
          <input
            name="instagram"
            defaultValue={atual?.instagram ? `@${atual.instagram}` : ""}
            placeholder="@loja"
            className={CAMPO}
          />
        </label>
        <label className={ROTULO}>
          WhatsApp
          <input
            name="whatsapp"
            defaultValue={atual?.whatsapp ?? ""}
            inputMode="tel"
            placeholder="(11) 90000-0000"
            className={CAMPO}
          />
        </label>
        <label className={ROTULO}>
          Horário de funcionamento
          <input
            name="horario"
            defaultValue={atual?.horario ?? ""}
            placeholder="Ter a sáb, 12h às 22h"
            className={CAMPO}
          />
        </label>
        {papeis.sede && (
          <label className={ROTULO}>
            Mesas disponíveis
            <input
              name="mesas"
              type="number"
              min={1}
              defaultValue={atual?.mesas ?? ""}
              className={CAMPO}
            />
          </label>
        )}
        {papeis.sede && (
          <label className={`${ROTULO} sm:col-span-2`}>
            Observações para quem vai jogar
            <input
              name="observacoes_local"
              defaultValue={atual?.observacoes_local ?? ""}
              placeholder="Estacionamento na rua de trás, acesso para cadeira de rodas, lanchonete"
              className={CAMPO}
            />
          </label>
        )}
      </fieldset>

      {papeis.venda && (
        <fieldset className={BLOCO}>
          <legend className={LEGENDA}>Venda de cartas</legend>
          <label className={`${ROTULO} sm:col-span-2`}>
            Link de compra por lista (opcional)
            <input
              name="url_compra_lista"
              defaultValue={atual?.url_compra_lista ?? ""}
              placeholder="https://loja.com.br/lista?cards={lista}"
              className={CAMPO}
            />
            <span className={DICA}>
              Use {"{lista}"} onde a loja recebe as cartas. Sem isso, o botão
              copia a lista e abre o site.
            </span>
          </label>
        </fieldset>
      )}

      {papeis.credito && (
        <fieldset className={BLOCO}>
          <legend className={LEGENDA}>
            Resgate de prêmios (só a organização vê)
          </legend>
          <label className={ROTULO}>
            E-mail que recebe os pedidos
            <input
              name="email_pedidos"
              type="email"
              required
              defaultValue={c?.email_pedidos ?? ""}
              placeholder="financeiro@loja.com.br"
              className={CAMPO}
            />
          </label>
          <label className={ROTULO}>
            Bônus da loja (%)
            <input
              name="bonus_credito_pct"
              type="number"
              min={0}
              max={100}
              defaultValue={atual?.bonus_credito_pct ?? 0}
              className={CAMPO}
            />
            <span className={DICA}>
              Ex.: 10 → R$ 50 enviados viram R$ 55 de crédito.
            </span>
          </label>
          <label className={ROTULO}>
            Tipo da chave Pix
            <select
              name="pix_tipo"
              defaultValue={c?.pix_tipo ?? "cnpj"}
              className={CAMPO}
            >
              <option value="cnpj">CNPJ</option>
              <option value="cpf">CPF</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Aleatória</option>
            </select>
          </label>
          <label className={ROTULO}>
            Chave Pix
            <input
              name="pix_chave"
              required
              defaultValue={c?.pix_chave ?? ""}
              className={CAMPO}
            />
          </label>
          <label className={ROTULO}>
            Titular da chave
            <input
              name="pix_titular"
              defaultValue={c?.pix_titular ?? ""}
              placeholder="Como aparece no banco"
              className={CAMPO}
            />
          </label>
          <label className={ROTULO}>
            Razão social
            <input
              name="razao_social"
              defaultValue={c?.razao_social ?? ""}
              className={CAMPO}
            />
          </label>
          <label className={ROTULO}>
            CNPJ
            <input
              name="cnpj"
              defaultValue={c?.cnpj ?? ""}
              inputMode="numeric"
              className={CAMPO}
            />
          </label>
          <label className={ROTULO}>
            Como a loja identifica o cliente
            <select
              name="identificacao"
              defaultValue={c?.identificacao ?? "email"}
              className={CAMPO}
            >
              <option value="email">E-mail da conta na loja</option>
              <option value="cpf">CPF</option>
              <option value="usuario">Usuário da conta</option>
            </select>
          </label>
          <label className={`${ROTULO} sm:col-span-2`}>
            Link para o jogador criar conta na loja
            <input
              name="url_cadastro"
              defaultValue={c?.url_cadastro ?? ""}
              placeholder="https://loja.com.br/cadastro"
              className={CAMPO}
            />
          </label>
          <label className={`${ROTULO} sm:col-span-2`}>
            Instruções para o jogador (opcional)
            <input
              name="instrucoes_credito"
              defaultValue={atual?.instrucoes_credito ?? ""}
              placeholder="O crédito aparece em Minha conta → Vale-compras."
              className={CAMPO}
            />
          </label>
        </fieldset>
      )}

      {estado.erro && (
        <p className="rounded-md border border-erro/50 bg-erro/10 p-3 text-sm text-erro">
          {estado.erro}
        </p>
      )}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={salvando}
          className="min-h-11 rounded-lg bg-azul px-5 font-semibold text-white disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar loja"}
        </button>
        {atual?.id && (
          <a href="/painel/parceiros" className="self-center text-sm">
            Cancelar
          </a>
        )}
      </div>
    </form>
  );
}
