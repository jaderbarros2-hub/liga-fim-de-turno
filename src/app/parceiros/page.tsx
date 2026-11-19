import type { Metadata } from "next";
import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { creditoArte, sortearArtes, srcArte } from "@/lib/artes";
import { linkRastreado, listarParceiros } from "@/lib/parceiros";

export const metadata: Metadata = {
  title: "Parceiros",
  description: "Lojas e empresas que apoiam a Liga Fim de Turno.",
};
export const dynamic = "force-dynamic";

const PLANOS = [
  {
    titulo: "Logo na faixa de parceiros",
    texto:
      "Sua marca na página inicial e nesta página, com link rastreado para a loja.",
  },
  {
    titulo: "Banner patrocinado",
    texto:
      "Espaço na página inicial, nas páginas de evento e nas listas de deck, com relatório de cliques.",
  },
  {
    titulo: "Comprar este deck",
    texto:
      "Botão nas listas do top 8 levando o jogador direto para a sua loja, com a lista pronta para busca.",
  },
];

export default async function Parceiros() {
  const parceiros = await listarParceiros();
  const [arte] = sortearArtes("geral", 1, true);

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
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/90 to-preto/40" />
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-16">
          <h1 className="titulo text-6xl sm:text-7xl">Parceiros</h1>
          <p className="max-w-2xl text-lg text-texto2">
            Lojas e empresas do mundo do Magic que ajudam a liga a acontecer
            toda semana.
          </p>
        </div>
        <span className="absolute bottom-3 right-4 text-[11px] text-white/50">
          {creditoArte(arte)}
        </span>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        {parceiros.length === 0 ? (
          <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
            A liga está começando e as primeiras parcerias estão sendo fechadas.
            Quer ser uma delas? Veja abaixo.
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {parceiros.map((p) => (
              <li key={p.id}>
                <Link
                  href={
                    p.slug
                      ? `/parceiros/${p.slug}`
                      : linkRastreado({
                          parceiro: p.id,
                          origem: "logo",
                          pagina: "/parceiros",
                        })
                  }
                  className="flex h-full flex-col gap-4 rounded-lg bg-grafite p-6 text-gelo no-underline ring-1 ring-borda hover:text-gelo hover:ring-ciano"
                >
                  {p.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logo_url}
                      alt={p.nome}
                      className="h-14 w-auto self-start object-contain"
                    />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-md bg-azul text-2xl font-bold">
                      {p.nome.charAt(0)}
                    </span>
                  )}
                  <span className="flex flex-col">
                    <span className="text-lg font-semibold">{p.nome}</span>
                    <span className="text-sm text-cinza">
                      {[p.cidade, p.uf].filter(Boolean).join("/") ||
                        "Loja online"}
                    </span>
                  </span>
                  {p.descricao && (
                    <span className="text-sm text-texto2">{p.descricao}</span>
                  )}
                  <span className="flex flex-wrap gap-1.5">
                    {p.sede_eventos && (
                      <span className="rounded bg-azul/15 px-2 py-0.5 text-xs font-semibold text-ciano">
                        Eventos presenciais
                      </span>
                    )}
                    {p.aceita_credito && (
                      <span className="rounded bg-azul/15 px-2 py-0.5 text-xs font-semibold text-ciano">
                        Resgate de prêmios
                        {p.bonus_credito_pct ? ` +${p.bonus_credito_pct}%` : ""}
                      </span>
                    )}
                    {p.compra_deck && (
                      <span className="rounded bg-azul/15 px-2 py-0.5 text-xs font-semibold text-ciano">
                        Vende cartas
                      </span>
                    )}
                  </span>
                  <span className="mt-auto text-sm font-semibold text-ciano">
                    Conhecer a loja →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id="anuncie"
        className="scroll-mt-20 border-t border-borda bg-fundo2"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.6fr]">
          <div className="flex flex-col gap-4">
            <h2 className="titulo text-5xl">Seja parceiro</h2>
            <p className="text-texto2">
              Fale direto com quem joga Pauper, Premodern e Limited toda semana.
              Os links são rastreados e você recebe o número de cliques que a
              liga gerou para a sua loja.
            </p>
            <BotaoLink href="/contato" className="self-start">
              Quero ser parceiro
            </BotaoLink>
          </div>
          <ul className="grid gap-8 sm:grid-cols-3">
            {PLANOS.map((p) => (
              <li
                key={p.titulo}
                className="flex flex-col gap-2 border-t-2 border-azul pt-4"
              >
                <span className="font-semibold">{p.titulo}</span>
                <span className="text-sm text-texto2">{p.texto}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mx-auto max-w-6xl px-6 pb-10 text-xs text-cinza">
          Aceitamos apenas parceiros do universo do Magic que vendam produtos
          originais. Conteúdo patrocinado é sempre identificado.{" "}
          <Link href="/termos">Termos de uso</Link>.
        </p>
      </section>
    </>
  );
}
