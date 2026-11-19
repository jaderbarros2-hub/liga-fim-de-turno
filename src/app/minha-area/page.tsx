import { ehConstruido, NOME_LIGA } from "@/lib/formatos";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import type { Metadata } from "next";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { linkMapa } from "@/lib/lojas";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BotaoLink, Etiqueta, botao } from "@/components/Botao";
import { CartaoEvento, EtiquetaLiga } from "@/components/Eventos";
import { FotoJogador } from "@/components/Jogador";
import { cartaDestaque } from "@/components/PaginaDeck";
import { arteFixa, capaDoEvento, creditoArte, srcArte } from "@/lib/artes";
import { classificadosPOTY, periodo, ranking } from "@/lib/circuito";
import { listarProximosEventos } from "@/lib/dados";
import type { ItemLista } from "@/lib/decklist";
import { dataCurta, dataLonga, hora, reais } from "@/lib/formato";
import { buscarCartas } from "@/lib/scryfall";
import {
  criarClienteServidor,
  supabaseConfigurado,
} from "@/lib/supabase/server";
import { mascararChave } from "@/lib/validacao";
import {
  DIAS_SAQUE_AUTOMATICO,
  movimentosDaCarteira,
  NOMES_MOVIMENTO,
  SAQUE_MINIMO,
} from "@/lib/carteira";
import { CarteiraAcoes } from "./CarteiraAcoes";
import { FormularioCadastro } from "../cadastro/Formulario";
import { FormularioPerfil } from "./FormularioPerfil";
import { linkJogador, type Redes } from "@/lib/perfil";
import { cancelarInscricao } from "../eventos/[slug]/inscricao/actions";

export const metadata: Metadata = { title: "Minha área" };
export const dynamic = "force-dynamic";

type Evento = {
  id: string;
  slug: string;
  titulo: string;
  inicio: string;
  status: string;
  formato: string;
  colecao?: string | null;
  modalidade?: string;
  loja?: {
    nome: string;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
    cep: string | null;
    mapa_url: string | null;
  } | null;
  liga: { slug: string };
  colecao_info?: {
    arte_url: string | null;
    arte_credito: string | null;
  } | null;
  cubo_info?: {
    imagem_url: string | null;
    imagem_credito: string | null;
  } | null;
};
type Inscricao = {
  id: string;
  status: string;
  deck_nome: string | null;
  evento: Evento;
};
type Deck = {
  id: string;
  nome: string;
  formato: string;
  legal: boolean;
  qtd_principal: number;
  qtd_sideboard: number;
  principal: ItemLista[];
  atualizado_em: string;
  arquetipo: { nome: string } | null;
};

const STATUS_INSCRICAO: Record<
  string,
  { rotulo: string; tipo: "ciano" | "alerta" | "contorno" }
> = {
  confirmada: { rotulo: "Confirmada", tipo: "ciano" },
  aguardando_pagamento: { rotulo: "Aguardando Pix", tipo: "alerta" },
  expirada: { rotulo: "Pix expirado", tipo: "contorno" },
  cancelada: { rotulo: "Cancelada", tipo: "contorno" },
  reembolsada: { rotulo: "Reembolsada", tipo: "contorno" },
};

const ABAS = [
  { id: "visao", rotulo: "Visão geral" },
  { id: "inscricoes", rotulo: "Ingressos" },
  { id: "decks", rotulo: "Decks" },
  { id: "carteira", rotulo: "Carteira" },
  { id: "dados", rotulo: "Meus dados" },
];

/** Pendente: sempre; confirmada: até 24h antes do início (gera pedido de reembolso). */
function podeCancelar(i: Inscricao) {
  const inicio = new Date(i.evento.inicio).getTime();
  if (i.status === "aguardando_pagamento") return inicio > Date.now();
  if (i.status === "confirmada") return inicio - 24 * 3600_000 > Date.now();
  return false;
}

