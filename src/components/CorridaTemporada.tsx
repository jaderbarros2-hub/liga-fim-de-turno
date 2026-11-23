import Link from "next/link";
import { FotoJogador, NomeJogador } from "@/components/Jogador";
import { periodo, ranking, temporadasDisponiveis } from "@/lib/circuito";
import { LIGAS } from "@/lib/formatos";

/** Prévia do ranking na home: top 5 de cada liga na temporada atual (ou na mais recente). */
export async function CorridaTemporada() {
  const temporadas = await temporadasDisponiveis();
  const atual = periodo(new Date().toISOString()).temporada;
  const temporada = temporadas.includes(atual)
    ? atual
    : (temporadas[0] ?? atual);
  const tabelas = await Promise.all(
    LIGAS.map(async (l) => ({
      ...l,
      linhas: (await ranking(l.slug, temporada).catch(() => [])).slice(0, 5),
    })),
  );

  return (
    <section className="border-t border-borda">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="titulo text-4xl">Corrida da temporada</h2>
            <p className="mt-1 text-texto2">
              Os cinco primeiros de cada liga em {temporada}. Cada etapa jogada
              soma pontos.
            </p>
          </div>
          <Link href="/ranking" className="text-sm font-semibold">
            Ranking completo →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {tabelas.map((t) => (
            <div
              key={t.slug}
              className="flex flex-col rounded-lg bg-grafite ring-1 ring-borda"
            >
              <div className="flex items-baseline justify-between border-b border-borda px-5 py-4">
                <h3 className="titulo text-2xl">{t.nome}</h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-cinza">
                  Pontos
                </span>
              </div>
              {t.linhas.length ? (
                <ol className="flex flex-col">
                  {t.linhas.map((l) => (
                    <li
                      key={l.chave}
                      className="flex items-center gap-3 border-b border-borda/60 px-5 py-3 last:border-0"
                    >
                      <span
                        className={`w-6 text-center text-sm font-bold ${l.posicao === 1 ? "text-brasa" : "text-cinza"}`}
                      >
                        {l.posicao}
                      </span>
                      <FotoJogador
                        nick={l.nick}
                        avatar={l.avatar}
                        tamanho={32}
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <NomeJogador
                          nick={l.nick}
                          className="truncate text-sm font-semibold"
                        />
                        <span className="text-xs text-cinza">
                          {l.etapas} {l.etapas === 1 ? "etapa" : "etapas"}
                          {l.titulos
                            ? ` · ${l.titulos} ${l.titulos === 1 ? "título" : "títulos"}`
                            : ""}
                        </span>
                      </span>
                      <span className="text-lg font-bold tabular-nums">
                        {l.pontos}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="flex flex-1 items-center px-5 py-10 text-sm text-texto2">
                  Ninguém pontuou ainda. A primeira etapa abre a corrida.
                </p>
              )}
              <Link
                href={`/ranking?liga=${t.slug}&temporada=${temporada}`}
                className="mt-auto border-t border-borda px-5 py-3 text-sm font-semibold"
              >
                Ranking {t.nome} →
              </Link>
            </div>
          ))}
        </div>
        <p className="text-sm text-texto2">
          Primeira vez por aqui?{" "}
          <Link href="/como-funciona" className="font-semibold">
            Veja como funcionam os eventos →
          </Link>
        </p>
      </div>
    </section>
  );
}
