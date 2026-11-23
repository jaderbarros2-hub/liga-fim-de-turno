import type { Metadata } from "next";
import Link from "next/link";
import { ListaEventos } from "@/components/Eventos";
import { arteFixa, creditoArte, srcArte } from "@/lib/artes";
import { listarProximosEventos } from "@/lib/dados";
import {
  CHECKIN_ONLINE,
  CHECKIN_PRESENCIAL,
  MINUTOS_RODADA,
} from "@/lib/eventoInfo";

export const metadata: Metadata = {
  title: "Como funcionam os eventos",
  description:
    "Passo a passo dos eventos online (no Endstep) e presenciais da First Strike: ingresso, deck, check-in, rodadas e prêmio.",
};
export const dynamic = "force-dynamic";

type Modo = "online" | "presencial";

const PASSOS: Record<Modo, { titulo: string; texto: string }[]> = {
  online: [
    {
      titulo: "Faça o cadastro",
      texto:
        "Entre com o Discord e complete o cadastro com o seu nick do Endstep e a chave Pix para receber prêmios.",
    },
    {
      titulo: "Crie a conta no Endstep",
      texto:
        "O Endstep é gratuito e roda no navegador. Use o mesmo nick do seu cadastro na liga.",
    },
    {
      titulo: "Garanta o ingresso",
      texto:
        "Escolha o evento na agenda, registre o deck (no Pauper) e pague por Pix ou com o saldo da Carteira.",
    },
    {
      titulo: "Entre no torneio",
      texto: `O link privado aparece na página do evento e na sua Minha área. Faça o check-in no Endstep até ${CHECKIN_ONLINE} minutos antes.`,
    },
    {
      titulo: "Jogue as rodadas",
      texto: `Emparelhamentos e partidas acontecem no Endstep: melhor de 3, cerca de ${MINUTOS_RODADA} minutos por rodada.`,
    },
    {
      titulo: "Resultado e prêmio",
      texto:
        "A classificação sai no portal, os pontos entram no ranking e o prêmio cai na sua Carteira.",
    },
  ],
  presencial: [
    {
      titulo: "Faça o cadastro",
      texto:
        "Entre com o Discord e complete o cadastro com o seu nick e a chave Pix para receber prêmios.",
    },
    {
      titulo: "Garanta o ingresso",
      texto:
        "Escolha o evento na agenda, registre o deck (no Pauper) e pague por Pix ou com o saldo da Carteira.",
    },
    {
      titulo: "Prepare-se",
      texto:
        "Na página do evento estão o endereço da loja, o cronograma e o que levar: deck com sleeves, dados e marcadores.",
    },
    {
      titulo: "Chegue cedo",
      texto: `Chegue ${CHECKIN_PRESENCIAL} minutos antes para o check-in com a organização. Atrasou? Há tolerância de 10 minutos para a primeira rodada.`,
    },
    {
      titulo: "Jogue as rodadas",
      texto: `Partidas na mesa, melhor de 3, cerca de ${MINUTOS_RODADA} minutos por rodada. A organização lança os resultados de cada rodada.`,
    },
    {
      titulo: "Resultado e prêmio",
      texto:
        "A classificação sai no portal, os pontos entram no ranking e o prêmio cai na sua Carteira.",
    },
  ],
};

const REGRAS = [
  {
    titulo: "Cancelamento",
    texto:
      "Até 24 horas antes do início, com reembolso por Pix ou o valor de volta na Carteira.",
  },
  {
    titulo: "Mínimo de jogadores",
    texto:
      "Sem o mínimo, o evento é cancelado e todos escolhem reembolso ou crédito.",
  },
  {
    titulo: "Prêmio",
    texto:
      "Cai na Carteira: saque por Pix, use em ingressos ou resgate em uma loja parceira.",
  },
  {
    titulo: "Circuito",
    texto:
      "Toda etapa vale pontos no ranking do trimestre e na corrida ao Player of the Year.",
  },
];

export default async function ComoFunciona({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const modo: Modo =
    (await searchParams).modo === "presencial" ? "presencial" : "online";
  const eventos = (await listarProximosEventos(30))
    .filter((e) => (e.modalidade === "presencial") === (modo === "presencial"))
    .slice(0, 3);
  const arte = arteFixa(`como-funciona-${modo}`, "geral");

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcArte(arte)}
          alt=""
          style={{ objectPosition: arte.foco }}
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/30" />
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-16">
          <h1 className="titulo text-6xl sm:text-7xl">
            Como funcionam os eventos
          </h1>
          <p className="max-w-2xl text-lg text-texto2">
            Do ingresso ao prêmio na Carteira, o passo a passo de uma etapa da
            liga.
          </p>
        </div>
        <span className="absolute bottom-2 right-4 hidden text-[11px] text-white/50 sm:block">
          {creditoArte(arte)}
        </span>
      </section>

      <nav aria-label="Modalidade" className="border-b border-borda">
        <div className="mx-auto flex max-w-6xl gap-7 px-6 text-sm font-semibold">
          {(["online", "presencial"] as const).map((m) => (
            <Link
              key={m}
              href={`/como-funciona?modo=${m}`}
              aria-current={modo === m ? "page" : undefined}
              className={`py-4 no-underline ${modo === m ? "border-b-2 border-vermelho text-marfim" : "text-cinza hover:text-marfim"}`}
            >
              {m === "online"
                ? "Online, no Endstep"
                : "Presencial, em lojas parceiras"}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-14">
        <ol className="grid gap-px overflow-hidden rounded-md bg-borda ring-1 ring-borda sm:grid-cols-2 lg:grid-cols-3">
          {PASSOS[modo].map((p, i) => (
            <li key={p.titulo} className="flex flex-col gap-3 bg-grafite p-6">
              <span className="titulo text-5xl text-vermelho">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-lg font-semibold">{p.titulo}</h2>
              <p className="text-sm text-texto2">{p.texto}</p>
            </li>
          ))}
        </ol>

        <section className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <h2 className="titulo text-4xl">Vale para todos os eventos</h2>
          <dl className="grid gap-6 sm:grid-cols-2">
            {REGRAS.map((r) => (
              <div
                key={r.titulo}
                className="flex flex-col gap-1 border-t-2 border-vermelho pt-3"
              >
                <dt className="font-semibold">{r.titulo}</dt>
                <dd className="text-sm text-texto2">{r.texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="titulo text-4xl">
              Próximos eventos {modo === "online" ? "online" : "presenciais"}
            </h2>
            <Link href="/eventos" className="text-sm font-semibold">
              Ver a agenda completa →
            </Link>
          </div>
          <ListaEventos
            eventos={eventos}
            vazio={`Nenhum evento ${modo === "online" ? "online" : "presencial"} marcado agora. Fique de olho na agenda.`}
          />
        </section>

        <p className="text-sm text-cinza">
          Detalhes de cada formato estão no{" "}
          <Link href="/regras">regulamento</Link>. Dúvidas sobre um evento
          específico? Veja as perguntas frequentes na página dele.
        </p>
      </div>
    </>
  );
}
