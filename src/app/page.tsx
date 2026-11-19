import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { HeroRotativo, type Destaque } from "@/components/HeroRotativo";
import { EtiquetaLiga, ListaEventos } from "@/components/Eventos";
import { BannerPatrocinado, FaixaParceiros } from "@/components/Parceiros";
import {
  CARTAS_FAIXA,
  cartaInteira,
  creditoArte,
  sortearArtes,
  srcArte,
  type ArteBanco,
} from "@/lib/artes";
import { SecaoArtigos } from "@/components/Artigos";
import { listarArtigos } from "@/lib/blog";
import {
  listarEventosEncerrados,
  listarInscritos,
  listarProximosEventos,
} from "@/lib/dados";
import { dataCurta, dataLonga, hora } from "@/lib/formato";

export const dynamic = "force-dynamic";

const PASSOS = [
  {
    titulo: "Entre com o Discord",
    texto: "Informe seu nick do Endstep e sua chave Pix para prêmios.",
  },
  {
    titulo: "Pague a inscrição no Pix",
    texto: "A confirmação é automática e libera o link privado do evento.",
  },
  {
    titulo: "Jogue no Endstep",
    texto:
      "Direto no navegador, sem precisar ter as cartas. O resultado sai aqui.",
  },
];

const POR_QUE = [
  {
    titulo: "Sem precisar ter as cartas",
    texto:
      "Jogue no Endstep, de graça e no navegador. Teste qualquer deck sem gastar com cartas.",
    icone: "M4 6h11v14H4zM9 4h11v14",
  },
  {
    titulo: "80% da inscrição vira prêmio",
    texto:
      "O prêmio cai na sua Carteira: saque por Pix, use em ingressos ou envie para lojas parceiras.",
    icone: "M12 3v18M17 7H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H7",
  },
  {
    titulo: "Decks e resultados públicos",
    texto:
      "Classificação, arquétipos e as listas do top 8 ficam no portal para todo mundo estudar.",
    icone: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  },
  {
    titulo: "Temporada com ranking",
    texto:
      "Pontos por resultado e por participação, finais trimestrais e Top 8 anual a partir de 2027.",
    icone:
      "M7 4h10v4a5 5 0 01-10 0zM12 13v4M8 21h8M7 6H4a3 3 0 003 3M17 6h3a3 3 0 01-3 3",
  },
];

export default async function Inicio() {
  const [proximos, encerrados, artigos] = await Promise.all([
    listarProximosEventos(6),
    listarEventosEncerrados(3),
    listarArtigos(4),
  ]);
  const destaque = proximos[0];
  const inscritos = destaque ? await listarInscritos(destaque.id) : [];

  // Artes sorteadas a cada visita (topo: só imagens grandes)
  const [aEvento] = sortearArtes(
    destaque?.formato === "pauper" ? "pauper" : "geral",
    1,
    true,
  );
  const [a1, a2, a3] = sortearArtes("geral", 3, true).map((a, i, arr) =>
    a.arquivo === aEvento.arquivo ? arr[(i + 1) % arr.length] : a,
  );
  const [artePauper] = sortearArtes("pauper", 1);
  const [arteLimited] = sortearArtes("limited", 1).map((a) =>
    a.arquivo === artePauper.arquivo ? sortearArtes("geral", 1)[0] : a,
  );
  const [artePremodern] = sortearArtes("geral", 3).filter(
    (a) =>
      a.arquivo !== artePauper.arquivo && a.arquivo !== arteLimited.arquivo,
  );
  const img = (a: ArteBanco) => ({
    imagem: srcArte(a),
    credito: creditoArte(a),
    posicaoImagem: a.foco,
  });

  const destaques: Destaque[] = [
    destaque
      ? {
          id: "evento",
          ...img(aEvento),
          etiqueta: (
            <>
              <EtiquetaLiga evento={destaque} />
              <span>
                {dataLonga(destaque.inicio)} · {hora(destaque.inicio)}
              </span>
            </>
          ),
          titulo: destaque.titulo,
          texto: `Online no Endstep, sem precisar ter as cartas, com ${destaque.percentual_premio}% das inscrições em prêmios pagos por Pix.`,
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

      {/* Por que jogar: os diferenciais, para quem não espera o carrossel */}
      <section className="border-b border-borda bg-fundo2">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {POR_QUE.map((p) => (
            <div key={p.titulo} className="flex gap-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-ciano"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={p.icone} />
              </svg>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold">{p.titulo}</h2>
                <p className="text-sm text-texto2">{p.texto}</p>
              </div>
            </div>
          ))}
        </div>
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

      {/* As ligas, cada uma com sua arte */}
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-16 md:grid-cols-3">
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
          arte={artePremodern ?? artePauper}
        />
        <Liga
          slug="limited"
          nome="Liga Limited"
          texto="Draft, selado e cubo em pods de até 8 jogadores, com prêmio por campanha."
          arte={arteLimited}
        />
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <BannerPatrocinado posicao="home" pagina="/" />
      </div>

      {/* Como funciona: uma faixa direta, sem cartões */}
      <section className="border-y border-borda bg-fundo2">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1fr_2fr]">
          <h2 className="titulo text-5xl">Do cadastro à mesa</h2>
          <ol className="grid gap-8 sm:grid-cols-3">
            {PASSOS.map((p, i) => (
              <li
                key={p.titulo}
                className="flex flex-col gap-2 border-t-2 border-azul pt-4"
              >
                <span className="text-sm font-semibold text-cinza">
                  Passo {i + 1}
                </span>
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
                  <span className="w-20 text-sm font-semibold text-cinza">
                    {dataCurta(e.inicio)}
                  </span>
                  <span className="min-w-56 flex-1 text-lg font-semibold group-hover:text-ciano">
                    {e.titulo}
                  </span>
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
        <div className="mx-auto max-w-6xl px-6 py-16">
          <SecaoArtigos
            titulo="Últimos artigos"
            artigos={artigos}
            href="/blog"
          />
        </div>
      )}

      <FaixaParceiros />

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
      className="group relative isolate flex min-h-[300px] flex-col justify-end overflow-hidden rounded-lg p-8 text-gelo no-underline ring-1 ring-borda hover:ring-ciano"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcArte(arte)}
        alt=""
        loading="lazy"
        style={{ objectPosition: arte.foco }}
        className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-preto via-preto/70 to-preto/10" />
      <span className="absolute right-4 top-3 text-[11px] text-white/60">
        {creditoArte(arte)}
      </span>
      <h2 className="titulo text-5xl">{nome}</h2>
      <p className="mt-2 max-w-md text-texto2">{texto}</p>
      <span className="mt-4 text-sm font-semibold text-ciano">
        Ver etapas e regras →
      </span>
    </Link>
  );
}
