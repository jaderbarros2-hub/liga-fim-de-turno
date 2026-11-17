import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BotaoLink } from "@/components/Botao";
import { buscarEvento, usuarioAtual } from "@/lib/dados";
import { dataLonga, hora, reais } from "@/lib/formato";
import { sincronizarPagamento } from "@/lib/pagamentos";
import { criarClienteServidor } from "@/lib/supabase/server";
import { cancelarInscricao } from "./actions";
import { BotaoGerar } from "./BotaoGerar";
import { Pix } from "./Pix";

export const metadata: Metadata = { title: "Inscrição" };
export const dynamic = "force-dynamic";

function Etapas({ atual }: { atual: 2 | 3 }) {
  const item = (n: number, texto: string) => (
    <li
      className={
        n === atual
          ? "rounded-full bg-azul px-4 py-2 text-white"
          : "rounded-full border border-borda-forte px-4 py-2 text-cinza"
      }
    >
      {n} · {texto}
      {n < atual && " ✓"}
    </li>
  );
  return (
    <ol aria-label="Etapas da inscrição" className="flex flex-wrap gap-3 text-sm font-semibold">
      {item(1, "Cadastro")}
      {item(2, "Pagamento")}
      {item(3, "Confirmado")}
    </ol>
  );
}

export default async function Inscricao({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caminho = `/eventos/${slug}/inscricao`;
  const evento = await buscarEvento(slug);
  if (!evento) notFound();

  const jogador = await usuarioAtual();
  if (!jogador) redirect(`/entrar?voltar=${encodeURIComponent(caminho)}`);
  if (!jogador.aceite_termos_em) redirect(`/cadastro?voltar=${encodeURIComponent(caminho)}`);

  const supabase = await criarClienteServidor();
  const { data: inscricao } = await supabase
    .from("inscricoes")
    .select("id, status")
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

  const cabecalho = (
    <>
      <h1 className="titulo text-5xl">{evento.titulo}</h1>
      <p className="text-texto2">
        {dataLonga(evento.inicio)}, {hora(evento.inicio)} · Inscrição de {reais(evento.valor_centavos)}
      </p>
    </>
  );

  if (inscricao?.status === "confirmada") {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <Etapas atual={3} />
        {cabecalho}
        <div className="flex flex-col gap-3 rounded-xl border border-ciano bg-grafite p-6">
          <p className="text-xl font-semibold text-ciano">✓ Inscrição confirmada</p>
          <p className="text-texto2">
            Seu pagamento foi recebido. O link do evento no Endstep fica na página do evento, liberado só para
            inscritos confirmados.
          </p>
          <BotaoLink href={`/eventos/${slug}`} className="self-start">
            Ir para o evento
          </BotaoLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <Etapas atual={2} />
      {cabecalho}

      {pagamento?.pix_copia_cola ? (
        <Pix
          pagamentoId={pagamento.id}
          copiaCola={pagamento.pix_copia_cola}
          qrBase64={pagamento.pix_qr_base64}
          expiraEm={pagamento.expira_em}
        />
      ) : evento.status !== "aberto" ? (
        <div className="rounded-xl border border-borda bg-grafite p-6 text-texto2">
          As inscrições deste evento não estão abertas.
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-borda bg-grafite p-6">
          {inscricao?.status === "expirada" && (
            <p className="text-sm text-alerta">O Pix anterior expirou. Gere um novo para garantir sua vaga.</p>
          )}
          <p className="text-texto2">
            Ao gerar o Pix você tem 30 minutos para pagar. A vaga é garantida assim que o pagamento é confirmado.
          </p>
          <BotaoGerar slug={slug} rotulo={`Gerar Pix de ${reais(evento.valor_centavos)}`} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <BotaoLink href={`/eventos/${slug}`} variante="contorno">
          Voltar ao evento
        </BotaoLink>
        {inscricao?.status === "aguardando_pagamento" && (
          <form action={cancelarInscricao}>
            <input type="hidden" name="slug" value={slug} />
            <button type="submit" className="text-sm font-semibold text-cinza hover:text-gelo">
              Desistir da inscrição
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
