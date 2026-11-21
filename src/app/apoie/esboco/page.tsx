import type { Metadata } from "next";
import Link from "next/link";
import { Diamante } from "@/components/Diamante";
import { Insignia } from "@/components/Insignia";
import { Simbolo } from "@/components/Logo";
import { arteFixa, creditoArte, srcArte } from "@/lib/artes";

// Esboço do programa de apoiadores, guardado para quando o programa for lançado.
// Fica fora dos buscadores; a página pública /apoie mostra o "Em breve".
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Seja apoiador (esboço)",
  description:
    "Apoie a Liga Fim de Turno todo mês e ganhe brindes exclusivos, insígnia no perfil e voz nas decisões da liga.",
};

// Esboço: valores, metas e brindes ainda serão definidos
const MENSAL = 19.9;
const ANUAL = 199;
const META = {
  atual: 23,
  alvo: 50,
  premio: "uma final de trimestre presencial em São Paulo",
};

const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DESTINOS = [
  {
    titulo: "Circuito o ano todo",
    texto:
      "Etapas toda semana, finais de trimestre e a grande final do Player of the Year.",
  },
  {
    titulo: "Site e ferramentas",
    texto:
      "Servidor, banco de dados, ranking, decks e tudo que mantém o portal no ar.",
  },
  {
    titulo: "Conteúdo aberto",
    texto:
      "Guias, metagame e relatórios de etapa continuam gratuitos para todo mundo.",
  },
  {
    titulo: "Encontros presenciais",
    texto: "Finais e eventos em lojas parceiras, com estrutura e brindes.",
  },
];

const PLANOS = [
  {
    id: "mensal",
    nome: "Apoiador mensal",
    preco: reais(MENSAL),
    periodo: "/mês",
    nota: "Cancele quando quiser",
    destaque: false,
    itens: [
      "Insígnia de apoiador no seu perfil",
      "Cargo e canal exclusivo no Discord",
      "Seu nome no mural de apoiadores",
      "Vote nos próximos cubos, formatos e pautas do blog",
      "Deck box da liga a partir do 3º mês",
    ],
  },
  {
    id: "anual",
    nome: "Apoiador anual",
    preco: reais(ANUAL),
    periodo: "/ano",
    nota: `Equivale a ${reais(ANUAL / 12)}/mês · 2 meses de presente`,
    destaque: true,
    itens: [
      "Tudo do plano mensal",
      "Kit de boas-vindas com deck box na hora",
      "Playmat exclusivo da temporada",
      "Tokens e marcadores da liga",
      "Insígnia dourada de apoiador anual",
    ],
  },
];

const BRINDES = [
  { id: "deckbox", nome: "Deck box", plano: "Mensal e anual" },
  { id: "playmat", nome: "Playmat da temporada", plano: "Anual" },
  { id: "tokens", nome: "Tokens e marcadores", plano: "Anual" },
  { id: "adesivos", nome: "Adesivos", plano: "Mensal e anual" },
];

const PERGUNTAS = [
  {
    p: "Como funciona a cobrança?",
    r: "Pelo Mercado Pago, no cartão ou no Pix, todo mês ou uma vez por ano. Você acompanha e cancela a assinatura na Minha área.",
  },
  {
    p: "Posso cancelar quando quiser?",
    r: "Sim. O apoio para no fim do período já pago e os brindes que você já recebeu são seus.",
  },
  {
    p: "Como recebo os brindes?",
    r: "Enviamos pelos Correios para o endereço que você informar. O kit anual sai na confirmação do pagamento; o deck box do plano mensal, a partir do 3º mês.",
  },
  {
    p: "Quem não apoia perde alguma coisa?",
    r: "Não. Eventos, ranking, decks e artigos continuam abertos para todos. O apoio mantém a liga crescendo e dá reconhecimento a quem ajuda.",
  },
  {
    p: "O apoio vira premiação?",
    r: "O apoio cobre a estrutura do circuito. A premiação das etapas continua vindo das inscrições, como diz o regulamento.",
  },
];

const APOIADORES = [
  "Infinity420",
  "manaflare",
  "TolarianKid",
  "Guardiã",
  "pauperzinho",
  "Drafteira",
  "Rolo",
  "moxdepedra",
  "Kiko",
  "Bel",
  "tapdown",
  "LeoMTG",
];

