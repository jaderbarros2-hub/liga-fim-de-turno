import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListaEventos } from "@/components/Eventos";
import { listarProximosEventos } from "@/lib/dados";
import { creditoArte, sortearArtes, srcArte } from "@/lib/artes";

export const dynamic = "force-dynamic";

const LIGAS: Record<
  string,
  { nome: string; resumo: string; regras: string[] }
> = {
  pauper: {
    nome: "Liga Pauper",
    resumo:
      "Só cartas comuns, decks acessíveis e jogo competitivo toda semana, online no Endstep.",
    regras: [
      "Rodadas suíças com todos os inscritos: 3 rodadas com 8 jogadores, 4 com 9 ou mais.",
      "Partidas melhor de 3, deck de 60 cartas e sideboard de até 15, lista oficial do Pauper.",
      "Prêmio por classificação final: 80% das inscrições.",
      "Ranking por temporada trimestral, final do trimestre e Top 8 anual (a partir de 2027).",
    ],
  },
  limited: {
    nome: "Liga Limited",
    resumo:
      "Draft, selado e cubo em pods de até 8 jogadores, online no Endstep.",
    regras: [
      "Pods de 6 a 8 jogadores, 3 rodadas suíças dentro do pod, partidas melhor de 3.",
      "Draft com 3 pacotes de 15 cartas; selado com 6 boosters; cubo oficial da liga.",
      "Prêmio por campanha: 3-0 vale 3 cotas e 2-1 vale 1 cota.",
      "Ranking por temporada trimestral, final em formato de draft e Top 8 anual (a partir de 2027).",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: LIGAS[slug]?.nome ?? "Liga" };
}

export default async function PaginaLiga({ params }: Props) {
  const { slug } = await params;
  const liga = LIGAS[slug];
  if (!liga) notFound();
  const eventos = await listarProximosEventos(20, slug);

  const [arte] = sortearArtes(slug === "pauper" ? "pauper" : "limited", 1, true);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcArte(arte)}
          style={{ objectPosition: arte.foco }}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/30" />
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-16">
          <h1 className="titulo text-6xl sm:text-7xl">{liga.nome}</h1>
          <p className="max-w-2xl text-lg text-texto2">{liga.resumo}</p>
        </div>
        <span className="absolute bottom-3 right-4 text-[11px] text-white/50">
          {creditoArte(arte)}
        </span>
      </section>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <section className="flex flex-col gap-4">
          <h2 className="titulo text-4xl">Próximas etapas</h2>
          <ListaEventos eventos={eventos} />
        </section>
        <section className="flex flex-col gap-3 border-t-2 border-azul pt-6">
          <h2 className="titulo text-3xl">Como funciona</h2>
          <ul className="ml-5 list-disc text-texto2">
            {liga.regras.map((r) => (
              <li key={r} className="py-1">
                {r}
              </li>
            ))}
          </ul>
          <Link href="/regras" className="text-sm font-semibold">
            Regulamento completo
          </Link>
        </section>
      </div>
    </>
  );
}
