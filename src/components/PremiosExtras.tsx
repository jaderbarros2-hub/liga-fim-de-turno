import Link from "next/link";
import type { PremioParceiro } from "@/lib/premiosParceiros";

const ICONE: Record<string, string> = {
  cupom: "Cupom",
  booster: "Booster",
  brinde: "Brinde",
};

/**
 * Prêmio extra das lojas parceiras: uma linha discreta logo abaixo das informações do evento.
 * Depois do resultado, mostra quem ganhou.
 */
export function PremiosExtras({
  premios,
  mostrarGanhador = false,
}: {
  premios: PremioParceiro[];
  mostrarGanhador?: boolean;
}) {
  if (!premios.length) return null;
  return (
    <ul className="flex flex-col gap-2">
      {premios.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-dashed border-ciano/40 px-4 py-2.5 text-sm"
        >
          <span className="font-bold uppercase tracking-wider text-ciano">
            + Bônus
          </span>
          {p.parceiro?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.parceiro.logo_url}
              alt=""
              className="h-5 w-auto max-w-16 object-contain"
            />
          )}
          <span className="text-texto2">
            <span className="font-semibold text-gelo">{p.descricao}</span>{" "}
            {p.parceiro?.slug ? (
              <>
                na{" "}
                <Link href={`/parceiros/${p.parceiro.slug}`}>
                  {p.parceiro.nome}
                </Link>
              </>
            ) : p.parceiro?.nome ? (
              `na ${p.parceiro.nome}`
            ) : null}
            {" · "}
            {p.criterio === "sorteio"
              ? "sorteado entre os participantes"
              : `para o ${p.posicao ?? 1}º lugar`}
          </span>
          {mostrarGanhador && p.entregue_em && (
            <span className="font-semibold text-ciano">
              · Ganhador:{" "}
              {p.jogador?.nick_endstep || p.jogador?.nome || "jogador"}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
