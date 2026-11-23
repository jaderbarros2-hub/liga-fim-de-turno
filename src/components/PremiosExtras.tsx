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
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-dashed border-[#ffc24a]/60 bg-[#ffc24a]/5 px-4 py-2.5 text-sm"
        >
          <span className="font-bold uppercase tracking-wider text-[#ffc24a]">
            + Bônus
          </span>
          <span className="text-texto2">
            <span className="font-semibold text-marfim">{p.descricao}</span>{" "}
            {p.parceiro?.slug ? (
              <>
                na{" "}
                <Link
                  href={`/parceiros/${p.parceiro.slug}`}
                  className="text-[#ffc24a] hover:text-[#ffd57f]"
                >
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
            <span className="font-semibold text-[#ffc24a]">
              · Ganhador:{" "}
              {p.jogador?.nick_endstep || p.jogador?.nome || "jogador"}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
