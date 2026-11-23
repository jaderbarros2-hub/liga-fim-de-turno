import { NomeJogador } from "@/components/Jogador";
import { porRodada } from "@/lib/partidas";

type PartidaPublica = {
  rodada: number;
  fase: string;
  rotulo: string | null;
  mesa: number | null;
  jogador_a: string;
  jogador_b: string | null;
  vitorias_a: number;
  vitorias_b: number;
  empates: number;
};

/** Histórico do evento: cada rodada com quem jogou contra quem e o placar. Vencedor em destaque. */
export function Rodadas({ partidas }: { partidas: PartidaPublica[] }) {
  if (!partidas.length) return null;
  const grupos = porRodada(partidas);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="titulo text-2xl">Rodadas</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {grupos.map((g) => (
          <div
            key={g.rodada}
            className={`rounded-md ring-1 ${g.partidas[0]?.fase === "eliminatoria" ? "bg-vermelho/10 ring-vermelho/50" : "bg-grafite ring-borda"}`}
          >
            <p className="border-b border-borda px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-brasa">
              {g.rotulo}
            </p>
            <ul className="flex flex-col">
              {g.partidas.map((p, i) => {
                const aVenceu = p.vitorias_a > p.vitorias_b;
                const bVenceu = p.vitorias_b > p.vitorias_a;
                return (
                  <li
                    key={i}
                    className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-borda/60 px-4 py-2.5 text-sm last:border-0"
                  >
                    <NomeJogador
                      nick={p.jogador_a}
                      className={`truncate ${aVenceu ? "font-semibold text-marfim" : "text-texto2"}`}
                    />
                    <span className="rounded bg-preto/60 px-2 py-0.5 text-center font-semibold tabular-nums">
                      {p.jogador_b
                        ? `${p.vitorias_a}–${p.vitorias_b}${p.empates ? `–${p.empates}` : ""}`
                        : "bye"}
                    </span>
                    {p.jogador_b ? (
                      <NomeJogador
                        nick={p.jogador_b}
                        className={`truncate text-right ${bVenceu ? "font-semibold text-marfim" : "text-texto2"}`}
                      />
                    ) : (
                      <span />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
