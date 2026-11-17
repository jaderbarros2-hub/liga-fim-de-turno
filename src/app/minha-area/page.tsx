import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BotaoLink, Etiqueta } from "@/components/Botao";
import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server";
import { dataCurta, hora, reais } from "@/lib/formato";
import { mascararChave } from "@/lib/validacao";
import { sair } from "./actions";
import { cancelarInscricao } from "../eventos/[slug]/inscricao/actions";

export const metadata: Metadata = { title: "Minha área" };
export const dynamic = "force-dynamic";

type Inscricao = {
  id: string;
  status: string;
  evento: { slug: string; titulo: string; inicio: string; status: string };
};

const STATUS_INSCRICAO: Record<string, { rotulo: string; tipo: "ciano" | "alerta" | "contorno" }> = {
  confirmada: { rotulo: "Confirmada", tipo: "ciano" },
  aguardando_pagamento: { rotulo: "Aguardando Pix", tipo: "alerta" },
  expirada: { rotulo: "Pix expirado", tipo: "contorno" },
  cancelada: { rotulo: "Cancelada", tipo: "contorno" },
  reembolsada: { rotulo: "Reembolsada", tipo: "contorno" },
};

/** Pendente: sempre; confirmada: até 24h antes do início (gera pedido de reembolso). */
function podeCancelar(i: Inscricao) {
  const inicio = new Date(i.evento.inicio).getTime();
  if (i.status === "aguardando_pagamento") return inicio > Date.now();
  if (i.status === "confirmada") return inicio - 24 * 3600_000 > Date.now();
  return false;
}

export default async function MinhaArea() {
  if (!supabaseConfigurado()) redirect("/");
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/minha-area");

  const { data: jogador } = await supabase.from("jogadores").select("*").eq("id", user.id).maybeSingle();
  if (!jogador?.aceite_termos_em) redirect("/cadastro?voltar=/minha-area");

  const { data } = await supabase
    .from("inscricoes")
    .select("id, status, evento:eventos(slug, titulo, inicio, status)")
    .eq("jogador_id", user.id)
    .order("criado_em", { ascending: false });
  const inscricoes = (data as Inscricao[] | null) ?? [];

  const { data: dadosPremios } = await supabase
    .from("premios")
    .select("id, valor_centavos, status, posicao, pago_em, evento:eventos(slug, titulo, inicio)")
    .eq("jogador_id", user.id)
    .order("criado_em", { ascending: false });
  const premios =
    (dadosPremios as unknown as {
      id: string;
      valor_centavos: number;
      status: string;
      posicao: number | null;
      evento: { slug: string; titulo: string; inicio: string };
    }[]) ?? [];

  const agora = Date.now();
  const futuras = inscricoes.filter((i) => new Date(i.evento.inicio).getTime() > agora - 6 * 3600_000);
  const proxima =
    futuras.find((i) => i.status === "aguardando_pagamento") ??
    [...futuras].filter((i) => i.status === "confirmada").sort((a, b) => a.evento.inicio.localeCompare(b.evento.inicio))[0];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="titulo text-5xl">Olá, {jogador.nick_endstep || jogador.nome}</h1>
        <form action={sair}>
          <button type="submit" className="text-sm font-semibold text-cinza hover:text-gelo">
            Sair
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-azul bg-grafite p-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-widest text-ciano">PRÓXIMO PASSO</span>
          {proxima ? (
            <>
              <span className="text-xl font-semibold">{proxima.evento.titulo}</span>
              <span className="text-sm text-texto2">
                {dataCurta(proxima.evento.inicio)} às {hora(proxima.evento.inicio)} ·{" "}
                {proxima.status === "confirmada" ? "inscrição confirmada" : "falta pagar o Pix"}
              </span>
            </>
          ) : (
            <span className="text-xl font-semibold">Escolha sua próxima etapa</span>
          )}
        </div>
        {proxima ? (
          <BotaoLink href={proxima.status === "confirmada" ? `/eventos/${proxima.evento.slug}` : `/eventos/${proxima.evento.slug}/inscricao`}>
            {proxima.status === "confirmada" ? "Ver evento e link" : "Pagar com Pix"}
          </BotaoLink>
        ) : (
          <BotaoLink href="/eventos">Ver agenda</BotaoLink>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-3xl">Minhas inscrições</h2>
        <p className="text-sm text-cinza">
          Inscrição paga pode ser cancelada até 24h antes do evento; o reembolso vai para sua chave Pix em até 48h.
        </p>
        {inscricoes.length === 0 ? (
          <p className="text-texto2">Você ainda não se inscreveu em nenhum evento.</p>
        ) : (
          <ul className="flex flex-col border-t border-borda">
            {inscricoes.map((i) => {
              const s = STATUS_INSCRICAO[i.status];
              return (
                <li key={i.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-borda py-3">
                  <Link href={`/eventos/${i.evento.slug}`} className="min-w-56 flex-1 font-semibold text-gelo no-underline hover:text-ciano">
                    {i.evento.titulo}
                  </Link>
                  <span className="text-sm text-cinza">
                    {dataCurta(i.evento.inicio)} · {hora(i.evento.inicio)}
                  </span>
                  <Etiqueta tipo={s.tipo}>{s.rotulo}</Etiqueta>
                  {podeCancelar(i) && (
                    <form action={cancelarInscricao}>
                      <input type="hidden" name="slug" value={i.evento.slug} />
                      <button type="submit" className="text-xs font-semibold text-cinza hover:text-gelo">
                        Cancelar
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {premios.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="titulo text-3xl">Meus prêmios</h2>
          <ul className="flex flex-col border-t border-borda">
            {premios.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-borda py-3">
                <Link href={`/eventos/${p.evento.slug}?aba=resultados`} className="min-w-56 flex-1 font-semibold text-gelo no-underline hover:text-ciano">
                  {p.evento.titulo}
                </Link>
                <span className="text-sm text-cinza">{p.posicao}º lugar</span>
                <strong className="text-ciano">{reais(p.valor_centavos)}</strong>
                <Etiqueta tipo={p.status === "pago" ? "ciano" : "alerta"}>{p.status === "pago" ? "Pago" : "A receber"}</Etiqueta>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-borda bg-grafite p-5 text-sm">
        <span className="text-texto2">
          Chave Pix para prêmios: <strong className="text-gelo">{mascararChave(jogador.chave_pix)}</strong>
        </span>
        <Link href="/cadastro?voltar=/minha-area" className="font-semibold">
          Alterar meus dados
        </Link>
      </section>
    </div>
  );
}
