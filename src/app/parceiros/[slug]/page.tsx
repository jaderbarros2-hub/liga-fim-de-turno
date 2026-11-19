import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListaEventos } from "@/components/Eventos";
import { LocalDaLoja } from "@/components/Loja";
import { arteFixa, creditoArte, srcArte } from "@/lib/artes";
import { eventosDaLoja, type LojaEvento } from "@/lib/dados";
import { linkInstagram, linkWhatsapp } from "@/lib/lojas";
import { linkRastreado } from "@/lib/parceiros";
import {
  criarClienteServidor,
  supabaseConfigurado,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Loja = LojaEvento & {
  descricao: string | null;
  foto_url: string | null;
  site_url: string | null;
  sede_eventos: boolean;
  aceita_credito: boolean;
  compra_deck: boolean;
  bonus_credito_pct: number;
  instrucoes_credito: string | null;
  mesas: number | null;
};

async function buscarLoja(slug: string): Promise<Loja | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("parceiros")
    .select("*")
    .eq("slug", slug)
    .eq("ativo", true)
    .maybeSingle();
  return (data as Loja | null) ?? null;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const loja = await buscarLoja((await params).slug);
  if (!loja) return { title: "Loja parceira" };
  return {
    title: loja.nome,
    description:
      loja.descricao ?? `${loja.nome}, loja parceira da Liga Fim de Turno.`,
  };
}

export default async function PaginaLoja({ params }: Props) {
  const { slug } = await params;
  const loja = await buscarLoja(slug);
  if (!loja) notFound();
  const { proximos, passados } = await eventosDaLoja(loja.id);
  const arte = arteFixa(loja.id, "geral");
  const temEndereco = Boolean(loja.logradouro && loja.cidade);
  const insta = linkInstagram(loja.instagram);
  const zap = linkWhatsapp(loja.whatsapp);
  const botao =
    "inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-semibold no-underline";

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={loja.foto_url ?? srcArte(arte)}
          alt=""
          style={loja.foto_url ? undefined : { objectPosition: arte.foco }}
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/30" />
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-16">
          <Link href="/parceiros" className="text-sm">
            ← Parceiros
          </Link>
          <div className="flex flex-wrap items-center gap-5">
            {loja.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={loja.logo_url}
                alt=""
                className="h-20 w-20 rounded-lg bg-white object-contain p-2"
              />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-lg bg-azul text-4xl font-bold">
                {loja.nome.charAt(0)}
              </span>
            )}
            <div className="flex flex-col gap-1">
              <h1 className="titulo text-5xl sm:text-6xl">{loja.nome}</h1>
              <span className="text-texto2">
                {[loja.bairro, [loja.cidade, loja.uf].filter(Boolean).join("/")]
                  .filter(Boolean)
                  .join(" · ") || "Loja online"}
              </span>
            </div>
          </div>
          {loja.descricao && (
            <p className="max-w-2xl text-lg text-texto2">{loja.descricao}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {[
              loja.sede_eventos && "Eventos presenciais",
              loja.aceita_credito &&
                `Resgate de prêmios${loja.bonus_credito_pct ? ` +${loja.bonus_credito_pct}%` : ""}`,
              loja.compra_deck && "Vende cartas",
            ]
              .filter(Boolean)
              .map((r) => (
                <span
                  key={r as string}
                  className="rounded bg-azul/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-ciano"
                >
                  {r}
                </span>
              ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(loja.site_url || insta) && (
              <a
                href={linkRastreado({
                  parceiro: loja.id,
                  origem: "logo",
                  pagina: `/parceiros/${slug}`,
                })}
                target="_blank"
                rel="noopener"
                className={`${botao} bg-azul text-white hover:bg-azul-escuro hover:text-white`}
              >
                {loja.site_url ? "Visitar o site" : "Ver no Instagram"}
              </a>
            )}
            {insta && loja.site_url && (
              <a
                href={insta}
                target="_blank"
                rel="noopener"
                className={`${botao} text-gelo ring-1 ring-borda-forte hover:text-gelo hover:ring-ciano`}
              >
                Instagram
              </a>
            )}
            {zap && (
              <a
                href={zap}
                target="_blank"
                rel="noopener"
                className={`${botao} text-gelo ring-1 ring-borda-forte hover:text-gelo hover:ring-ciano`}
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
        {!loja.foto_url && (
          <span className="absolute bottom-2 right-4 hidden text-[11px] text-white/50 sm:block">
            {creditoArte(arte)}
          </span>
        )}
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-14">
        {temEndereco && (
          <section className="flex flex-col gap-4">
            <h2 className="titulo text-4xl">Onde fica</h2>
            <LocalDaLoja loja={loja} comNome={false} />
            {loja.mesas && (
              <p className="text-sm text-cinza">
                Espaço para jogo: {loja.mesas} mesas.
              </p>
            )}
          </section>
        )}

        {loja.sede_eventos && (
          <section className="flex flex-col gap-4">
            <h2 className="titulo text-4xl">Próximos eventos aqui</h2>
            <ListaEventos
              eventos={proximos}
              vazio="Nenhum evento presencial marcado nesta loja por enquanto. Fique de olho na agenda."
            />
          </section>
        )}

        {loja.aceita_credito && (
          <section className="grid gap-6 rounded-md bg-grafite p-6 ring-1 ring-borda md:grid-cols-[1fr_1.2fr] md:p-8">
            <div className="flex flex-col gap-3">
              <h2 className="titulo text-4xl">Use seus prêmios aqui</h2>
              <p className="text-texto2">
                Troque o saldo da sua Carteira por crédito na {loja.nome}
                {loja.bonus_credito_pct ? (
                  <>
                    {" "}
                    com{" "}
                    <strong className="text-ciano">
                      +{loja.bonus_credito_pct}% de bônus
                    </strong>
                  </>
                ) : null}
                .
              </p>
              <Link
                href="/minha-area?aba=carteira"
                className={`${botao} self-start bg-azul text-white hover:bg-azul-escuro hover:text-white`}
              >
                Resgatar na Carteira
              </Link>
            </div>
            <ol className="flex flex-col gap-3 text-sm text-texto2">
              {[
                `Tenha cadastro e login na ${loja.nome}.`,
                "Na sua Carteira, escolha a loja, o valor e informe a sua conta na loja.",
                "A liga faz o Pix para a loja e a loja gera o crédito em até 2 dias úteis.",
                loja.instrucoes_credito ??
                  "Você recebe o código do resgate por e-mail.",
              ].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="titulo grid h-7 w-7 shrink-0 place-items-center rounded-full bg-azul text-base text-white">
                    {i + 1}
                  </span>
                  <span className="pt-1">{t}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {passados.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="titulo text-4xl">Já aconteceu aqui</h2>
            <ListaEventos eventos={passados} />
          </section>
        )}
      </div>
    </>
  );
}
