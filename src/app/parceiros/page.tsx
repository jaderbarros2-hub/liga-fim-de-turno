import type { Metadata } from "next";
import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { creditoArte, sortearArtes, srcArte } from "@/lib/artes";
import { linkRastreado, listarParceiros } from "@/lib/parceiros";

export const metadata: Metadata = {
  title: "Parceiros",
  description: "Lojas e empresas que apoiam a First Strike.",
};
export const dynamic = "force-dynamic";

const PASSOS = [
  {
    titulo: "A loja premia e divulga",
    texto:
      "Cupons de desconto, boosters ou brindes para os eventos, e a liga nas redes e no balcão da loja.",
  },
  {
    titulo: "A liga dá visibilidade",
    texto:
      "Sua marca nos espaços de maior atenção do portal, associada aos prêmios e às vitórias dos jogadores.",
  },
  {
    titulo: "Você acompanha o retorno",
    texto:
      "Cada clique é contado e chega na sua loja marcado com UTM: dá para ver tudo no seu Google Analytics.",
  },
];

const NIVEIS = [
  {
    titulo: "Apoiador",
    resumo: "Premia de vez em quando",
    itens: [
      "Logo na faixa de parceiros da página inicial",
      "Página própria da loja no portal",
      "Nome e logo nos eventos que premiar",
    ],
  },
  {
    titulo: "Parceiro oficial",
    resumo: "Premia com frequência",
    destaque: true,
    itens: [
      "Tudo do Apoiador",
      "Banner em rotação na home, nos eventos, nas listas de deck e nos artigos",
      "Etapas “apresentadas por” a sua loja",
      "Destaque no resgate de prêmios da Carteira",
      "Relatório mensal de cliques",
    ],
  },
  {
    titulo: "Sede de eventos",
    resumo: "Para lojas físicas",
    itens: [
      "Eventos presenciais da liga na sua loja",
      "Endereço, mapa e contatos em todas as páginas do evento",
      "Sua loja no ingresso e nos e-mails dos jogadores",
    ],
  },
];

const ESPACOS = [
  ["Página do evento", "Onde o jogador decide garantir o ingresso."],
  [
    "Prêmios extras",
    "Seu cupom ou brinde em destaque, com o logo da loja, antes e depois do resultado.",
  ],
  [
    "Carteira do jogador",
    "O cupom fica guardado na Carteira do vencedor, com o código da sua loja.",
  ],
  ["Página inicial", "Faixa de parceiros e banner para quem chega ao portal."],
  [
    "Listas de deck",
    "Banner para quem está estudando o deck: sleeves, deck box, playmat.",
  ],
  ["Artigos", "Banner na coluna lateral, para um público que lê com calma."],
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
          <h1 className="titulo text-5xl sm:text-5xl">Parceiros</h1>
          <p className="max-w-2xl text-lg text-texto2">
            Lojas e empresas do mundo do Magic que ajudam a liga a acontecer e
            premiam quem joga.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <BotaoLink href="/contato">Quero ser parceiro</BotaoLink>
            <BotaoLink href="#como-funciona" variante="contorno">
              Como funciona
            </BotaoLink>
          </div>
        </div>
        <span className="absolute bottom-3 right-4 text-[11px] text-white/50">
          {creditoArte(arte)}
        </span>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        {parceiros.length === 0 ? (
          <p className="border-l-2 border-vermelho py-2 pl-4 text-texto2">
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
                  className="flex h-full flex-col gap-4 rounded-lg bg-grafite p-6 text-marfim no-underline ring-1 ring-borda hover:text-marfim hover:ring-brasa"
                >
                  {p.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logo_url}
                      alt={p.nome}
                      className="h-14 w-auto self-start object-contain"
                    />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-md bg-vermelho text-2xl font-bold">
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
                      <span className="rounded bg-vermelho/15 px-2 py-0.5 text-xs font-semibold text-brasa">
                        Eventos presenciais
                      </span>
                    )}
                    {p.aceita_credito && (
                      <span className="rounded bg-vermelho/15 px-2 py-0.5 text-xs font-semibold text-brasa">
                        Resgate de prêmios
                        {p.bonus_credito_pct ? ` +${p.bonus_credito_pct}%` : ""}
                      </span>
                    )}
                  </span>
                  <span className="mt-auto text-sm font-semibold text-brasa">
                    Conhecer a loja →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-20 border-t border-borda"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="titulo text-4xl">Como funciona a parceria</h2>
            <p className="mt-2 text-texto2">
              A parceria é uma troca: a loja ajuda a premiar e divulgar a liga,
              e a liga coloca a loja na frente de quem joga Pauper, Premodern e
              Limited toda semana. O cupom de desconto é a premiação mais
              simples para a loja: não tem envio e o valor volta como compra.
            </p>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3">
            {PASSOS.map((p, i) => (
              <li
                key={p.titulo}
                className="flex flex-col gap-2 border-t-2 border-vermelho pt-4"
              >
                <span className="text-sm font-semibold text-cinza">
                  {i + 1}
                </span>
                <span className="text-lg font-semibold">{p.titulo}</span>
                <span className="text-texto2">{p.texto}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="anuncie" className="scroll-mt-20 border-t border-borda">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
          <h2 className="titulo text-4xl">Formas de participar</h2>
          <ul className="grid gap-5 md:grid-cols-3">
            {NIVEIS.map((n) => (
              <li
                key={n.titulo}
                className={`flex flex-col gap-4 rounded-lg p-6 ring-1 ${n.destaque ? "bg-vermelho/10 ring-vermelho" : "bg-grafite ring-borda"}`}
              >
                <span>
                  <span className="titulo block text-2xl">{n.titulo}</span>
                  <span className="text-sm font-semibold text-brasa">
                    {n.resumo}
                  </span>
                </span>
                <ul className="flex flex-col gap-2 text-sm text-texto2">
                  {n.itens.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-brasa">✓</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-borda">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.6fr]">
          <div className="flex flex-col gap-3">
            <h2 className="titulo text-4xl">Onde sua marca aparece</h2>
            <p className="text-texto2">
              Banners aceitam a arte da própria loja (JPG, PNG, WebP ou GIF
              animado), em rotação com até três lojas por espaço. Todo conteúdo
              patrocinado é identificado.
            </p>
          </div>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {ESPACOS.map(([t, d]) => (
              <div
                key={t}
                className="flex flex-col gap-1 border-l-2 border-vermelho pl-4"
              >
                <dt className="font-semibold">{t}</dt>
                <dd className="text-sm text-texto2">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-borda">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="titulo text-4xl">Vamos conversar?</h2>
          <p className="text-texto2">
            Conte sobre a sua loja e como gostaria de participar. O media kit
            completo, com formatos e especificações, está sendo preparado.
          </p>
          <BotaoLink href="/contato">Quero ser parceiro</BotaoLink>
          <p className="pt-4 text-xs text-cinza">
            Aceitamos apenas parceiros do universo do Magic que vendam produtos
            originais. Conteúdo patrocinado é sempre identificado.{" "}
            <Link href="/termos">Termos de uso</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
