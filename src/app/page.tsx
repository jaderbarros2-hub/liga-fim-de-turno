import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { HeroRotativo, type Destaque } from "@/components/HeroRotativo";
import { EtiquetaLiga, ListaEventos } from "@/components/Eventos";
import { sortearPequenas } from "@/lib/artesPequenas";
import { BannerPatrocinado, FaixaParceiros } from "@/components/Parceiros";
import {
  capaDoEvento,
  creditoArte,
  sortearArtes,
  srcArte,
  type ArteBanco,
} from "@/lib/artes";
import { CorridaTemporada } from "@/components/CorridaTemporada";
import { MesaDeCartas } from "@/components/MesaDeCartas";
import { SecaoArtigos } from "@/components/Artigos";
import { EncontreSeuJogo } from "@/components/EncontreSeuJogo";
import { listarArtigos } from "@/lib/blog";
import {
  listarEventosEncerrados,
  listarInscritos,
  listarProximosEventos,
  listarResultados,
} from "@/lib/dados";
import { dataCurta, dataLonga, hora } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const [agenda, encerrados, artigos] = await Promise.all([
    listarProximosEventos(50),
    listarEventosEncerrados(5),
    listarArtigos(4),
  ]);
  const proximos = agenda.slice(0, 6);
  const destaque = proximos[0];
  const [inscritos, resultadosEncerrados, mesa] = await Promise.all([
    destaque ? listarInscritos(destaque.id) : Promise.resolve([]),
    Promise.all(encerrados.map((e) => listarResultados(e.id))),
    Promise.all([
      sortearPequenas("pauper", 20),
      sortearPequenas("premodern", 20),
      sortearPequenas("limited", 20),
    ]).then((g) => g.flat().sort(() => Math.random() - 0.5)),
  ]);
  // Capa do evento em destaque: arte da coleção/cubo ou do formato do evento
  const capaDestaque = destaque ? capaDoEvento(destaque) : null;

  // Artes sorteadas a cada visita (topo: só imagens grandes)
  const [aEvento] = sortearArtes(
    destaque?.formato === "pauper" ? "pauper" : "geral",
    1,
    true,
  );
  const [a1, a2, a3] = sortearArtes("geral", 3, true).map((a, i, arr) =>
    a.arquivo === aEvento.arquivo ? arr[(i + 1) % arr.length] : a,
  );
  // Cartões das ligas: ilustrações do Scryfall (espaço pequeno)
  const [[artePauper], [artePremodern], [arteLimited]] = await Promise.all([
    sortearPequenas("pauper", 1),
    sortearPequenas("premodern", 1),
    sortearPequenas("limited", 1),
  ]);
  const img = (a: ArteBanco) => ({
    imagem: srcArte(a),
    credito: creditoArte(a),
    posicaoImagem: a.foco,
  });

  const destaques: Destaque[] = [
    destaque && capaDestaque
      ? {
          id: "evento",
          imagem: capaDestaque.src,
          credito: capaDestaque.credito,
          posicaoImagem: capaDestaque.foco,
          etiqueta: (
            <>
              <EtiquetaLiga evento={destaque} />
              <span>
                {dataLonga(destaque.inicio)} · {hora(destaque.inicio)}
              </span>
            </>
          ),
          titulo: destaque.titulo,
          texto:
            destaque.modalidade === "presencial"
              ? `Presencial${destaque.loja?.nome ? ` na ${destaque.loja.nome}` : ""}${destaque.loja?.cidade ? `, em ${destaque.loja.cidade}` : ""}, com ${destaque.percentual_premio}% das inscrições em prêmios.`
              : `Online no Endstep, sem precisar ter as cartas, com ${destaque.percentual_premio}% das inscrições em prêmios.`,
          acao: { href: `/eventos/${destaque.slug}`, rotulo: "Inscrever-se" },
          rodape: `${inscritos.length} inscritos${destaque.vagas ? ` de ${destaque.vagas}` : ""} · até ${dataCurta(destaque.inscricoes_ate)}, ${hora(destaque.inscricoes_ate)}`,
        }
      : {
          id: "liga",
          ...img(aEvento),
          titulo: (
            <>
              Pauper, Premodern e Limited{" "}
              <span className="text-ciano">toda semana</span>
            </>
          ),
          texto:
            "Etapas online no Endstep, inscrição pelo Pix e prêmio para as melhores campanhas. A próxima etapa é anunciada primeiro no Discord.",
          acao: { href: "/contato", rotulo: "Entrar no Discord" },
          acaoSecundaria: { href: "/como-jogar", rotulo: "Como funciona" },
        },
    {
      id: "sem-cartas",
      ...img(a1),
      titulo: (
        <>
          Jogue sem precisar <span className="text-ciano">ter as cartas</span>
        </>
      ),
      texto:
        "As etapas acontecem no Endstep, gratuito e direto no navegador. Monte a lista, entre no evento e jogue.",
      acao: { href: "/como-jogar", rotulo: "Como jogar" },
      acaoSecundaria: { href: "/eventos", rotulo: "Ver agenda" },
    },
    {
      id: "premio",
      ...img(a2),
      titulo: (
        <>
          80% da inscrição <span className="text-ciano">vira prêmio</span>
        </>
      ),
      texto:
        "O prêmio cai na sua Carteira da liga: saque por Pix, use no próximo ingresso ou envie para uma loja parceira. A classificação fica pública no portal.",
      acao: { href: "/regras", rotulo: "Ver as regras" },
      acaoSecundaria: { href: "/resultados", rotulo: "Resultados anteriores" },
    },
    {
      id: "temporada",
      ...img(a3),
      titulo: (
        <>
          Uma temporada <span className="text-ciano">inteira</span> para
          disputar
        </>
      ),
      texto:
        "A partir de 2027: ranking por liga, pontos por participação, finais trimestrais e o Top 8 anual que define o jogador do ano.",
      acao: { href: "/sobre", rotulo: "Conheça a liga" },
    },
  ];

  return (
    <>
      <HeroRotativo destaques={destaques} />

      {/* Atalhos para a agenda filtrada */}
      <EncontreSeuJogo
        eventos={agenda.map((e) => ({
          slug: e.slug,
          titulo: e.titulo,
          inicio: e.inicio,
          formato: e.formato,
          modalidade: e.modalidade,
          cidade: e.loja?.cidade ?? null,
        }))}
      />

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

      {/* As ligas, cada uma com sua arte */}
      <section className="border-t border-borda">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="titulo text-5xl">As ligas</h2>
              <p className="mt-1 text-texto2">
                Três formatos, uma temporada. Escolha a sua e acompanhe etapas,
                ranking e regras.
              </p>
            </div>
            <Link href="/circuito" className="text-sm font-semibold">
              Ver o circuito →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Liga
              slug="pauper"
              nome="Liga Pauper"
              texto="Só cartas comuns, decks acessíveis e jogo competitivo toda semana. Rodadas suíças e prêmio por classificação."
              arte={artePauper}
            />
            <Liga
              slug="premodern"
              nome="Liga Premodern"
              texto="O Magic clássico: cartas de Fourth Edition a Scourge, decks de 60 cartas e o metagame de 1995 a 2003."
              arte={artePremodern}
            />
            <Liga
              slug="limited"
              nome="Liga Limited"
              texto="Draft, selado e cubo em pods de até 8 jogadores, com prêmio por campanha."
              arte={arteLimited}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <BannerPatrocinado posicao="home" pagina="/" />
      </div>

      {/* Prévia do ranking: top 5 de cada liga */}
      <CorridaTemporada />

      {encerrados.length > 0 && (
        <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="titulo text-5xl">Últimos eventos</h2>
            <Link href="/resultados" className="text-sm font-semibold">
              Todos os eventos →
            </Link>
          </div>
          <ul className="flex flex-col border-t border-borda">
            {encerrados.map((e, n) => (
              <li key={e.id}>
                <Link
                  href={`/eventos/${e.slug}?aba=resultados`}
                  className="group flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-borda py-4 text-gelo no-underline"
                >
                  <span className="w-20 text-sm font-semibold text-cinza">
                    {dataCurta(e.inicio)}
                  </span>
                  <span className="min-w-56 flex-1 text-lg font-semibold group-hover:text-ciano">
                    {e.titulo}
                  </span>
                  {resultadosEncerrados[n]?.[0] && (
                    <span className="text-sm text-texto2">
                      Campeão:{" "}
                      <span className="font-semibold text-gelo">
                        {resultadosEncerrados[n][0].nick_endstep}
                      </span>{" "}
                      · {resultadosEncerrados[n].length} jogadores
                    </span>
                  )}
                  <EtiquetaLiga evento={e} />
                  <span className="text-sm font-semibold text-ciano">
                    Classificação →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {artigos.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-4">
          <SecaoArtigos
            titulo="Últimos artigos"
            artigos={artigos}
            href="/blog"
            grande
          />
        </div>
      )}

      <FaixaParceiros />

      {/* Comunidade: cartas jogadas na mesa, uma chamada no centro */}
      <section className="relative isolate overflow-hidden border-t border-borda">
        <MesaDeCartas cartas={mesa} />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgb(6_7_10/0.9)_20%,rgb(6_7_10/0.45)_60%,rgb(6_7_10/0.3)_100%)]" />
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 py-28 text-center">
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

function Liga({
  slug,
  nome,
  texto,
  arte,
}: {
  slug: string;
  nome: string;
  texto: string;
  arte: ArteBanco;
}) {
  return (
    <Link
      href={`/ligas/${slug}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-grafite text-gelo no-underline ring-1 ring-borda transition hover:ring-ciano"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcArte(arte)}
          alt=""
          loading="lazy"
          style={{ objectPosition: arte.foco }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-grafite via-grafite/20 to-transparent" />
        <span
          className="absolute right-3 top-2 max-w-[70%] truncate text-[10px] text-white/60"
          title={creditoArte(arte)}
        >
          {arte.artista}
        </span>
        <h3 className="titulo absolute bottom-3 left-5 text-4xl drop-shadow">
          {nome}
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-3">
        <p className="line-clamp-3 text-sm text-texto2">{texto}</p>
        <span className="mt-auto text-sm font-semibold text-ciano">
          Ver etapas e regras →
        </span>
      </div>
    </Link>
  );
}