export default async function MinhaArea({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; salvo?: string }>;
}) {
  if (!supabaseConfigurado()) redirect("/");
  const q = await searchParams;
  const aba = ABAS.some((a) => a.id === q.aba) ? q.aba! : "visao";
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/minha-area");

  const { data: jogador } = await supabase
    .from("jogadores")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!jogador?.aceite_termos_em) redirect("/cadastro?voltar=/minha-area");
  const { data: souAutor } = await supabase
    .from("autores")
    .select("id")
    .eq("jogador_id", user.id)
    .maybeSingle();
  const nick: string =
    jogador.nick_endstep || jogador.discord_nome || jogador.nome || "Jogador";

  const agora = new Date();
  const per = periodo(agora.toISOString());
  const [
    { data: dInsc },
    { data: dDecks },
    { data: dRes },
    rankP,
    rankL,
    potyP,
    potyL,
    rankPM,
    potyPM,
    dCred,
  ] = await Promise.all([
    supabase
      .from("inscricoes")
      .select(
        "id, status, deck_nome, evento:eventos(id, slug, titulo, inicio, status, formato, colecao, modalidade, loja:parceiros(nome, logradouro, numero, bairro, cidade, uf, cep, mapa_url), liga:ligas(slug), colecao_info:colecoes(arte_url, arte_credito), cubo_info:cubos(imagem_url, imagem_credito))",
      )
      .eq("jogador_id", user.id)
      .order("criado_em", { ascending: false }),
    supabase
      .from("decks")
      .select(
        "id, nome, formato, legal, qtd_principal, qtd_sideboard, principal, atualizado_em, arquetipo:arquetipos(nome)",
      )
      .eq("jogador_id", user.id)
      .order("atualizado_em", { ascending: false }),
    supabase
      .from("resultados")
      .select(
        "posicao, vitorias, derrotas, empates, evento:eventos!inner(id, slug, titulo, inicio, formato, status)",
      )
      .eq("jogador_id", user.id)
      .eq("evento.status", "resultados"),
    ranking("pauper", per.temporada, per.trimestre),
    ranking("limited", per.temporada, per.trimestre),
    classificadosPOTY("pauper", per.temporada),
    classificadosPOTY("limited", per.temporada),
    ranking("premodern", per.temporada, per.trimestre),
    classificadosPOTY("premodern", per.temporada),
    movimentosDaCarteira(user.id),
  ]);
  const movimentos = dCred;
  const saldo = movimentos
    .filter((m) => m.status !== "cancelado")
    .reduce((s, m) => s + m.valor_centavos, 0);
  const emProcessamento = movimentos.filter(
    (m) => m.status === "pendente" && m.valor_centavos < 0,
  );
  const totalProcessamento = -emProcessamento.reduce(
    (s, m) => s + m.valor_centavos,
    0,
  );
  const ultimoMov = movimentos.filter((m) => m.status !== "cancelado")[0]
    ?.criado_em;
  const diasAutomatico = ultimoMov
    ? Math.max(
        0,
        DIAS_SAQUE_AUTOMATICO -
          Math.floor((Date.now() - new Date(ultimoMov).getTime()) / 864e5),
      )
    : null;
  const inscricoes = ((dInsc as unknown as Inscricao[]) ?? []).filter(
    (i) => i.evento,
  );
  const decks = (dDecks as unknown as Deck[]) ?? [];
  const resultados = (
    (dRes as unknown as {
      posicao: number;
      vitorias: number;
      derrotas: number;
      empates: number;
      evento: Evento;
    }[]) ?? []
  ).sort((a, b) => b.evento.inicio.localeCompare(a.evento.inicio));

  // Lojas que aceitam resgate (só as que já têm chave Pix e e-mail de pedidos cadastrados)
  const admin = criarClienteAdmin();
  const { data: dLojas } = await admin
    .from("parceiros")
    .select(
      "id, nome, slug, logo_url, cidade, uf, instrucoes_credito, bonus_credito_pct, credito:lojas_credito!inner(url_cadastro, identificacao, pix_chave, email_pedidos)",
    )
    .eq("ativo", true)
    .eq("aceita_credito", true)
    .order("nome");
  type LojaCred = {
    id: string;
    nome: string;
    slug: string | null;
    logo_url: string | null;
    cidade: string | null;
    uf: string | null;
    instrucoes_credito: string | null;
    bonus_credito_pct: number;
    credito: {
      url_cadastro: string | null;
      identificacao: string;
      pix_chave: string | null;
      email_pedidos: string | null;
    };
  };
  const lojasCredito = ((dLojas as unknown as LojaCred[] | null) ?? [])
    .filter((l) => l.credito?.pix_chave && l.credito.email_pedidos)
    .map((l) => ({
      id: l.id,
      nome: l.nome,
      slug: l.slug,
      logo: l.logo_url,
      cidade: [l.cidade, l.uf].filter(Boolean).join("/"),
      instrucoes: l.instrucoes_credito,
      bonus: l.bonus_credito_pct,
      cadastro: l.credito.url_cadastro,
      identificacao: l.credito.identificacao,
    }));

  // Circuito: posição no trimestre e vaga no Player of the Year, por formato
  const temporada = [
    { slug: "pauper", nome: "Pauper", rank: rankP, poty: potyP },
    { slug: "premodern", nome: "Premodern", rank: rankPM, poty: potyPM },
    { slug: "limited", nome: "Limited", rank: rankL, poty: potyL },
  ]
    .map((f) => ({
      ...f,
      linha: f.rank.find((l) => l.id === user.id),
      vaga: f.poty.vagas.find((v) => v.id === user.id),
    }))
    .filter((f) => f.linha || f.vaga);
  const principal = [...temporada].sort(
    (a, b) => (b.linha?.pontos ?? 0) - (a.linha?.pontos ?? 0),
  )[0];

  // Próxima mesa
  const futuras = inscricoes.filter(
    (i) => new Date(i.evento.inicio).getTime() > agora.getTime() - 6 * 3600_000,
  );
  const pendente = futuras.find((i) => i.status === "aguardando_pagamento");
  const confirmada = futuras
    .filter((i) => i.status === "confirmada")
    .sort((a, b) => a.evento.inicio.localeCompare(b.evento.inicio))[0];
  const proxima = pendente ?? confirmada;
  const [{ data: link }, sugestao] = await Promise.all([
    confirmada && !pendente
      ? supabase
          .from("evento_links")
          .select("link_endstep")
          .eq("evento_id", confirmada.evento.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    proxima ? Promise.resolve([]) : listarProximosEventos(1),
  ]);

  // Pendências
  const deckProblema = decks.find((d) => !d.legal);
  const semDeck =
    confirmada &&
    ehConstruido(confirmada.evento.formato) &&
    !confirmada.deck_nome;
  const pendencias = [
    !jogador.chave_pix && {
      texto: "Cadastre sua chave Pix para receber prêmios.",
      href: "/minha-area?aba=dados",
      acao: "Cadastrar",
    },
    semDeck && {
      texto: `Escolha o deck para ${confirmada!.evento.titulo}.`,
      href: `/eventos/${confirmada!.evento.slug}`,
      acao: "Escolher deck",
    },
    saldo > 0 && {
      texto: `Você tem ${reais(saldo)} na Carteira: use num ingresso, saque ou envie para uma loja.${
        diasAutomatico !== null && diasAutomatico <= 7
          ? ` Sem uso, vai para o seu Pix em ${diasAutomatico} dia(s).`
          : ""
      }`,
      href: "/minha-area?aba=carteira",
      acao: "Abrir Carteira",
    },
    emProcessamento.length > 0 && {
      texto: `Em processamento: ${reais(Math.abs(totalProcessamento))} (saques e envios para lojas).`,
      href: "/minha-area?aba=carteira",
      acao: "Acompanhar",
    },
    deckProblema && {
      texto: `O deck "${deckProblema.nome}" tem cartas fora da lista do ${NOME_LIGA[deckProblema.formato] ?? "formato"}.`,
      href: `/minha-area/decks/${deckProblema.id}`,
      acao: "Revisar",
    },
  ].filter(Boolean) as { texto: string; href: string; acao: string }[];

  // Arte do topo e dos decks: carta principal de cada deck
  const cartas = decks.length
    ? await buscarCartas([
        ...new Set(
          decks.flatMap((d) => (d.principal ?? []).map((i) => i.nome)),
        ),
      ])
    : new Map();
  const arteDeck = new Map(
    decks.map((d) => {
      const c = cartaDestaque(d.principal ?? [], cartas);
      return [
        d.id,
        c?.imagem_grande?.replace("/normal/", "/art_crop/") ?? null,
      ] as const;
    }),
  );
  const reserva = arteFixa(user.id, "pauper");
  const arteTopo = (decks[0] && arteDeck.get(decks[0].id)) || srcArte(reserva);

  return (
    <>
      {/* Topo do jogador */}
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={arteTopo}
          alt=""
          style={{
            objectPosition:
              arteTopo === srcArte(reserva) ? reserva.foco : "50% 30%",
          }}
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/40" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-end gap-6 px-6 pb-8 pt-12">
          <FotoJogador nick={nick} avatar={jogador.avatar_url} tamanho={88} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="flex flex-wrap items-center gap-4 text-sm font-semibold uppercase tracking-widest text-ciano">
              Minha área
              <Link
                href={linkJogador(nick)}
                className="normal-case tracking-normal"
              >
                Ver meu perfil público →
              </Link>
            </span>
            <h1 className="titulo flex flex-wrap items-center gap-3 text-5xl sm:text-6xl">
              {nick}
              {temporada.some((f) => f.vaga) && (
                <span className="rounded bg-alerta px-2 py-1 font-sans text-xs font-bold uppercase tracking-wider text-preto">
                  Classificado POTY
                </span>
              )}
            </h1>
          </div>
          <dl className="flex gap-px overflow-hidden rounded-md bg-borda ring-1 ring-borda">
            {[
              [
                "Ranking T" + per.trimestre,
                principal?.linha ? `${principal.linha.posicao}º` : "—",
              ],
              [
                "Pontos",
                principal?.linha ? String(principal.linha.pontos) : "0",
              ],
              ["Etapas", String(resultados.length)],
            ].map(([r, v]) => (
              <div
                key={r}
                className="flex min-w-24 flex-col bg-preto/70 px-4 py-3 backdrop-blur"
              >
                <dd className="titulo text-3xl">{v}</dd>
                <dt className="text-xs text-cinza">{r}</dt>
              </div>
            ))}
          </dl>
        </div>
        {arteTopo === srcArte(reserva) && (
          <span className="absolute bottom-2 right-4 hidden text-[11px] text-white/50 sm:block">
            {creditoArte(reserva)}
          </span>
        )}
      </section>

      <nav
        aria-label="Seções da minha área"
        className="z-20 border-b border-borda bg-preto/90 backdrop-blur md:sticky md:top-16"
      >
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6 text-sm font-semibold">
          {ABAS.map((a) => (
            <Link
              key={a.id}
              href={
                a.id === "visao" ? "/minha-area" : `/minha-area?aba=${a.id}`
              }
              aria-current={aba === a.id ? "page" : undefined}
              className={`shrink-0 py-4 no-underline ${aba === a.id ? "border-b-2 border-azul text-gelo" : "text-cinza hover:text-gelo"}`}
            >
              {a.rotulo}
              {a.id === "carteira" && saldo > 0 && (
                <span className="ml-1.5 rounded-full bg-ciano px-1.5 text-xs text-preto">
                  {reais(saldo).replace("R$", "").trim()}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        {aba === "visao" && (
          <>
            {/* Sua próxima mesa */}
            <section className="flex flex-col gap-4">
              <h2 className="titulo text-3xl">Sua próxima mesa</h2>
              {proxima ? (
                <ProximaMesa
                  inscricao={proxima}
                  link={link?.link_endstep ?? null}
                />
              ) : sugestao[0] ? (
                <div className="grid items-center gap-6 rounded-md bg-grafite p-6 ring-1 ring-borda md:grid-cols-[1fr_1.2fr]">
                  <div className="flex flex-col gap-3">
                    <span className="text-texto2">
                      Você não tem inscrição aberta. A próxima etapa é esta:
                    </span>
                    <BotaoLink
                      href={`/eventos/${sugestao[0].slug}`}
                      className="self-start"
                    >
                      Inscrever-se
                    </BotaoLink>
                    <Link href="/eventos" className="text-sm font-semibold">
                      Ver a agenda completa →
                    </Link>
                  </div>
                  <CartaoEvento evento={sugestao[0]} />
                </div>
              ) : (
                <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
                  Nenhuma etapa aberta agora. Os avisos saem primeiro no
                  Discord.
                </p>
              )}
            </section>

            {pendencias.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="titulo text-3xl">Pendências</h2>
                <ul className="flex flex-col gap-2">
                  {pendencias.map((p) => (
                    <li
                      key={p.texto}
                      className="flex flex-wrap items-center gap-3 rounded-md border-l-4 border-alerta bg-grafite px-4 py-3 ring-1 ring-borda"
                    >
                      <span className="flex-1">{p.texto}</span>
                      <Link href={p.href} className="text-sm font-semibold">
                        {p.acao} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="grid gap-10 lg:grid-cols-2">
              {/* Minha temporada */}
              <section className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                  <h2 className="titulo text-3xl">
                    Minha temporada {per.temporada}
                  </h2>
                  <Link
                    href={`/ranking?liga=${principal?.slug ?? "pauper"}`}
                    className="text-sm font-semibold"
                  >
                    Ranking →
                  </Link>
                </div>
                {temporada.length === 0 ? (
                  <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
                    Jogue uma etapa para entrar no ranking do circuito.
                  </p>
                ) : (
                  temporada.map((f) => (
                    <div
                      key={f.slug}
                      className="flex flex-col gap-3 rounded-md bg-grafite p-5 ring-1 ring-borda"
                    >
                      <span className="flex items-center justify-between">
                        <span className="titulo text-2xl">
                          Circuito {f.nome}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-cinza">
                          {per.trimestre}º trimestre
                        </span>
                      </span>
                      <dl className="grid grid-cols-4 gap-2 text-center">
                        {[
                          ["Posição", f.linha ? `${f.linha.posicao}º` : "—"],
                          ["Pontos", f.linha?.pontos ?? 0],
                          ["Etapas", f.linha?.etapas ?? 0],
                          ["Top 8", f.linha?.top8 ?? 0],
                        ].map(([r, v]) => (
                          <div
                            key={r as string}
                            className="rounded bg-fundo2 py-2"
                          >
                            <dd className="titulo text-2xl">{v}</dd>
                            <dt className="text-[11px] text-cinza">{r}</dt>
                          </div>
                        ))}
                      </dl>
                      <span className="text-sm text-texto2">
                        {f.vaga ? (
                          <>
                            Vaga garantida no{" "}
                            <strong className="text-alerta">
                              Player of the Year
                            </strong>{" "}
                            ({f.vaga.motivo}).
                          </>
                        ) : (
                          "Vença ou chegue em segundo numa Final do Trimestre para garantir vaga no Player of the Year."
                        )}
                      </span>
                    </div>
                  ))
                )}
              </section>

              {/* Últimos resultados */}
              <section className="flex flex-col gap-4">
                <h2 className="titulo text-3xl">Últimos resultados</h2>
                {resultados.length === 0 ? (
                  <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
                    Seus resultados aparecem aqui depois da primeira etapa.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-borda rounded-md ring-1 ring-borda">
                    {resultados.slice(0, 4).map((r) => (
                      <li
                        key={r.evento.id}
                        className="flex items-center gap-4 px-4 py-3"
                      >
                        <span
                          className={`titulo w-12 text-3xl ${r.posicao === 1 ? "text-ciano" : "text-cinza"}`}
                        >
                          {r.posicao}º
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <Link
                            href={`/eventos/${r.evento.slug}?aba=resultados`}
                            className="truncate font-semibold text-gelo no-underline hover:text-ciano"
                          >
                            {r.evento.titulo}
                          </Link>
                          <span className="text-sm text-cinza">
                            {dataCurta(r.evento.inicio)} · {r.vitorias}-
                            {r.derrotas}
                            {r.empates ? `-${r.empates}` : ""}
                          </span>
                        </span>
                        {r.posicao <= 8 && ehConstruido(r.evento.formato) && (
                          <Link
                            href={`/eventos/${r.evento.slug}/deck/${r.posicao}`}
                            className="text-sm font-semibold"
                          >
                            Deck
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}

        {aba === "inscricoes" && (
          <section className="flex flex-col gap-6">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 rounded-md bg-grafite p-5 ring-1 ring-borda">
                <dt className="text-xs font-bold uppercase tracking-wider text-cinza">
                  Saldo da Carteira
                </dt>
                <dd className="titulo text-3xl">{reais(saldo)}</dd>
                <span className="text-sm text-texto2">
                  Use na hora de comprar qualquer ingresso.
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-grafite p-5 ring-1 ring-borda">
                <dt className="text-xs font-bold uppercase tracking-wider text-cinza">
                  Em processamento
                </dt>
                <dd className="titulo text-3xl">
                  {reais(Math.abs(totalProcessamento))}
                </dd>
                <span className="text-sm text-texto2">
                  Saques e reembolsos são pagos por Pix em até 48 horas.
                </span>
              </div>
            </dl>
            {[
              { titulo: "Próximas", lista: futuras },
              {
                titulo: "Histórico",
                lista: inscricoes.filter((i) => !futuras.includes(i)),
              },
            ].map((g) =>
              g.lista.length ? (
                <div key={g.titulo} className="flex flex-col gap-3">
                  <h2 className="titulo text-3xl">{g.titulo}</h2>
                  <ul className="flex flex-col divide-y divide-borda rounded-md ring-1 ring-borda">
                    {g.lista.map((i) => {
                      const s = STATUS_INSCRICAO[i.status] ?? {
                        rotulo: i.status,
                        tipo: "contorno" as const,
                      };
                      return (
                        <li
                          key={i.id}
                          className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3"
                        >
                          <span className="w-24 text-sm font-semibold text-cinza">
                            {dataCurta(i.evento.inicio)} ·{" "}
                            {hora(i.evento.inicio)}
                          </span>
                          <Link
                            href={`/eventos/${i.evento.slug}`}
                            className="min-w-48 flex-1 font-semibold text-gelo no-underline hover:text-ciano"
                          >
                            {i.evento.titulo}
                          </Link>
                          {i.deck_nome && (
                            <span className="text-sm text-texto2">
                              {i.deck_nome}
                            </span>
                          )}
                          <Etiqueta tipo={s.tipo}>{s.rotulo}</Etiqueta>
                          {i.status === "aguardando_pagamento" &&
                            podeCancelar(i) && (
                              <Link
                                href={`/eventos/${i.evento.slug}/inscricao`}
                                className="text-sm font-semibold"
                              >
                                Pagar
                              </Link>
                            )}
                          {i.status === "confirmada" && (
                            <Link
                              href={`/eventos/${i.evento.slug}/inscricao`}
                              className="text-sm font-semibold"
                            >
                              Ingresso
                            </Link>
                          )}
                          {podeCancelar(i) &&
                            (i.status === "confirmada"
                              ? [
                                  ["credito", "Cancelar → Carteira"],
                                  ["reembolso", "Cancelar → Pix"],
                                ]
                              : [["", "Cancelar"]]
                            ).map(([destino, rotulo]) => (
                              <form key={rotulo} action={cancelarInscricao}>
                                <input
                                  type="hidden"
                                  name="slug"
                                  value={i.evento.slug}
                                />
                                {destino && (
                                  <input
                                    type="hidden"
                                    name="destino"
                                    value={destino}
                                  />
                                )}
                                <BotaoEnviar
                                  className={botao("perigo")}
                                  pendente="Cancelando…"
                                >
                                  {rotulo}
                                </BotaoEnviar>
                              </form>
                            ))}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null,
            )}
            {inscricoes.length === 0 && (
              <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
                Você ainda não se inscreveu em nenhuma etapa.
              </p>
            )}
            <p className="text-sm text-cinza">
              Ingresso pago pode ser cancelado até 24h antes do início: escolha
              o valor de volta na Carteira ou reembolso na sua chave Pix (em até
              48h).
            </p>
          </section>
        )}

        {aba === "decks" && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="titulo text-3xl">Meus decks</h2>
              <BotaoLink href="/minha-area/decks/novo">Novo deck</BotaoLink>
            </div>
            {decks.length === 0 ? (
              <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
                Importe a lista que você montou no Endstep para usar nas etapas
                de Pauper e Premodern.
              </p>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {decks.map((d) => {
                  const arte = arteDeck.get(d.id);
                  return (
                    <li key={d.id}>
                      <Link
                        href={`/minha-area/decks/${d.id}`}
                        className="group flex flex-col overflow-hidden rounded-md bg-grafite text-gelo no-underline ring-1 ring-borda transition hover:-translate-y-0.5 hover:text-gelo hover:ring-ciano"
                      >
                        <div className="relative aspect-[2/1] overflow-hidden bg-fundo2">
                          {arte && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={arte}
                              alt=""
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover object-[50%_30%] transition duration-500 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-grafite to-transparent" />
                          <span className="absolute bottom-2.5 left-3">
                            <Etiqueta tipo={d.legal ? "ciano" : "alerta"}>
                              {d.legal
                                ? `Legal no ${NOME_LIGA[d.formato] ?? "formato"}`
                                : "Com pendências"}
                            </Etiqueta>
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 px-4 pb-4 pt-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-azul">
                            {d.arquetipo?.nome ??
                              NOME_LIGA[d.formato] ??
                              "Deck"}
                          </span>
                          <span className="truncate text-lg font-bold group-hover:text-ciano">
                            {d.nome}
                          </span>
                          <span className="text-sm text-cinza">
                            {d.qtd_principal} cartas · {d.qtd_sideboard} no
                            sideboard · editado {dataCurta(d.atualizado_em)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {aba === "carteira" && (
          <section className="flex flex-col gap-6">
            <dl className="grid gap-3 sm:grid-cols-3">
              {[
                [
                  "Saldo disponível",
                  reais(saldo),
                  "Para ingressos, saque ou lojas parceiras.",
                ],
                [
                  "Em processamento",
                  reais(Math.abs(totalProcessamento)),
                  "Saques e envios ainda não concluídos.",
                ],
                [
                  "Saque automático",
                  saldo > 0 && diasAutomatico !== null
                    ? `${diasAutomatico} dias`
                    : "—",
                  `Saldo parado há ${DIAS_SAQUE_AUTOMATICO} dias vai direto para o seu Pix.`,
                ],
              ].map(([r, v, t]) => (
                <div
                  key={r}
                  className="flex flex-col gap-1 rounded-md bg-grafite p-5 ring-1 ring-borda"
                >
                  <dt className="text-xs font-bold uppercase tracking-wider text-cinza">
                    {r}
                  </dt>
                  <dd className="titulo text-3xl">{v}</dd>
                  <span className="text-sm text-texto2">{t}</span>
                </div>
              ))}
            </dl>

            <CarteiraAcoes
              saldo={saldo}
              saldoTexto={reais(saldo)}
              minimo={SAQUE_MINIMO}
              minimoTexto={reais(SAQUE_MINIMO)}
              chavePix={
                jogador.chave_pix ? mascararChave(jogador.chave_pix) : ""
              }
              lojas={lojasCredito}
            />

            <div className="flex flex-col gap-3">
              <h2 className="titulo text-3xl">Histórico</h2>
              {movimentos.length === 0 ? (
                <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
                  Prêmios e créditos aparecem aqui.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-borda rounded-md ring-1 ring-borda">
                  {movimentos.map((m) => (
                    <li
                      key={m.id}
                      className={`flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 ${m.status === "cancelado" ? "opacity-50" : ""}`}
                    >
                      <span className="w-16 text-sm font-semibold text-cinza">
                        {dataCurta(m.criado_em)}
                      </span>
                      <span className="flex min-w-48 flex-1 flex-col">
                        <span className="font-semibold">
                          {NOMES_MOVIMENTO[m.tipo]}
                        </span>
                        <span className="text-sm text-texto2">
                          {m.descricao}
                          {m.codigo_loja && (
                            <>
                              {" "}
                              · código{" "}
                              <strong className="select-all font-mono text-ciano">
                                {m.codigo_loja}
                              </strong>
                            </>
                          )}
                          {m.tipo === "envio_loja" && m.credito_centavos ? (
                            <>
                              {" "}
                              · {reais(m.credito_centavos)} de crédito na loja
                            </>
                          ) : null}
                          {m.tipo === "envio_loja" &&
                          m.status === "concluido" &&
                          m.concluido_em ? (
                            <>
                              {" "}
                              · Pix enviado à loja em{" "}
                              {dataCurta(m.concluido_em)}
                            </>
                          ) : null}
                        </span>
                      </span>
                      {m.status !== "concluido" && (
                        <Etiqueta
                          tipo={m.status === "pendente" ? "alerta" : "contorno"}
                        >
                          {m.status === "pendente"
                            ? m.tipo === "envio_loja"
                              ? "Aguardando Pix à loja"
                              : "Em processamento"
                            : "Cancelado"}
                        </Etiqueta>
                      )}
                      <strong
                        className={
                          m.valor_centavos >= 0 ? "text-ciano" : "text-gelo"
                        }
                      >
                        {m.valor_centavos >= 0 ? "+" : "−"}{" "}
                        {reais(Math.abs(m.valor_centavos))}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-sm text-cinza">
              Só você e a organização veem os valores da sua Carteira.
            </p>
          </section>
        )}

        {aba === "dados" && (
          <>
            <section
              id="perfil"
              className="grid gap-10 border-b border-borda pb-12 lg:grid-cols-[1fr_1.4fr]"
            >
              <div className="flex flex-col gap-3">
                <h2 className="titulo text-3xl">Perfil público</h2>
                <p className="text-texto2">
                  Qualquer pessoa que clicar no seu nick vê seu perfil:
                  insígnias, resultados, decks e artigos. Escolha o que mostrar
                  e compartilhe o link nas suas redes.
                </p>
              </div>
              <FormularioPerfil
                link={linkJogador(nick)}
                inicial={{
                  bio: jogador.bio ?? "",
                  redes: (jogador.redes ?? {}) as Redes,
                  mostrarResultados: jogador.mostrar_resultados ?? true,
                  mostrarDecks: jogador.mostrar_decks ?? true,
                  mostrarArtigos: jogador.mostrar_artigos ?? true,
                  autor: Boolean(souAutor),
                }}
              />
            </section>
            <section className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
              <div className="flex flex-col gap-3">
                <h2 className="titulo text-3xl">Meus dados</h2>
                <p className="text-texto2">
                  Usados para confirmar inscrições e pagar prêmios. Publicamente
                  aparecem só o seu nick do Endstep e a foto do Discord.
                </p>
                {q.salvo && (
                  <p className="rounded-md border border-ciano/50 bg-ciano/10 p-3 text-sm font-semibold text-ciano">
                    Dados salvos.
                  </p>
                )}
              </div>
              <FormularioCadastro
                voltar="/minha-area?aba=dados&salvo=1"
                inicial={{
                  nome: jogador.nome ?? "",
                  email: jogador.email ?? user.email ?? "",
                  nascimento: jogador.nascimento ?? "",
                  nick_endstep: jogador.nick_endstep ?? "",
                  cpf: jogador.cpf ?? "",
                  chave_pix: jogador.chave_pix ?? "",
                  pix_tipo: jogador.pix_tipo ?? "",
                  responsavel_nome: jogador.responsavel_nome ?? "",
                  responsavel_cpf: jogador.responsavel_cpf ?? "",
                }}
              />
            </section>
          </>
        )}
      </div>
    </>
  );
}

function ProximaMesa({
  inscricao,
  link,
}: {
  inscricao: Inscricao;
  link: string | null;
}) {
  const e = inscricao.evento;
  const capa = capaDoEvento(e);
  const pendente = inscricao.status === "aguardando_pagamento";
  return (
    <div className="relative isolate overflow-hidden rounded-md ring-1 ring-borda">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={capa.src}
        alt=""
        style={{ objectPosition: capa.foco }}
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/30" />
      <div className="flex flex-wrap items-end gap-6 p-6 sm:p-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex flex-wrap items-center gap-2">
            <EtiquetaLiga evento={e as never} />
            <Etiqueta tipo={pendente ? "alerta" : "ciano"}>
              {pendente ? "Falta pagar o Pix" : "Inscrição confirmada"}
            </Etiqueta>
          </span>
          <span className="titulo text-4xl sm:text-5xl">{e.titulo}</span>
          <span className="text-texto2">
            {dataLonga(e.inicio)} · {hora(e.inicio)} (horário de Brasília)
            {e.modalidade === "presencial" && e.loja ? ` · ${e.loja.nome}` : ""}
            {!pendente && ehConstruido(e.formato) && (
              <>
                {" "}
                · Deck:{" "}
                {inscricao.deck_nome ?? (
                  <span className="text-alerta">não escolhido</span>
                )}
              </>
            )}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {pendente ? (
            <BotaoLink href={`/eventos/${e.slug}/inscricao`}>
              Pagar com Pix
            </BotaoLink>
          ) : e.modalidade === "presencial" && e.loja ? (
            <a
              href={linkMapa(e.loja)}
              target="_blank"
              rel="noopener"
              className="corte inline-flex min-h-12 items-center bg-azul px-7 font-semibold uppercase tracking-wide text-white no-underline hover:bg-azul-escuro hover:text-white"
            >
              Como chegar ↗
            </a>
          ) : link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener"
              className="corte inline-flex min-h-12 items-center bg-azul px-7 font-semibold uppercase tracking-wide text-white no-underline hover:bg-azul-escuro hover:text-white"
            >
              Abrir no Endstep ↗
            </a>
          ) : null}
          <Link href={`/eventos/${e.slug}`} className="text-sm font-semibold">
            Ver evento →
          </Link>
        </div>
      </div>
    </div>
  );
}
