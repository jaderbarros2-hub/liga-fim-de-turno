import Link from "next/link";
import { Etiqueta } from "@/components/Botao";
import { capaPequena } from "@/lib/artesPequenas";
import type { Evento } from "@/lib/dados";
import { dataCurta, hora, NOMES_FORMATO } from "@/lib/formato";
import { ehConstruido } from "@/lib/formatos";

export function EtiquetaLiga({ evento }: { evento: Evento }) {
  return (
    <Etiqueta tipo={ehConstruido(evento.formato) ? "destaque" : "marfim"}>
      {ehConstruido(evento.formato)
        ? NOMES_FORMATO[evento.formato]
        : `${NOMES_FORMATO[evento.formato]}${evento.colecao ? ` · ${evento.colecao}` : ""}`}
    </Etiqueta>
  );
}

/** Cartão de evento com a arte da liga no topo e a etiqueta encostada na imagem. */
export async function CartaoEvento({ evento }: { evento: Evento }) {
  const capa = await capaPequena(evento);
  return (
    <Link
      href={`/eventos/${evento.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-grafite text-marfim no-underline ring-1 ring-borda transition hover:ring-brasa"
    >
      <div className="relative aspect-[16/8] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capa.src}
          alt=""
          loading="lazy"
          style={{ objectPosition: capa.foco }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-grafite via-grafite/10 to-transparent" />
        <span className="absolute bottom-3 left-4">
          <EtiquetaLiga evento={evento} />
        </span>
        <span
          className="absolute right-3 top-2 text-[10px] text-white/60"
          title={capa.credito}
        >
          {capa.artista}
        </span>
        {(evento.colecao_info?.icone_svg || evento.cubo_info) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={evento.colecao_info?.icone_svg ?? "/icone-cubo.svg"}
            alt=""
            className="absolute bottom-3 right-4 h-7 w-7 invert drop-shadow"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-5 pt-3">
        <span className="text-sm font-semibold text-brasa">
          {dataCurta(evento.inicio)} · {hora(evento.inicio)}
        </span>
        <span className="titulo text-2xl">{evento.titulo}</span>
        <span className="mt-auto flex items-center justify-between gap-3 pt-3 text-sm text-texto2">
          <span
            className="min-w-0 truncate"
            title={evento.loja?.nome ?? undefined}
          >
            {evento.modalidade === "online"
              ? "Online · Endstep"
              : `Presencial${evento.loja?.cidade ? ` · ${evento.loja.cidade}` : ""}`}
          </span>
          <span className="shrink-0 whitespace-nowrap font-semibold text-marfim group-hover:text-brasa">
            {evento.status === "aberto" ? "Inscrever-se →" : "Ver evento →"}
          </span>
        </span>
      </div>
    </Link>
  );
}

export function ListaEventos({
  eventos,
  vazio,
}: {
  eventos: Evento[];
  vazio?: string;
}) {
  if (eventos.length === 0) {
    return (
      <p className="border-l-2 border-vermelho py-2 pl-4 text-texto2">
        {vazio ??
          "A próxima etapa ainda não foi aberta. Os avisos saem primeiro no Discord da liga."}
      </p>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {eventos.map((e) => (
        <CartaoEvento key={e.id} evento={e} />
      ))}
    </div>
  );
}
