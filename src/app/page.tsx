import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { EtiquetaLiga, ListaEventos } from "@/components/Eventos";
import { listarEventosEncerrados, listarInscritos, listarProximosEventos } from "@/lib/dados";
import { dataLonga, dataCurta, hora, reais } from "@/lib/formato";

export const dynamic = "force-dynamic";

const PASSOS = [
  { n: "01", titulo: "Crie sua conta", texto: "Entre com o Discord e informe seu nick do Endstep e sua chave Pix." },
  { n: "02", titulo: "Inscreva-se e pague no Pix", texto: "A confirmação chega na hora, com o link privado do evento." },
  { n: "03", titulo: "Jogue no Endstep", texto: "Faça o check-in pelo link e jogue. Resultado e prêmio aparecem aqui depois." },
];

export default async function Inicio() {
  const [proximos, encerrados] = await Promise.all([listarProximosEventos(5), listarEventosEncerrados(3)]);
  const destaque = proximos[0];
  const inscritos = destaque ? await listarInscritos(destaque.id) : [];

  return (
    <>
      <section className="border-b border-borda bg-fundo2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-6 py-16">
          <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-5">
            <span className="text-sm font-semibold tracking-[0.2em] text-ciano">
              {destaque ? "PRÓXIMA ETAPA" : "LIGA DE MAGIC ONLINE"}
            </span>
            <h1 className="titulo text-6xl sm:text-7xl">
              {destaque ? destaque.titulo : "Pauper e Limited toda semana"}
            </h1>
            <p className="max-w-xl text-lg text-texto2">
              {destaque
                ? `${dataLonga(destaque.inicio)}, ${hora(destaque.inicio)}. Online no Endstep, sem precisar ter as cartas. Inscrição de ${reais(destaque.valor_centavos)} e prêmio em Pix.`
                : "Etapas semanais jogadas no Endstep, com inscrição pelo Pix, prêmios para as melhores campanhas e ranking por temporada."}
            </p>
            <div className="flex flex-wrap gap-3">
              {destaque ? (
                <BotaoLink href={`/eventos/${destaque.slug}`}>Inscrever-se</BotaoLink>
              ) : (
                <BotaoLink href="/eventos">Ver agenda</BotaoLink>
              )}
              <BotaoLink href="/como-jogar" variante="contorno">
                Como jogar
              </BotaoLink>
            </div>
          </div>
          {destaque && (
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-xl border border-borda bg-grafite p-6">
              <span className="text-xs font-semibold tracking-widest text-cinza">RESUMO DA ETAPA</span>
              <EtiquetaLiga evento={destaque} />
              <Linha rotulo="Inscritos" valor={`${inscritos.length}${destaque.vagas ? ` de ${destaque.vagas}` : ""} · mínimo ${destaque.minimo}`} />
              <Linha rotulo="Inscrição" valor={reais(destaque.valor_centavos)} />
              <Linha rotulo="Premiação" valor={`${destaque.percentual_premio}% das inscrições`} destaque />
              <Linha rotulo="Inscrições até" valor={`${dataCurta(destaque.inscricoes_ate)}, ${hora(destaque.inscricoes_ate)}`} />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="titulo text-5xl">Próximos eventos</h2>
          <Link href="/eventos" className="text-sm font-semibold">
            Ver agenda completa
          </Link>
        </div>
        <ListaEventos eventos={proximos} />
      </section>

      <section className="border-y border-borda bg-fundo2">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold tracking-[0.2em] text-ciano">COMO JOGAR</span>
            <h2 className="titulo text-5xl">Do cadastro à mesa em três passos</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {PASSOS.map((p) => (
              <div key={p.n} className="flex flex-col gap-2 rounded-xl border border-borda bg-grafite p-6">
                <span className="titulo text-4xl text-azul">{p.n}</span>
                <span className="text-lg font-semibold">{p.titulo}</span>
                <span className="text-texto2">{p.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-14 md:grid-cols-2">
        <CardLiga
          slug="pauper"
          nome="Liga Pauper"
          texto="Só cartas comuns, decks acessíveis e jogo competitivo toda semana. Rodadas suíças e premiação por classificação."
          cor="border-t-azul"
        />
        <CardLiga
          slug="limited"
          nome="Liga Limited"
          texto="Draft, selado e cubo em pods de até 8 jogadores, com prêmio por campanha."
          cor="border-t-ciano"
        />
      </section>

      {encerrados.length > 0 && (
        <section className="border-t border-borda bg-fundo2">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14">
            <h2 className="titulo text-5xl">Últimos resultados</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {encerrados.map((e) => (
                <Link
                  key={e.id}
                  href={`/eventos/${e.slug}`}
                  className="flex flex-col gap-2 rounded-xl border border-borda bg-grafite p-5 text-gelo no-underline hover:border-ciano"
                >
                  <span className="text-xs font-semibold tracking-widest text-ciano">{dataCurta(e.inicio)}</span>
                  <span className="font-semibold">{e.titulo}</span>
                  <span className="text-sm text-cinza">Ver classificação</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl bg-azul p-8">
          <div className="flex max-w-xl flex-col gap-2">
            <h2 className="titulo text-4xl text-white">Entre na comunidade</h2>
            <p className="text-white">Avisos, conversa sobre decks e suporte nos dias de evento ficam no Discord da liga.</p>
          </div>
          <BotaoLink href="/contato" variante="contorno" className="bg-preto">
            Entrar no Discord
          </BotaoLink>
        </div>
      </section>
    </>
  );
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-borda pb-3 text-sm last:border-0">
      <span className="text-cinza">{rotulo}</span>
      <span className={`font-semibold ${destaque ? "text-ciano" : ""}`}>{valor}</span>
    </div>
  );
}

function CardLiga({ slug, nome, texto, cor }: { slug: string; nome: string; texto: string; cor: string }) {
  return (
    <div className={`flex flex-col gap-3 rounded-xl border border-borda border-t-4 ${cor} bg-grafite p-8`}>
      <h2 className="titulo text-4xl">{nome}</h2>
      <p className="text-texto2">{texto}</p>
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href={`/ligas/${slug}`}>Próximas etapas</Link>
        <Link href="/regras">Regras da liga</Link>
      </div>
    </div>
  );
}
