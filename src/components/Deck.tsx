/**
 * Cartas desenhadas pela liga para representar o deck nos eventos construídos
 * (o equivalente ao leque de boosters do Limited). Não reproduz a moldura oficial:
 * só uma silhueta de carta com a ilustração, o nome e o crédito do artista.
 */
import type { ArteBanco } from "@/lib/artes";
import { srcArte } from "@/lib/artes";

type Estilo = "classica" | "moderna";

export function CartaDesenhada({
  arte,
  estilo,
  largura = 150,
}: {
  arte: ArteBanco;
  estilo: Estilo;
  largura?: number;
}) {
  const classica = estilo === "classica";
  return (
    <div
      className="relative isolate flex shrink-0 flex-col overflow-hidden rounded-[6%/4.3%] p-[5%] shadow-2xl shadow-preto"
      style={{
        width: largura,
        aspectRatio: "63 / 88",
        background: classica
          ? "linear-gradient(160deg,#2a241c,#120f0b)"
          : "linear-gradient(160deg,#1d2230,#0b0d14)",
      }}
    >
      <div
        className={`flex flex-1 flex-col gap-[4%] rounded-[3%] p-[4%] ${
          classica ? "bg-[#cbbd9c]/90" : "bg-[#3b4256]"
        }`}
      >
        <span
          className={`truncate rounded-[2px] px-[5%] py-[2%] font-semibold leading-none ${
            classica
              ? "bg-[#e8dcc0] text-[#1b160f]"
              : "bg-[#d9dde6] text-[#0d1018]"
          }`}
          style={{ fontSize: Math.max(7, largura * 0.07) }}
          title={arte.carta ?? undefined}
        >
          {arte.carta}
        </span>
        <div className="relative aspect-[5/4] overflow-hidden rounded-[2px] ring-1 ring-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={srcArte(arte)}
            alt=""
            loading="lazy"
            style={{ objectPosition: arte.foco }}
            className="h-full w-full object-cover"
          />
        </div>
        {/* Caixa de texto: só linhas, sem texto de regras */}
        <div
          className={`flex flex-1 flex-col justify-center gap-[9%] rounded-[2px] px-[7%] ${
            classica ? "bg-[#e8dcc0]" : "bg-[#d9dde6]"
          }`}
        >
          <span className="h-[5%] min-h-[2px] w-[85%] rounded bg-black/20" />
          <span className="h-[5%] min-h-[2px] w-[70%] rounded bg-black/20" />
          <span className="h-[5%] min-h-[2px] w-[78%] rounded bg-black/20" />
        </div>
        <span
          className={`truncate leading-none ${classica ? "text-[#1b160f]/70" : "text-white/60"}`}
          style={{ fontSize: Math.max(6, largura * 0.05) }}
        >
          Ilus. {arte.artista}
        </span>
      </div>
    </div>
  );
}

/** Quatro cartas em leque, como uma mão aberta. Abre um pouco ao passar o mouse. */
export function LequeCartas({
  artes,
  estilo,
}: {
  artes: ArteBanco[];
  estilo: Estilo;
}) {
  const n = artes.length;
  const largura = 140;
  return (
    <div
      className="leque flex justify-center pb-8 pt-14"
      aria-label="Cartas do formato"
    >
      {artes.map((a, i) => {
        const meio = i - (n - 1) / 2;
        const fechado = `rotate(${meio * 8}deg) translateY(${Math.abs(meio) * 10}px)`;
        const aberto = `rotate(${meio * 11}deg) translateY(${Math.abs(meio) * 14 - 8}px)`;
        return (
          <div
            key={a.arquivo}
            style={{
              transform: fechado,
              ["--abre" as string]: aberto,
              marginLeft: i ? -largura * 0.42 : 0,
              zIndex: 10 - Math.abs(Math.round(meio)),
            }}
          >
            <CartaDesenhada arte={a} estilo={estilo} largura={largura} />
          </div>
        );
      })}
    </div>
  );
}

/** Selo de onde o evento acontece: Endstep (ícone neutro) ou a loja. */
export function SeloLocal({
  presencial,
  loja,
}: {
  presencial: boolean;
  loja?: { nome: string; logo_url: string | null } | null;
}) {
  return (
    <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-preto/80 px-3 py-1.5 text-xs font-semibold text-gelo ring-1 ring-borda-forte backdrop-blur">
      {presencial && loja?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={loja.logo_url}
          alt=""
          className="h-4 w-4 rounded-sm object-contain"
        />
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="text-ciano"
        >
          <rect
            x="2.5"
            y="4"
            width="19"
            height="13"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 21h8M12 17v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      {presencial
        ? loja?.nome
          ? `Na ${loja.nome}`
          : "Presencial"
        : "Jogado no Endstep"}
    </span>
  );
}
