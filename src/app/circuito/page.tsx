import type { Metadata } from "next";
import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { FotoJogador, NomeJogador } from "@/components/Jogador";
import { creditoArte, sortearArtes, srcArte } from "@/lib/artes";
import {
  classificadosPOTY,
  ETAPAS_POR_MES,
  periodo,
  ranking,
  TABELA_PONTOS,
  TRIMESTRES,
  VAGAS_POTY,
} from "@/lib/circuito";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "O Circuito",
  description:
    "Quatro etapas por mês, uma final por trimestre e o Player of the Year em dezembro.",
};

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const ATOS = [
  {
    numero: "01",
    titulo: "Etapas",
    resumo: `${ETAPAS_POR_MES} por mês, em cada formato`,
    texto:
      "Toda semana tem etapa de Pauper e de Limited no Endstep. Cada resultado soma pontos no ranking do trimestre e no ranking anual. Jogou, pontuou.",
  },
  {
    numero: "02",
    titulo: "Final do Trimestre",
    resumo: "A última etapa de março, junho, setembro e dezembro",
    texto:
      "A última etapa de cada trimestre vale o título. O campeão e o vice garantem vaga direta no Player of the Year, além do prêmio da etapa.",
  },
  {
    numero: "03",
    titulo: "Player of the Year",
    resumo: "Top 8 em dezembro",
    texto:
      "Os quatro campeões e os quatro vices dos trimestres se enfrentam para decidir o melhor jogador da temporada em cada formato.",
  },
];

const PERGUNTAS = [
  {
    p: "Preciso jogar todas as etapas?",
    r: "Não. Cada etapa é independente e tem o próprio prêmio. Jogar mais etapas ajuda no ranking, que desempata as vagas do Player of the Year.",
  },
  {
    p: "Quem pode jogar a Final do Trimestre?",
    r: "A final é a última etapa do trimestre e segue a inscrição normal da liga. Quem vence é o campeão do trimestre; o segundo lugar é o vice.",
  },
  {
    p: "E se a mesma pessoa ganhar dois trimestres?",
    r: "Ela ocupa uma vaga só. A vaga que sobra vai para o jogador mais bem colocado no ranking anual que ainda não estiver classificado.",
  },
  {
    p: "Pauper, Premodern e Limited contam juntos?",
    r: "Não. Cada formato tem o seu circuito, o seu ranking e o seu Player of the Year.",
  },
];

