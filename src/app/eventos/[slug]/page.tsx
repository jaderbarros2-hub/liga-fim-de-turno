import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoLink, Etiqueta } from "@/components/Botao";
import { EtiquetaLiga } from "@/components/Eventos";
import { AcaoEvento } from "@/components/AcaoEvento";
import { buscarEvento, listarInscritos, listarResultados, premioEstimado } from "@/lib/dados";
import { dataCurta, dataLonga, hora, NOMES_FORMATO, NOMES_STATUS, reais } from "@/lib/formato";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ aba?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const evento = await buscarEvento(slug);
  return { title: evento?.titulo ?? "Evento" };
}

const ABAS = [
  { id: "detalhes", rotulo: "Detalhes" },
  { id: "inscritos", rotulo: "Inscritos" },
  { id: "resultados", rotulo: "Resultados" },
];

export default async function PaginaEvento({ params, searchParams }: Props) {
  const { slug } = await params;
  const { aba = "detalhes" } = await searchParams;
  const evento = await buscarEvento(slug);
  if (!evento) notFound();

  const [inscritos, resultados] = await Promise.all([listarInscritos(evento.id), listarResultados(evento.id)]);
  const pauper = evento.liga.slug === "pauper";

  return (
    <>
      <section className="border-b border-borda bg-fundo2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-8 px-6 py-10">
          <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
            <Link href="/eventos" className="text-sm">
              ← Agenda
            </Link>
            <div className="flex flex-wrap gap-2">
              <EtiquetaLiga evento={evento} />
              <Etiqueta tipo="contorno">{evento.modalidade === "online" ? "Online · Endstep" : "Presencial"}</Etiqueta>
              <Etiqueta tipo={evento.status === "cancelado" ? "alerta" : "contorno"}>{NOMES_STATUS[evento.status]}</Etiqueta>
            </div>
            <h1 className="titulo text-5xl sm:text-6xl">{evento.titulo}</h1>
            <p className="text-lg text-texto2">
              {dataLonga(evento.inicio)} · {hora(evento.inicio)} (horário de Brasília)
              {evento.modalidade === "presencial" && evento.local ? ` · ${evento.local}` : ""}
            </p>
          </div>
          <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 rounded-xl border border-borda bg-grafite p-6">
            <Linha rotulo="Inscrição" valor={reais(evento.valor_centavos)} />
            <Linha rotulo="Prêmio estimado" valor={reais(premioEstimado(evento, inscritos.length))} destaque />
            <Linha
              rotulo="Inscritos"
              valor={`${inscritos.length}${evento.vagas ? ` de ${evento.vagas}` : ""} · mínimo ${evento.minimo}`}
            />
            <Linha rotulo="Inscrições até" valor={`${dataCurta(evento.inscricoes_ate)}, ${hora(evento.inscricoes_ate)}`} />
            <AcaoEvento evento={evento} totalInscritos={inscritos.length} />
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <nav aria-label="Abas do evento" className="flex flex-wrap gap-7 border-b border-borda text-sm font-semibold">
          {ABAS.map((a) => (
            <Link
              key={a.id}
              href={`/eventos/${evento.slug}?aba=${a.id}`}
              aria-current={aba === a.id ? "page" : undefined}
              className={`py-4 no-underline ${aba === a.id ? "border-b-2 border-azul text-gelo" : "text-cinza"}`}
            >
              {a.rotulo}
              {a.id === "inscritos" ? ` (${inscritos.length})` : ""}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap gap-10 py-10">
          <div className="min-w-0 flex-[999_1_560px]">
            {aba === "inscritos" && (
              <ul className="flex flex-col border-t border-borda">
                {inscritos.length === 0 && <li className="py-4 text-texto2">Ainda não há inscrições confirmadas.</li>}
                {inscritos.map((i, n) => (
                  <li key={n} className="border-b border-borda py-3">
                    {i.nick_endstep || i.discord_nome}
                  </li>
                ))}
              </ul>
            )}

            {aba === "resultados" && (
              resultados.length === 0 ? (
                <p className="text-texto2">Os resultados aparecem aqui depois do evento.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-borda">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead className="text-left text-cinza">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Jogador</th>
                        <th className="p-3">Pontos</th>
                        <th className="p-3">V-E-D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((r) => (
                        <tr key={r.posicao} className="border-t border-borda">
                          <td className="p-3 font-semibold text-ciano">{r.posicao}</td>
                          <td className="p-3">{r.nick_endstep}</td>
                          <td className="p-3">{r.pontos}</td>
                          <td className="p-3">
                            {r.vitorias}-{r.empates}-{r.derrotas}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {aba === "detalhes" && (
              <div className="conteudo-texto">
                <h2>Formato</h2>
                <p>
                  {pauper
                    ? "Pauper, partidas melhor de 3 com sideboard. Rodadas suíças com todos os inscritos: 3 rodadas com 8 jogadores, 4 rodadas com 9 ou mais. Deck registrado no Endstep até o início."
                    : `${NOMES_FORMATO[evento.formato]}${evento.colecao ? ` · ${evento.colecao}` : ""}. Pods de 6 a 8 jogadores, 3 rodadas suíças melhor de 3 dentro de cada pod. Deck mínimo de 40 cartas.`}
                </p>
                <h2>Como funciona a noite</h2>
                <p>
                  Depois da confirmação do Pix, você recebe o link privado do evento no Endstep. O check-in é feito
                  lá até 10 minutos antes do início; emparelhamentos e rodadas acontecem no próprio Endstep.
                </p>
                <h2>Premiação</h2>
                <p>
                  {evento.percentual_premio}% das inscrições formam o prêmio, pago por Pix em até 48 horas
                  {pauper ? " conforme a classificação final." : " conforme a campanha (3-0 vale 3 cotas, 2-1 vale 1 cota)."}{" "}
                  Com menos de {evento.minimo} inscritos o evento é cancelado e cada inscrito escolhe reembolso ou crédito.
                </p>
                {evento.detalhes && (
                  <>
                    <h2>Informações da organização</h2>
                    <p className="whitespace-pre-line">{evento.detalhes}</p>
                  </>
                )}
                <p>
                  <Link href="/regras">Regulamento completo</Link>
                </p>
              </div>
            )}
          </div>
          <aside className="flex min-w-0 flex-[1_1_260px] flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-xl border border-borda bg-grafite p-5">
              <span className="font-semibold">Primeira vez?</span>
              <span className="text-sm text-texto2">Veja como criar a conta no Endstep e entrar no evento.</span>
              <BotaoLink href="/como-jogar" variante="texto" className="justify-start">
                Como jogar
              </BotaoLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-borda pb-3 text-sm">
      <span className="text-cinza">{rotulo}</span>
      <span className={`font-semibold ${destaque ? "text-ciano" : ""}`}>{valor}</span>
    </div>
  );
}
