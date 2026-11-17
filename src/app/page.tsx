import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { EtiquetaLiga, ListaEventos } from "@/components/Eventos";
import { ARTES, ARTE_LIGA, CARTAS_FAIXA, cartaInteira, credito, ilustracao, type Arte } from "@/lib/artes";
import { listarEventosEncerrados, listarInscritos, listarProximosEventos } from "@/lib/dados";
import { dataCurta, dataLonga, hora, reais } from "@/lib/formato";

export const dynamic = "force-dynamic";

const PASSOS = [
  { titulo: "Entre com o Discord", texto: "Informe seu nick do Endstep e sua chave Pix para prêmios." },
  { titulo: "Pague a inscrição no Pix", texto: "A confirmação é automática e libera o link privado do evento." },
  { titulo: "Jogue no Endstep", texto: "Direto no navegador, sem precisar ter as cartas. O resultado sai aqui." },
];

const ARTE_HERO = ARTES.counterspell;
const LEQUE = [ARTES.spellstutter, ARTES.ninja, ARTES.augur];

export default async function Inicio() {
  const [proximos, encerrados] = await Promise.all([listarProximosEventos(6), listarEventosEncerrados(3)]);
  const destaque = proximos[0];
  const inscritos = destaque ? await listarInscritos(destaque.id) : [];

  return (
    <>
      {/* Hero: uma arte de carta em tela cheia, o próximo evento e uma ação */}
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ilustracao(ARTE_HERO)}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_30%] opacity-70"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/20" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-preto to-transparent" />

        <div className="mx-auto grid min-h-[560px] max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.15fr_1fr]">
          <div className="surgir flex flex-col gap-6">
            {destaque ? (
              <>
                <div className="flex items-center gap-3 text-sm font-semibold text-texto2">
                  <EtiquetaLiga evento={destaque} />
                  <span>
                    {dataLonga(destaque.inicio)} · {hora(destaque.inicio)}
                  </span>
                </div>
                <h1 className="titulo text-6xl sm:text-7xl">{destaque.titulo}</h1>
                <p className="max-w-lg text-lg text-texto2">
                  Online no Endstep, sem precisar ter as cartas. Inscrição de {reais(destaque.valor_centavos)}, com{" "}
                  {destaque.percentual_premio}% das inscrições em prêmios pagos por Pix.
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <BotaoLink href={`/eventos/${destaque.slug}`} className="min-h-12 text-base">
                    Inscrever-se
                  </BotaoLink>
                  <span className="text-sm text-cinza">
                    {inscritos.length} inscritos{destaque.vagas ? ` de ${destaque.vagas}` : ""} · até{" "}
                    {dataCurta(destaque.inscricoes_ate)}, {hora(destaque.inscricoes_ate)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <h1 className="titulo text-6xl sm:text-7xl">
                  Pauper e Limited
                  <br />
                  <span className="text-ciano">toda semana</span>
                </h1>
                <p className="max-w-lg text-lg text-texto2">
                  Etapas online no Endstep, inscrição pelo Pix e prêmio para as melhores campanhas. A próxima etapa é
                  anunciada primeiro no Discord.
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <BotaoLink href="/contato" className="min-h-12 text-base">
                    Entrar no Discord
                  </BotaoLink>
                  <Link href="/como-jogar" className="text-sm font-semibold">
                    Como funciona →
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Leque de cartas inteiras (com artista e copyright visíveis na própria carta) */}
          <div className="relative hidden h-[420px] lg:block" aria-hidden="true">
            {LEQUE.map((a, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={a.carta}
                src={cartaInteira(a)}
                alt=""
                className="carta-solta absolute top-6 w-[230px]"
                style={{
                  left: `${60 + i * 120}px`,
                  transform: `rotate(${(i - 1) * 9}deg) translateY(${i === 1 ? -18 : 6}px)`,
                  zIndex: i === 1 ? 2 : 1,
                }}
              />
            ))}
          </div>
        </div>
        <span className="absolute bottom-3 right-4 text-[11px] text-white/50">Fundo: {credito(ARTE_HERO)}</span>
      </section>

      {/* Próximos eventos */}
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="titulo text-5xl">Próximos eventos</h2>
          <Link href="/eventos" className="text-sm font-semibold">
            Agenda completa →
          </Link>
        </div>
        <ListaEventos eventos={proximos} />
      </section>

      {/* As duas ligas, cada uma com sua arte */}
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-16 md:grid-cols-2">
        <Liga
          slug="pauper"
          nome="Liga Pauper"
          texto="Só cartas comuns, decks acessíveis e jogo competitivo toda semana. Rodadas suíças e prêmio por classificação."
          arte={ARTE_LIGA.pauper}
        />
        <Liga
          slug="limited"
          nome="Liga Limited"
          texto="Draft, selado e cubo em pods de até 8 jogadores, com prêmio por campanha."
          arte={ARTE_LIGA.limited}
        />
      </section>

      {/* Como funciona: uma faixa direta, sem cartões */}
      <section className="border-y border-borda bg-fundo2">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1fr_2fr]">
          <h2 className="titulo text-5xl">Do cadastro à mesa</h2>
          <ol className="grid gap-8 sm:grid-cols-3">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="flex flex-col gap-2 border-t-2 border-azul pt-4">
                <span className="text-sm font-semibold text-cinza">Passo {i + 1}</span>
                <span className="text-lg font-semibold">{p.titulo}</span>
                <span className="text-texto2">{p.texto}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {encerrados.length > 0 && (
        <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="titulo text-5xl">Últimos resultados</h2>
            <Link href="/resultados" className="text-sm font-semibold">
              Todos os resultados →
            </Link>
          </div>
          <ul className="flex flex-col border-t border-borda">
            {encerrados.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/eventos/${e.slug}?aba=resultados`}
                  className="group flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-borda py-4 text-gelo no-underline"
                >
                  <span className="w-20 text-sm font-semibold text-cinza">{dataCurta(e.inicio)}</span>
                  <span className="min-w-56 flex-1 text-lg font-semibold group-hover:text-ciano">{e.titulo}</span>
                  <EtiquetaLiga evento={e} />
                  <span className="text-sm font-semibold text-ciano">Classificação →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Comunidade: cartas espalhadas como textura, uma chamada no centro */}
      <section className="relative isolate overflow-hidden border-t border-borda">
        <div className="absolute inset-0 -z-10 opacity-60" aria-hidden="true">
          {CARTAS_FAIXA.map((a, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.carta}
              src={cartaInteira(a, "normal")}
              alt=""
              loading="lazy"
              className="carta-solta absolute w-[180px]"
              style={{
                left: `${(i / CARTAS_FAIXA.length) * 100 - 4}%`,
                top: `${i % 2 ? 38 : -12}%`,
                transform: `rotate(${((i * 37) % 30) - 15}deg)`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-preto/70" />
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 py-24 text-center">
          <h2 className="titulo text-5xl">A liga acontece no Discord</h2>
          <p className="text-lg text-texto2">
            Avisos de etapa, conversa sobre decks e suporte nos dias de evento.
          </p>
          <BotaoLink href="/contato" className="min-h-12 text-base">
            Entrar no Discord
          </BotaoLink>
        </div>
      </section>
    </>
  );
}

function Liga({ slug, nome, texto, arte }: { slug: string; nome: string; texto: string; arte: Arte }) {
  return (
    <Link
      href={`/ligas/${slug}`}
      className="group relative isolate flex min-h-[300px] flex-col justify-end overflow-hidden rounded-lg p-8 text-gelo no-underline ring-1 ring-borda hover:ring-ciano"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ilustracao(arte)}
        alt=""
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-preto via-preto/70 to-preto/10" />
      <span className="absolute right-4 top-3 text-[11px] text-white/60">{credito(arte)}</span>
      <h2 className="titulo text-5xl">{nome}</h2>
      <p className="mt-2 max-w-md text-texto2">{texto}</p>
      <span className="mt-4 text-sm font-semibold text-ciano">Ver etapas e regras →</span>
    </Link>
  );
}
