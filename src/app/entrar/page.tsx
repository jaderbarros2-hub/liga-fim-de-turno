import type { Metadata } from "next";
import Link from "next/link";
import { EtiquetaLiga } from "@/components/Eventos";
import { capaDoEvento, creditoArte, sortearArtes, srcArte } from "@/lib/artes";
import { buscarEvento } from "@/lib/dados";
import { dataLonga, hora } from "@/lib/formato";
import { BotaoDiscord } from "./BotaoDiscord";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

const LIBERA = [
  {
    titulo: "Inscrição com Pix",
    texto: "Confirmação automática e o link do evento no Endstep na hora.",
  },
  {
    titulo: "Seus decks",
    texto: "Cadastre listas, escolha o arquétipo e acompanhe o metagame.",
  },
  {
    titulo: "Ranking e prêmios",
    texto: "Seus pontos no circuito e os prêmios pagos na sua chave Pix.",
  },
];

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ voltar?: string; erro?: string }>;
}) {
  const { voltar, erro } = await searchParams;
  const destino =
    voltar && voltar.startsWith("/") && !voltar.startsWith("//")
      ? voltar
      : "/minha-area";

  // Veio do botão de inscrição? Mostra o evento ao lado do login.
  const slug = destino.match(/^\/eventos\/([^/?]+)/)?.[1];
  const evento = slug ? await buscarEvento(slug) : null;
  const [arte] = sortearArtes(
    evento?.formato === "pauper" ? "pauper" : "geral",
    1,
    true,
  );
  const fundo = evento
    ? capaDoEvento(evento)
    : { src: srcArte(arte), foco: arte.foco, credito: creditoArte(arte) };

  return (
    <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Arte como atmosfera, não como quadro: ocupa a tela, escurecida e puxada para o vermelho da marca */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fundo.src}
        alt=""
        style={{ objectPosition: fundo.foco }}
        className="hero-zoom absolute inset-0 -z-30 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-preto via-preto/75 to-vermelho/20" />
      <div
        aria-hidden="true"
        className="absolute -right-40 top-0 -z-10 hidden h-full w-[58%] -skew-x-12 border-l-[6px] border-vermelho bg-preto/65 backdrop-blur-[2px] lg:block"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-14 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        {/* Lado da liga */}
        <div className="flex flex-col gap-6">
          <span className="text-sm font-semibold uppercase tracking-widest text-brasa">
            First Strike
          </span>
          <h1 className="titulo text-6xl leading-[0.9] sm:text-8xl">
            Quem bate primeiro
            <br />
            <span className="text-brasa">joga com vantagem.</span>
          </h1>
          {evento ? (
            <Link
              href={`/eventos/${evento.slug}`}
              className="flex max-w-md flex-col gap-2 rounded-md bg-grafite/80 p-4 text-marfim no-underline ring-1 ring-vermelho backdrop-blur hover:text-marfim"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-cinza">
                Você está se inscrevendo em
              </span>
              <span className="titulo text-3xl">{evento.titulo}</span>
              <span className="flex flex-wrap items-center gap-3 text-sm text-texto2">
                <EtiquetaLiga evento={evento} />
                {dataLonga(evento.inicio)} · {hora(evento.inicio)}
              </span>
            </Link>
          ) : (
            <p className="max-w-md text-lg text-texto2">
              Navegar é livre. A conta entra em cena quando você quer jogar:
              inscrição, deck, pontos e prêmio.
            </p>
          )}
          <ul className="hidden max-w-md flex-col gap-4 sm:flex">
            {LIBERA.map((l) => (
              <li key={l.titulo} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45 bg-vermelho" />
                <span className="flex flex-col">
                  <span className="font-semibold">{l.titulo}</span>
                  <span className="text-sm text-texto2">{l.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Painel de entrada */}
        <div className="relative flex flex-col gap-6 bg-grafite/90 p-8 ring-1 ring-borda backdrop-blur [clip-path:polygon(0_0,calc(100%-2.5rem)_0,100%_2.5rem,100%_100%,2.5rem_100%,0_calc(100%-2.5rem))] sm:p-10">
          <div className="flex flex-col gap-2">
            <h2 className="titulo text-5xl">Entrar</h2>
            <p className="text-texto2">
              A liga usa o Discord como conta. É lá que saem os avisos e o
              suporte nos dias de etapa.
            </p>
          </div>

          {erro && (
            <p
              role="alert"
              className="border-l-2 border-erro bg-erro/10 p-3 text-sm text-erro"
            >
              Não foi possível entrar. Tente de novo.
            </p>
          )}

          <BotaoDiscord destino={destino} />

          <ol className="grid grid-cols-3 gap-2 border-t border-borda pt-5 text-center text-xs text-texto2">
            {[
              "Entre com o Discord",
              "Complete o cadastro",
              evento ? "Gere o Pix" : "Escolha a etapa",
            ].map((p, i) => (
              <li key={p} className="flex flex-col items-center gap-1.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-vermelho/20 font-bold text-brasa ring-1 ring-vermelho/50">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ol>

          <p className="text-sm text-texto2">
            Primeira vez? A conta é criada no primeiro acesso. Sem Discord?{" "}
            <a
              href="https://discord.com/register"
              target="_blank"
              rel="noopener"
            >
              Crie grátis em um minuto
            </a>
            .
          </p>
          <p className="text-xs text-cinza">
            Ao continuar, você concorda com os{" "}
            <Link href="/termos">Termos de uso</Link> e a{" "}
            <Link href="/privacidade">Política de privacidade</Link>. A liga não
            recebe a sua senha do Discord.
          </p>
        </div>
      </div>

      <span className="absolute bottom-3 left-6 text-[11px] text-white/45">
        {fundo.credito}
      </span>
    </section>
  );
}