export default async function Circuito() {
  const agora = periodo(new Date().toISOString());
  const temporada = agora.temporada;
  const [
    artes,
    pauper,
    premodern,
    limited,
    rankPauper,
    rankPremodern,
    rankLimited,
  ] = await Promise.all([
    Promise.resolve(sortearArtes("geral", 4, true)),
    classificadosPOTY("pauper", temporada),
    classificadosPOTY("premodern", temporada),
    classificadosPOTY("limited", temporada),
    ranking("pauper", temporada),
    ranking("premodern", temporada),
    ranking("limited", temporada),
  ]);
  const [aHero, ...aAtos] = artes;

  return (
    <>
      {/* Abertura */}
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcArte(aHero)}
          alt=""
          style={{ objectPosition: aHero.foco }}
          className="hero-zoom absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/20" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-preto to-transparent" />
        <div className="mx-auto flex min-h-[560px] max-w-6xl flex-col justify-center gap-6 px-6 py-20">
          <span className="text-sm font-semibold uppercase tracking-widest text-brasa">
            Temporada {temporada}
          </span>
          <h1 className="titulo max-w-4xl text-6xl sm:text-8xl">
            Toda semana conta.{" "}
            <span className="text-brasa">Um campeão por ano.</span>
          </h1>
          <p className="max-w-xl text-lg text-texto2">
            Quatro etapas por mês, uma final a cada trimestre e o Player of the
            Year em dezembro. É assim que a First Strike transforma partidas
            semanais numa temporada inteira.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <BotaoLink href="/eventos">Jogar a próxima etapa</BotaoLink>
            <Link href="/ranking" className="text-sm font-semibold">
              Ver o ranking →
            </Link>
          </div>
        </div>
        <span className="absolute bottom-3 right-4 hidden text-[11px] text-white/50 sm:block">
          {creditoArte(aHero)}
        </span>
      </section>

      {/* Os três atos */}
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20">
        <div className="flex flex-col gap-3">
          <h2 className="titulo text-5xl sm:text-6xl">
            Como funciona a temporada
          </h2>
          <p className="max-w-2xl text-texto2">
            Três etapas, do primeiro ponto ao título do ano.
          </p>
        </div>
        <ol className="grid gap-5 lg:grid-cols-3">
          {ATOS.map((a, i) => (
            <li
              key={a.numero}
              className="group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden rounded-lg p-7 ring-1 ring-borda"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={srcArte(aAtos[i])}
                alt=""
                loading="lazy"
                style={{ objectPosition: aAtos[i].foco }}
                className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-preto via-preto/85 to-preto/20" />
              <span className="titulo absolute left-7 top-5 text-7xl text-white/15">
                {a.numero}
              </span>
              <span className="text-sm font-semibold text-brasa">
                {a.resumo}
              </span>
              <h3 className="titulo mt-1 text-4xl">{a.titulo}</h3>
              <p className="mt-3 text-texto2">{a.texto}</p>
              <span className="absolute right-4 top-4 text-[10px] text-white/50">
                {aAtos[i].artista}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Calendário */}
      <section className="border-y border-borda bg-fundo2">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="titulo text-5xl">O ano em 48 etapas</h2>
            <div className="flex flex-wrap gap-5 text-sm text-texto2">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-vermelho" /> Etapa
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rotate-45 bg-brasa" /> Final do
                Trimestre
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-alerta" /> Player of the
                Year
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRIMESTRES.map((t) => (
              <div
                key={t.n}
                className={`flex flex-col gap-4 rounded-lg p-5 ring-1 ${agora.trimestre === t.n ? "bg-vermelho/10 ring-vermelho" : "bg-grafite ring-borda"}`}
              >
                <span className="flex items-center justify-between">
                  <span className="titulo text-2xl">{t.nome}</span>
                  {agora.trimestre === t.n && (
                    <span className="text-xs font-bold uppercase tracking-wider text-brasa">
                      Agora
                    </span>
                  )}
                </span>
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((m) => {
                    const mes = (t.n - 1) * 3 + m;
                    const ultimo = m === 2;
                    return (
                      <div key={mes} className="flex items-center gap-3">
                        <span
                          className={`w-9 text-sm font-semibold ${agora.mes === mes + 1 ? "text-brasa" : "text-cinza"}`}
                        >
                          {MESES[mes]}
                        </span>
                        <span className="flex gap-1.5">
                          {Array.from({ length: ETAPAS_POR_MES }, (_, e) =>
                            ultimo && e === ETAPAS_POR_MES - 1 ? (
                              <span
                                key={e}
                                title="Final do Trimestre"
                                className="m-0.5 h-3.5 w-3.5 rotate-45 bg-brasa"
                              />
                            ) : (
                              <span
                                key={e}
                                className="h-4 w-4 rounded-full bg-vermelho/80"
                              />
                            ),
                          )}
                          {mes === 11 && (
                            <span
                              title="Player of the Year"
                              className="ml-1 h-4 w-4 rounded-sm bg-alerta"
                            />
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-cinza">
            O calendário vale para cada formato: Pauper, Premodern e Limited têm
            o próprio circuito. As datas de cada etapa ficam na{" "}
            <Link href="/eventos">agenda</Link>.
          </p>
        </div>
      </section>

      {/* Vagas do Player of the Year */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold uppercase tracking-widest text-alerta">
            Dezembro
          </span>
          <h2 className="titulo text-5xl sm:text-6xl">Player of the Year</h2>
          <p className="text-texto2">
            Oito vagas, conquistadas ao longo do ano. Quem vence uma Final do
            Trimestre está dentro. Quem chega em segundo também. Se alguém se
            classificar duas vezes, a vaga extra vai para o melhor do ranking
            anual.
          </p>
          <BotaoLink href="/ranking" variante="texto" className="justify-start">
            Acompanhar a corrida
          </BotaoLink>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: VAGAS_POTY }, (_, i) => {
            const t = (i % 4) + 1;
            const campeao = i < 4;
            return (
              <div
                key={i}
                className={`flex aspect-[3/4] flex-col justify-between rounded-lg p-4 ring-1 ${campeao ? "bg-brasa/10 ring-brasa/40" : "bg-grafite ring-borda"}`}
              >
                <span className="titulo text-4xl text-white/20">{i + 1}</span>
                <span className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-cinza">
                    {t}º trimestre
                  </span>
                  <span
                    className={`titulo text-2xl ${campeao ? "text-brasa" : "text-marfim"}`}
                  >
                    {campeao ? "Campeão" : "Vice"}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pontuação */}
      <section className="border-y border-borda bg-fundo2">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-4">
            <h2 className="titulo text-5xl">Pontuação</h2>
            <p className="text-texto2">
              Toda etapa, inclusive as Finais do Trimestre, soma pontos no
              ranking do trimestre e no anual. Em caso de empate, vale quem tem
              mais títulos, depois mais top 8 e depois mais vitórias.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {TABELA_PONTOS.map((t) => (
              <li
                key={t.faixa}
                className="flex flex-col items-center gap-1 rounded-lg bg-grafite px-3 py-6 text-center ring-1 ring-borda"
              >
                <span className="titulo text-5xl text-brasa">{t.pontos}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-cinza">
                  pontos
                </span>
                <span className="mt-2 text-sm font-semibold">{t.faixa}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Situação atual */}
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="titulo text-5xl">A temporada {temporada} até agora</h2>
          <Link href="/ranking" className="text-sm font-semibold">
            Ranking completo →
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            { slug: "pauper", nome: "Pauper", poty: pauper, rank: rankPauper },
            {
              slug: "premodern",
              nome: "Premodern",
              poty: premodern,
              rank: rankPremodern,
            },
            {
              slug: "limited",
              nome: "Limited",
              poty: limited,
              rank: rankLimited,
            },
          ].map((f) => (
            <div
              key={f.slug}
              className="flex flex-col gap-5 rounded-lg bg-grafite p-6 ring-1 ring-borda"
            >
              <div className="flex items-center justify-between">
                <h3 className="titulo text-3xl">Circuito {f.nome}</h3>
                <Link
                  href={`/ranking?liga=${f.slug}`}
                  className="text-sm font-semibold"
                >
                  Ranking →
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {f.poty.finais.map((fi) => (
                  <div
                    key={fi.trimestre}
                    className="flex flex-col gap-1 rounded-md bg-fundo2 p-3 ring-1 ring-borda"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cinza">
                      T{fi.trimestre}
                    </span>
                    {fi.campeao ? (
                      <>
                        <FotoJogador
                          nick={fi.campeao.nick}
                          avatar={fi.campeao.avatar}
                          tamanho={28}
                        />
                        <NomeJogador
                          nick={fi.campeao.nick}
                          className="truncate text-sm font-semibold text-brasa"
                        />
                      </>
                    ) : (
                      <span className="text-sm text-cinza">A definir</span>
                    )}
                  </div>
                ))}
              </div>
              {f.rank.length > 0 ? (
                <ol className="flex flex-col divide-y divide-borda">
                  {f.rank.slice(0, 5).map((l) => (
                    <li
                      key={l.chave}
                      className="flex items-center gap-3 py-2 text-sm"
                    >
                      <span className="w-5 font-semibold text-cinza">
                        {l.posicao}
                      </span>
                      <FotoJogador
                        nick={l.nick}
                        avatar={l.avatar}
                        tamanho={24}
                      />
                      <NomeJogador
                        nick={l.nick}
                        className="flex-1 truncate font-semibold"
                      />
                      <span className="font-bold">{l.pontos} pts</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-texto2">
                  O ranking começa na primeira etapa com resultado.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Perguntas */}
      <section className="border-t border-borda bg-fundo2">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.6fr]">
          <h2 className="titulo text-5xl">Perguntas sobre o circuito</h2>
          <div className="flex flex-col divide-y divide-borda border-y border-borda">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q.p}
                  <span className="text-brasa transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-texto2">{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
