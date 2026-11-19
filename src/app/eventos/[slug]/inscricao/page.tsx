import { BotaoEnviar } from "@/components/BotaoEnviar";
import { enderecoLinha, linkMapa } from "@/lib/lojas";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EtiquetaLiga } from "@/components/Eventos";
import { codigoIngresso, Ingresso } from "@/components/Ingresso";
import { capaDoEvento } from "@/lib/artes";
import { buscarEvento, usuarioAtual } from "@/lib/dados";
import { dataCurta, dataLonga, hora, reais } from "@/lib/formato";
import { sincronizarPagamento } from "@/lib/pagamentos";
import { criarClienteServidor } from "@/lib/supabase/server";
import { mascararChave } from "@/lib/validacao";
import { cancelarInscricao, saldoDeCredito } from "./actions";
import { Checkout } from "./Checkout";
import { Pix } from "./Pix";

export const metadata: Metadata = { title: "Ingresso" };
export const dynamic = "force-dynamic";

const HORAS_CANCELAMENTO = 24;

export default async function Inscricao({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caminho = `/eventos/${slug}/inscricao`;
  const evento = await buscarEvento(slug);
  if (!evento) notFound();

  const jogador = await usuarioAtual();
  if (!jogador) redirect(`/entrar?voltar=${encodeURIComponent(caminho)}`);
  if (!jogador.aceite_termos_em)
    redirect(`/cadastro?voltar=${encodeURIComponent(caminho)}`);

  const supabase = await criarClienteServidor();
  const { data: inscricao } = await supabase
    .from("inscricoes")
    .select("id, status, deck_nome")
    .eq("evento_id", evento.id)
    .eq("jogador_id", jogador.id)
    .maybeSingle();

  type Pag = {
    id: string;
    status: string;
    pix_copia_cola: string | null;
    pix_qr_base64: string | null;
    expira_em: string | null;
  };
  let pagamento: Pag | null = null;
  if (inscricao?.status === "aguardando_pagamento") {
    const { data } = await supabase
      .from("pagamentos")
      .select("id, status, pix_copia_cola, pix_qr_base64, expira_em")
      .eq("inscricao_id", inscricao.id)
      .eq("status", "pendente")
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    pagamento = data as Pag | null;
    if (pagamento) {
      const situacao = await sincronizarPagamento(pagamento.id);
      if (situacao === "aprovado") redirect(caminho);
      if (situacao !== "pendente") pagamento = null;
    }
  }

  const capa = capaDoEvento(evento);
  const pauper = evento.formato === "pauper";
  const nick =
    jogador.nick_endstep || jogador.discord_nome || jogador.nome || "Jogador";
  const confirmada = inscricao?.status === "confirmada";

  // Resumo do evento (coluna da direita)
  const resumo = (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-md bg-grafite ring-1 ring-borda">
        <div className="relative aspect-[16/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capa.src}
            alt=""
            style={{ objectPosition: capa.foco }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-grafite to-transparent" />
          <span className="absolute bottom-3 left-4">
            <EtiquetaLiga evento={evento} />
          </span>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <span className="titulo text-3xl">{evento.titulo}</span>
          <span className="text-sm text-texto2">
            {dataLonga(evento.inicio)} · {hora(evento.inicio)} (Brasília) ·{" "}
            {evento.modalidade === "presencial"
              ? `Presencial${evento.loja ? ` · ${evento.loja.nome}${evento.loja.cidade ? `, ${evento.loja.cidade}` : ""}` : ""}`
              : "Online no Endstep"}
          </span>
          <dl className="flex flex-col gap-2 border-t border-borda pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-cinza">Ingresso</dt>
              <dd className="text-lg font-bold">
                {reais(evento.valor_centavos)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cinza">Premiação</dt>
              <dd className="font-semibold text-ciano">
                {evento.percentual_premio}% das inscrições
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cinza">Inscrições até</dt>
              <dd className="font-semibold">
                {dataCurta(evento.inscricoes_ate)},{" "}
                {hora(evento.inscricoes_ate)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="flex items-center gap-2 px-1 text-xs text-cinza">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Pagamento processado pelo Mercado Pago. A liga não vê dados bancários.
      </p>
    </aside>
  );

  const casca = (
    titulo: string,
    subtitulo: string,
    conteudo: React.ReactNode,
  ) => (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <nav
        aria-label="Caminho"
        className="flex flex-wrap gap-2 text-sm text-texto2"
      >
        <Link href="/eventos">Agenda</Link>
        <span>/</span>
        <Link href={`/eventos/${slug}`}>{evento.titulo}</Link>
        <span>/</span>
        <span>Ingresso</span>
      </nav>
      <div className="flex flex-col gap-2">
        <h1 className="titulo text-5xl sm:text-6xl">{titulo}</h1>
        <p className="text-texto2">{subtitulo}</p>
      </div>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">{conteudo}</div>
        {resumo}
      </div>
    </div>
  );

  // Ingresso emitido
  if (confirmada) {
    const podeCancelar =
      new Date(evento.inicio).getTime() - HORAS_CANCELAMENTO * 3600e3 >
      Date.now();
    const { data: link } = await supabase
      .from("evento_links")
      .select("link_endstep")
      .eq("evento_id", evento.id)
      .maybeSingle();
    return casca(
      "Ingresso confirmado",
      "Pagamento recebido. Seu lugar na etapa está garantido.",
      <div className="flex flex-col gap-8">
        <Ingresso
          arte={capa.src}
          foco={capa.foco}
          titulo={evento.titulo}
          formato={
            evento.colecao
              ? `${evento.formato} · ${evento.colecao}`
              : evento.formato
          }
          data={dataCurta(evento.inicio)}
          hora={hora(evento.inicio)}
          jogador={nick}
          deck={pauper ? (inscricao.deck_nome ?? "não registrado") : null}
          codigo={codigoIngresso(inscricao.id)}
        />
        <section className="flex flex-col gap-3">
          <h2 className="titulo text-3xl">Próximos passos</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {evento.modalidade === "presencial" ? (
              <Passo
                titulo={evento.loja?.nome ?? "Local do evento"}
                texto={
                  evento.loja
                    ? `${enderecoLinha(evento.loja)}. Chegue 15 minutos antes para o check-in.`
                    : `${evento.local ?? "Endereço na página do evento"}. Chegue 15 minutos antes.`
                }
                acao={
                  evento.loja
                    ? {
                        href: linkMapa(evento.loja),
                        rotulo: "Abrir no Google Maps ↗",
                        externo: true,
                      }
                    : undefined
                }
              />
            ) : (
              <Passo
                titulo="Link do Endstep"
                texto={
                  link?.link_endstep
                    ? "Já liberado. Entre alguns minutos antes do início."
                    : "Aparece aqui e na página do evento quando a organização liberar."
                }
                acao={
                  link?.link_endstep
                    ? {
                        href: link.link_endstep,
                        rotulo: "Abrir no Endstep ↗",
                        externo: true,
                      }
                    : undefined
                }
              />
            )}
            <Passo
              titulo="Adicionar à agenda"
              texto="Lembrete 30 minutos antes, no seu calendário."
              acao={{
                href: `/eventos/${slug}/agenda.ics`,
                rotulo: "Baixar evento",
              }}
            />
            {pauper && (
              <Passo
                titulo="Seu deck"
                texto={`Registrado: ${inscricao.deck_nome ?? "nenhum"}. Dá para trocar até o início.`}
                acao={{ href: `/eventos/${slug}`, rotulo: "Trocar deck" }}
              />
            )}
            <Passo
              titulo="Minha área"
              texto="Seus ingressos, decks, pontos e prêmios num lugar só."
              acao={{ href: "/minha-area", rotulo: "Abrir" }}
            />
          </ul>
          <p className="text-sm text-cinza">
            Enviamos a confirmação para o seu e-mail.
          </p>
        </section>
        {podeCancelar && (
          <section className="flex flex-col gap-3 rounded-md p-5 ring-1 ring-borda">
            <h2 className="font-semibold">Não vai poder jogar?</h2>
            <p className="text-sm text-texto2">
              Até 24 horas antes do início você pode cancelar e escolher entre
              reembolso por Pix (em até 48h, na chave{" "}
              {mascararChave(jogador.chave_pix)}) ou o valor de volta na sua
              Carteira, para usar em outro ingresso.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                ["credito", "Cancelar e voltar para a Carteira"],
                ["reembolso", "Cancelar e receber por Pix"],
              ].map(([destino, rotulo]) => (
                <form key={destino} action={cancelarInscricao}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="destino" value={destino} />
                  <BotaoEnviar className="min-h-10 rounded-lg px-4 text-sm font-semibold ring-1 ring-borda-forte hover:ring-erro">
                    {rotulo}
                  </BotaoEnviar>
                </form>
              ))}
            </div>
          </section>
        )}
      </div>,
    );
  }

  // Pix gerado, aguardando pagamento
  if (pagamento?.pix_copia_cola) {
    return casca(
      "Pague o Pix",
      "Seu lugar fica reservado enquanto o código estiver válido. A confirmação aparece aqui sozinha.",
      <div className="flex flex-col gap-5">
        <Pix
          pagamentoId={pagamento.id}
          copiaCola={pagamento.pix_copia_cola}
          qrBase64={pagamento.pix_qr_base64}
          expiraEm={pagamento.expira_em}
        />
        <ol className="grid gap-3 text-sm text-texto2 sm:grid-cols-3">
          <li className="rounded-md bg-grafite p-4 ring-1 ring-borda">
            <strong className="block text-gelo">1. Abra o app do banco</strong>
            Entre na área Pix.
          </li>
          <li className="rounded-md bg-grafite p-4 ring-1 ring-borda">
            <strong className="block text-gelo">2. Leia ou cole</strong>Use o QR
            Code ou o código copia e cola.
          </li>
          <li className="rounded-md bg-grafite p-4 ring-1 ring-borda">
            <strong className="block text-gelo">3. Volte aqui</strong>Pode
            deixar esta tela aberta: o ingresso aparece sozinho.
          </li>
        </ol>
        <form action={cancelarInscricao}>
          <input type="hidden" name="slug" value={slug} />
          <BotaoEnviar className="text-sm font-semibold text-cinza hover:text-gelo">
            Desistir e liberar a vaga
          </BotaoEnviar>
        </form>
      </div>,
    );
  }

  if (evento.status !== "aberto") {
    return casca(
      "Ingresso",
      "As inscrições deste evento não estão abertas.",
      <Link href={`/eventos/${slug}`}>← Voltar ao evento</Link>,
    );
  }

  // Checkout
  const [{ data: decks }, { data: arquetipos }, saldo] = await Promise.all([
    pauper
      ? supabase
          .from("decks")
          .select("id, nome, legal, arquetipo:arquetipos(nome)")
          .eq("jogador_id", jogador.id)
          .order("atualizado_em", { ascending: false })
      : Promise.resolve({ data: [] }),
    pauper
      ? supabase
          .from("arquetipos")
          .select("id, nome")
          .eq("ativo", true)
          .order("nome")
      : Promise.resolve({ data: [] }),
    saldoDeCredito(jogador.id),
  ]);

  return casca(
    "Garanta seu ingresso",
    "Tudo nesta tela: confira seus dados, registre o deck, aceite as regras e pague. Leva uns 2 minutos.",
    <Checkout
      slug={slug}
      pauper={pauper}
      presencial={
        evento.modalidade === "presencial"
          ? (evento.loja?.nome ?? evento.local ?? "a loja")
          : null
      }
      valor={reais(evento.valor_centavos)}
      valorCentavos={evento.valor_centavos}
      saldo={{
        centavos: saldo.total,
        texto: reais(saldo.total),
        cobre: saldo.total >= evento.valor_centavos,
      }}
      jogador={{
        nick,
        pix: mascararChave(jogador.chave_pix),
        email: jogador.email ?? "",
      }}
      decks={(
        (decks as unknown as {
          id: string;
          nome: string;
          legal: boolean;
          arquetipo: { nome: string } | null;
        }[]) ?? []
      ).map((d) => ({
        id: d.id,
        nome: d.nome,
        legal: d.legal,
        arquetipo: d.arquetipo?.nome ?? null,
      }))}
      arquetipos={((arquetipos as { id: number; nome: string }[]) ?? []).sort(
        (a, b) => (a.nome === "Outro" ? 1 : b.nome === "Outro" ? -1 : 0),
      )}
      aviso={
        inscricao?.status === "expirada"
          ? "O Pix anterior expirou. Gere um novo para garantir sua vaga."
          : null
      }
    />,
  );
}

function Passo({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto: string;
  acao?: { href: string; rotulo: string; externo?: boolean };
}) {
  return (
    <li className="flex flex-col gap-2 rounded-md bg-grafite p-4 ring-1 ring-borda">
      <span className="font-semibold">{titulo}</span>
      <span className="flex-1 text-sm text-texto2">{texto}</span>
      {acao && (
        <a
          href={acao.href}
          {...(acao.externo ? { target: "_blank", rel: "noopener" } : {})}
          className="text-sm font-semibold"
        >
          {acao.rotulo}
        </a>
      )}
    </li>
  );
}
