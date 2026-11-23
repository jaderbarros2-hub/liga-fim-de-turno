import Link from "next/link";
import { EtiquetaLiga } from "@/components/Eventos";
import { capaPequena } from "@/lib/artesPequenas";
import type { Evento } from "@/lib/dados";
import { hora } from "@/lib/formato";

const FUSO = "America/Sao_Paulo";
const parte = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Date(iso)
    .toLocaleDateString("pt-BR", { timeZone: FUSO, ...o })
    .replace(".", "");

const mesDe = (iso: string) => {
  const t = parte(iso, { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const local = (e: Evento) =>
  e.modalidade === "presencial"
    ? `Presencial${e.loja?.nome ? ` · ${e.loja.nome}` : ""}${e.loja?.cidade ? `, ${e.loja.cidade}` : ""}`
    : "Online · Endstep";

/** Agenda em lista: eventos agrupados por mês, com data em destaque e miniatura da arte. */
export async function ListaAgenda({ eventos }: { eventos: Evento[] }) {
  const capas = await Promise.all(eventos.map((e) => capaPequena(e)));
  const meses: {
    mes: string;
    itens: { e: Evento; capa: (typeof capas)[number] }[];
  }[] = [];
  eventos.forEach((e, i) => {
    const mes = mesDe(e.inicio);
    const grupo =
      meses.at(-1)?.mes === mes
        ? meses.at(-1)!
        : (meses.push({ mes, itens: [] }), meses.at(-1)!);
    grupo.itens.push({ e, capa: capas[i] });
  });

  return (
    <div className="flex flex-col gap-10">
      {meses.map((m) => (
        <section key={m.mes} className="flex flex-col">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cinza">
            {m.mes}
          </h2>
          <ul className="flex flex-col divide-y divide-borda rounded-lg ring-1 ring-borda">
            {m.itens.map(({ e, capa }) => (
              <li key={e.id}>
                <Link
                  href={`/eventos/${e.slug}`}
                  className="group grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 px-4 py-3 text-marfim no-underline transition hover:bg-grafite sm:grid-cols-[3.5rem_8rem_1fr_auto]"
                >
                  {/* Data */}
                  <span className="flex flex-col items-center leading-none">
                    <span className="text-[11px] font-bold uppercase text-cinza">
                      {parte(e.inicio, { weekday: "short" })}
                    </span>
                    <span className="titulo text-2xl">
                      {parte(e.inicio, { day: "2-digit" })}
                    </span>
                    <span className="text-[11px] font-bold uppercase text-brasa">
                      {hora(e.inicio)}
                    </span>
                  </span>
                  {/* Arte */}
                  <span className="relative hidden aspect-[16/9] overflow-hidden rounded-md ring-1 ring-borda sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capa.src}
                      alt=""
                      loading="lazy"
                      style={{ objectPosition: capa.foco }}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </span>
                  {/* Evento */}
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <EtiquetaLiga evento={e} />
                    </span>
                    <span className="truncate text-lg font-semibold group-hover:text-brasa">
                      {e.titulo}
                    </span>
                    <span className="truncate text-sm text-texto2">
                      {local(e)}
                      {e.vagas ? ` · ${e.vagas} vagas` : ""}
                    </span>
                  </span>
                  {/* Ação */}
                  <span
                    className={`hidden whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold sm:inline-flex ${
                      e.status === "aberto"
                        ? "bg-vermelho text-white group-hover:bg-vermelho-escuro"
                        : "text-texto2 ring-1 ring-borda-forte"
                    }`}
                  >
                    {e.status === "aberto" ? "Inscrever-se" : "Ver evento"}
                  </span>
                  <span className="text-brasa sm:hidden">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
