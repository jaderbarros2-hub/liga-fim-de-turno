import Link from "next/link";
import { criterioTexto, type PremioParceiro } from "@/lib/premiosParceiros";

const ICONE: Record<string, string> = {
  cupom: "Cupom",
  booster: "Booster",
  brinde: "Brinde",
};

/** Prêmios extras das lojas parceiras na página do evento (e quem ganhou, depois do resultado). */
export function PremiosExtras({
  premios,
  mostrarGanhador = false,
}: {
  premios: PremioParceiro[];
  mostrarGanhador?: boolean;
}) {
  if (!premios.length) return null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="titulo text-3xl">Prêmios extras</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-cinza">
          Oferecidos por lojas parceiras
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {premios.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-4 rounded-md bg-grafite p-4 ring-1 ring-borda"
          >
            {p.parceiro?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.parceiro.logo_url}
                alt={p.parceiro.nome}
                className="h-12 w-16 shrink-0 rounded bg-white/5 object-contain p-1"
              />
            ) : (
              <span className="grid h-12 w-16 shrink-0 place-items-center rounded bg-azul/15 text-xs font-bold text-ciano">
                {ICONE[p.tipo]}
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold">{p.descricao}</span>
              <span className="text-sm text-texto2">
                {criterioTexto(p)} ·{" "}
                {p.parceiro?.slug ? (
                  <Link href={`/parceiros/${p.parceiro.slug}`}>
                    {p.parceiro.nome}
                  </Link>
                ) : (
                  p.parceiro?.nome
                )}
              </span>
              {mostrarGanhador && p.entregue_em && (
                <span className="text-sm font-semibold text-ciano">
                  Ganhador:{" "}
                  {p.jogador?.nick_endstep || p.jogador?.nome || "jogador"}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
