import type { Metadata } from "next";
import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { ARTES, ARTE_LIGA, credito, ilustracao } from "@/lib/artes";

export const metadata: Metadata = {
  title: "Sobre a liga",
  description: "Por que a Liga Fim de Turno existe, como funciona e quem organiza.",
};

const DIFERENCIAIS = [
  {
    titulo: "Sem precisar ter as cartas",
    texto:
      "As partidas acontecem no Endstep, gratuito e direto no navegador. O deck que você quiser testar está a um clique, sem gastar com cartas.",
  },
  {
    titulo: "Prêmio de verdade, com transparência",
    texto:
      "80% de cada inscrição volta como prêmio, pago por Pix em até 48 horas. Classificação, divisão e regras ficam públicas no portal.",
  },
  {
    titulo: "Competição toda semana",
    texto:
      "Etapas semanais de Pauper e Limited, com temporada, ranking e finais. Um motivo para treinar, evoluir e voltar na semana seguinte.",
  },
];

export default function Sobre() {
  const arte = ARTES.spellstutter;
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ilustracao(arte)} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-top opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/90 to-preto/40" />
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-20">
          <h1 className="titulo max-w-3xl text-6xl sm:text-7xl">
            Magic competitivo, <span className="text-ciano">acessível</span> e toda semana
          </h1>
          <p className="max-w-2xl text-lg text-texto2">
            A Liga Fim de Turno nasceu para juntar quem gosta de jogar Magic a sério, mas não quer depender de ter uma
            coleção cara ou de uma loja perto de casa para competir.
          </p>
        </div>
        <span className="absolute bottom-3 right-4 text-[11px] text-white/50">Fundo: {credito(arte)}</span>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_1.4fr]">
        <h2 className="titulo text-5xl">Por que a liga existe</h2>
        <div className="conteudo-texto">
          <p>
            Jogar Magic de forma competitiva costuma ter duas barreiras: o preço das cartas e a distância até um
            torneio. O Pauper, que só usa cartas comuns, e o Limited, em que todos montam o deck na hora, já são os
            formatos mais democráticos do jogo. Faltava um lugar fixo, organizado e confiável para jogá-los valendo
            alguma coisa.
          </p>
          <p>
            A liga é esse lugar: etapas com dia e hora marcados, inscrição simples pelo Pix, regras claras, resultado
            publicado e prêmio pago rápido. Com o tempo, a ideia é formar uma comunidade que se encontra toda semana,
            troca listas, discute o metagame e cresce junto, online e, depois, também em eventos presenciais.
          </p>
        </div>
      </section>

      <section className="border-y border-borda bg-fundo2">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {DIFERENCIAIS.map((d) => (
            <div key={d.titulo} className="flex flex-col gap-3 border-t-2 border-azul pt-5">
              <h3 className="text-xl font-semibold">{d.titulo}</h3>
              <p className="text-texto2">{d.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <h2 className="titulo text-5xl">Os formatos</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { slug: "pauper", nome: "Pauper", texto: "Só cartas comuns. Decks baratos, partidas rápidas e um metagame variado. Rodadas suíças e prêmio por classificação." },
            { slug: "limited", nome: "Limited", texto: "Draft, selado e cubo. Todo mundo monta o deck na hora, então ganha quem joga melhor. Prêmio por campanha." },
          ].map((f) => (
            <Link
              key={f.slug}
              href={`/ligas/${f.slug}`}
              className="group relative isolate flex min-h-60 flex-col justify-end overflow-hidden rounded-lg p-7 text-gelo no-underline ring-1 ring-borda hover:ring-ciano"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ilustracao(ARTE_LIGA[f.slug])} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-preto via-preto/75 to-preto/10" />
              <span className="absolute right-4 top-3 text-[11px] text-white/60">{credito(ARTE_LIGA[f.slug])}</span>
              <h3 className="titulo text-4xl">{f.nome}</h3>
              <p className="mt-2 max-w-md text-texto2">{f.texto}</p>
            </Link>
          ))}
        </div>
        <p className="text-sm text-cinza">Modern e Premodern estão nos planos para as próximas temporadas.</p>
      </section>

      <section className="border-t border-borda bg-fundo2">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_1.4fr]">
          <h2 className="titulo text-5xl">Quem organiza</h2>
          <div className="flex flex-col gap-5">
            <div className="conteudo-texto">
              <p>
                A liga é organizada por Jader, jogador de Magic, como um projeto independente da comunidade. Não tem
                vínculo com a Wizards of the Coast, a Hasbro ou o Endstep.
              </p>
              <p>
                Lojas e empresas do mundo do Magic podem apoiar a liga como parceiras. Jogadores podem ajudar trazendo
                amigos, escrevendo para o blog ou sugerindo melhorias no Discord.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <BotaoLink href="/eventos">Ver próximas etapas</BotaoLink>
              <Link href="/contato" className="text-sm font-semibold">
                Falar com a organização →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