export default function Apoie() {
  const arte = arteFixa("apoie", "geral");
  const progresso = Math.round((META.atual / META.alvo) * 100);

  return (
    <>
      {/* Topo */}
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcArte(arte)}
          alt=""
          style={{ objectPosition: arte.foco }}
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/30" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-ciano">
            <Diamante /> Seja apoiador
          </span>
          <h1 className="titulo max-w-3xl text-6xl sm:text-7xl">
            A liga existe porque a comunidade joga. E cresce porque ela apoia.
          </h1>
          <p className="max-w-xl text-lg text-texto2">
            Com um apoio mensal ou anual você mantém o circuito rodando, ganha
            brindes exclusivos da liga e ajuda a decidir o que vem a seguir.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#planos"
              className="inline-flex min-h-12 items-center rounded-lg bg-azul px-6 font-semibold text-white no-underline hover:bg-azul-escuro"
            >
              Ver planos
            </a>
            <a
              href="#brindes"
              className="inline-flex min-h-12 items-center rounded-lg px-6 font-semibold text-gelo no-underline ring-1 ring-borda-forte hover:ring-ciano"
            >
              Conhecer os brindes
            </a>
          </div>
        </div>
        <span className="absolute bottom-2 right-4 hidden text-[11px] text-white/50 sm:block">
          {creditoArte(arte)}
        </span>
      </section>

      {/* Meta da comunidade */}
      <section className="border-b border-borda bg-fundo2">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:gap-10">
          <p className="shrink-0 text-sm text-texto2">
            <strong className="titulo text-4xl text-gelo">{META.atual}</strong>{" "}
            de {META.alvo} apoiadores
          </p>
          <div className="flex flex-1 flex-col gap-2">
            <div
              className="h-2.5 overflow-hidden rounded-full bg-borda"
              role="progressbar"
              aria-valuenow={progresso}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-azul to-ciano"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="text-sm text-cinza">
              Próxima meta: <span className="text-gelo">{META.premio}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-6 py-20">
        {/* Para onde vai */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="titulo text-4xl sm:text-5xl">
              Para onde vai o seu apoio
            </h2>
            <p className="text-texto2">
              Tudo o que é aberto continua aberto. O apoio paga a estrutura e
              deixa a liga ir mais longe.
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-md bg-borda ring-1 ring-borda sm:grid-cols-2 lg:grid-cols-4">
            {DESTINOS.map((d, i) => (
              <li key={d.titulo} className="flex flex-col gap-3 bg-grafite p-6">
                <span className="titulo text-5xl text-azul">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold">{d.titulo}</h3>
                <p className="text-sm text-texto2">{d.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Planos */}
        <section id="planos" className="flex scroll-mt-24 flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="titulo text-4xl sm:text-5xl">Escolha como apoiar</h2>
            <p className="text-texto2">
              Os dois planos têm os mesmos benefícios na comunidade. O anual sai
              mais em conta e vem com o kit completo.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {PLANOS.map((p) => (
              <article
                key={p.id}
                className={`relative flex flex-col gap-6 rounded-xl p-8 ring-1 ${p.destaque ? "bg-gradient-to-b from-azul/20 to-grafite ring-azul" : "bg-grafite ring-borda"}`}
              >
                {p.destaque && (
                  <span className="absolute -top-3 left-8 rounded bg-alerta px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-preto">
                    Mais completo
                  </span>
                )}
                <header className="flex flex-col gap-2">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Diamante
                      className={p.destaque ? "text-alerta" : "text-ciano"}
                    />{" "}
                    {p.nome}
                  </h3>
                  <p>
                    <span className="titulo text-6xl">{p.preco}</span>
                    <span className="text-cinza">{p.periodo}</span>
                  </p>
                  <p className="text-sm text-texto2">{p.nota}</p>
                </header>
                <ul className="flex flex-1 flex-col gap-3">
                  {p.itens.map((i) => (
                    <li key={i} className="flex gap-3 text-texto2">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        className="mt-0.5 shrink-0 text-ciano"
                        aria-hidden="true"
                      >
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                      {i}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled
                    className={`min-h-12 rounded-lg font-semibold ${p.destaque ? "bg-azul text-white" : "text-gelo ring-1 ring-borda-forte"} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {p.destaque
                      ? "Assinar o plano anual"
                      : "Assinar o plano mensal"}
                  </button>
                  <span className="text-center text-xs text-cinza">
                    Assinaturas abrem em breve · pagamento pelo Mercado Pago
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Brindes */}
        <section id="brindes" className="flex scroll-mt-24 flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="titulo text-4xl sm:text-5xl">Brindes da liga</h2>
            <p className="text-texto2">
              Feitos com a identidade da Liga Fim de Turno, só para apoiadores.
              Os modelos finais saem a cada temporada.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BRINDES.map((b) => (
              <li
                key={b.id}
                className="flex flex-col overflow-hidden rounded-md bg-grafite ring-1 ring-borda"
              >
                <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_50%_40%,#16203a,#06070a)]">
                  <Brinde tipo={b.id} />
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <span className="font-semibold">{b.nome}</span>
                  <span className="text-xs uppercase tracking-wider text-cinza">
                    {b.plano}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Reconhecimento */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="titulo text-4xl sm:text-5xl">Seu apoio aparece</h2>
            <p className="text-texto2">
              Apoiadores ganham uma insígnia no perfil público, ao lado dos
              títulos e conquistas, e o losango ao lado do nick em toda a liga:
              no ranking, nos resultados e no Discord.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Insignia
                insignia={{
                  id: "apoio-m",
                  titulo: "Apoiador",
                  texto: "Apoia a liga todo mês",
                  nivel: "azul",
                  icone: "diamante",
                }}
              />
              <Insignia
                insignia={{
                  id: "apoio-a",
                  titulo: "Apoiador anual",
                  texto: "Apoia a liga na temporada inteira",
                  nivel: "ouro",
                  icone: "diamante",
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl bg-grafite p-6 ring-1 ring-borda">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-cinza">
              Mural de apoiadores
            </h3>
            <ul className="flex flex-wrap gap-2">
              {APOIADORES.map((n, i) => (
                <li
                  key={n}
                  className="inline-flex items-center gap-2 rounded-full bg-preto py-1 pl-1 pr-3 text-sm ring-1 ring-borda"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-azul text-[11px] font-bold">
                    {n.charAt(0).toUpperCase()}
                  </span>
                  {n}
                  <Diamante
                    tamanho={11}
                    className={i % 3 === 0 ? "text-alerta" : "text-ciano"}
                  />
                </li>
              ))}
            </ul>
            <p className="text-xs text-cinza">
              Losango dourado: apoiador anual.
            </p>
          </div>
        </section>

        {/* Perguntas */}
        <section className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <h2 className="titulo text-4xl sm:text-5xl">Perguntas frequentes</h2>
          <div className="flex flex-col border-t border-borda">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="group border-b border-borda py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q.p}
                  <span className="text-xl text-ciano transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pt-3 text-texto2">{q.r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Chamada final */}
        <section className="flex flex-col items-center gap-5 rounded-xl bg-gradient-to-br from-azul/25 via-grafite to-grafite px-6 py-14 text-center ring-1 ring-borda">
          <Simbolo tamanho={56} />
          <h2 className="titulo max-w-2xl text-4xl sm:text-5xl">
            Passe a vez para a próxima temporada com a gente
          </h2>
          <a
            href="#planos"
            className="inline-flex min-h-12 items-center rounded-lg bg-azul px-6 font-semibold text-white no-underline hover:bg-azul-escuro"
          >
            Quero apoiar
          </a>
          <Link href="/circuito" className="text-sm">
            Conheça o circuito
          </Link>
        </section>
      </div>
    </>
  );
}

/** Ilustrações simples dos brindes com a marca da liga (sem arte de cartas). */
function Brinde({ tipo }: { tipo: string }) {
  if (tipo === "deckbox")
    return (
      <div className="relative h-28 w-24 rounded-md bg-gradient-to-br from-[#1b2a52] to-[#0b1124] shadow-[0_10px_30px_rgba(0,0,0,.6)] ring-1 ring-azul/60">
        <div className="absolute inset-x-0 top-0 h-7 rounded-t-md border-b border-azul/50 bg-[#22345f]" />
        <div className="absolute inset-0 top-7 grid place-items-center">
          <Simbolo tamanho={36} />
        </div>
      </div>
    );
  if (tipo === "playmat")
    return (
      <div className="relative h-24 w-[85%] -rotate-3 overflow-hidden rounded-lg bg-[linear-gradient(120deg,#0d1a3a,#2e6bff_55%,#5cc8ff)] shadow-[0_10px_30px_rgba(0,0,0,.6)]">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_18px,rgba(255,255,255,.05)_18px_19px)]" />
        <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
          <Simbolo tamanho={22} />
          <span className="titulo text-lg text-white">Fim de Turno · 2027</span>
        </div>
      </div>
    );
  if (tipo === "tokens")
    return (
      <div className="flex">
        {[-10, 0, 10].map((r, i) => (
          <div
            key={r}
            className="-mx-2 grid h-24 w-16 place-items-center rounded-md bg-gradient-to-b from-gelo to-[#c9d2e0] text-preto shadow-[0_8px_20px_rgba(0,0,0,.5)] ring-2 ring-[#0b1124]"
            style={{
              transform: `rotate(${r}deg) translateY(${i === 1 ? -6 : 0}px)`,
            }}
          >
            <span className="titulo text-2xl">{["1/1", "+1", "2/2"][i]}</span>
          </div>
        ))}
      </div>
    );
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-16 w-16 rotate-[-8deg] place-items-center rounded-full bg-azul shadow-lg">
        <Diamante tamanho={28} className="text-white" />
      </span>
      <span className="rotate-6 rounded-lg bg-gelo px-3 py-2 text-preto shadow-lg">
        <span className="titulo text-xl">Passe a vez.</span>
      </span>
    </div>
  );
}
