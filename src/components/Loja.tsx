import Link from "next/link";
import type { LojaEvento } from "@/lib/dados";
import {
  enderecoLinha,
  linkInstagram,
  linkMapa,
  linkRota,
  linkWhatsapp,
  mapaEmbutido,
} from "@/lib/lojas";

const botao =
  "inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold no-underline";

const Icone = ({ d }: { d: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
const PIN =
  "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z";
const ROTA = "M3 11l18-8-8 18-2-8-8-2Z";

/** Onde fica: mapa embutido, endereço e atalhos (Maps, rota, Instagram, WhatsApp). */
export function LocalDaLoja({
  loja,
  observacao,
  comNome = true,
}: {
  loja: LojaEvento;
  observacao?: string | null;
  comNome?: boolean;
}) {
  const insta = linkInstagram(loja.instagram);
  const zap = linkWhatsapp(loja.whatsapp);
  const end = { ...loja, nome: loja.nome };
  return (
    <div className="grid overflow-hidden rounded-md bg-grafite ring-1 ring-borda md:grid-cols-[1.2fr_1fr]">
      <iframe
        title={`Mapa: ${loja.nome}`}
        src={mapaEmbutido(end)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="aspect-[16/10] h-full w-full border-0 grayscale-[30%] md:aspect-auto md:min-h-72"
      />
      <div className="flex flex-col gap-4 p-6">
        {comNome && (
          <div className="flex items-center gap-3">
            {loja.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={loja.logo_url}
                alt=""
                className="h-11 w-11 rounded bg-white object-contain p-1"
              />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded bg-azul text-lg font-bold">
                {loja.nome.charAt(0)}
              </span>
            )}
            <span className="flex flex-col">
              {loja.slug ? (
                <Link
                  href={`/parceiros/${loja.slug}`}
                  className="text-lg font-semibold text-gelo no-underline hover:text-ciano"
                >
                  {loja.nome}
                </Link>
              ) : (
                <span className="text-lg font-semibold">{loja.nome}</span>
              )}
              <span className="text-xs uppercase tracking-wider text-cinza">
                Loja parceira
              </span>
            </span>
          </div>
        )}
        <p className="flex gap-2 text-texto2">
          <span className="mt-0.5 shrink-0 text-ciano">
            <Icone d={PIN} />
          </span>
          <span>
            {enderecoLinha(loja)}
            {loja.cep && (
              <span className="block text-sm text-cinza">
                CEP {loja.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
              </span>
            )}
          </span>
        </p>
        {observacao && (
          <p className="border-l-2 border-azul pl-3 text-sm text-texto2">
            {observacao}
          </p>
        )}
        {loja.horario && (
          <p className="text-sm text-cinza">Funcionamento: {loja.horario}</p>
        )}
        {loja.observacoes_local && (
          <p className="text-sm text-cinza">{loja.observacoes_local}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2">
          <a
            href={linkMapa(end)}
            target="_blank"
            rel="noopener"
            className={`${botao} bg-azul text-white hover:bg-azul-escuro hover:text-white`}
          >
            <Icone d={PIN} /> Abrir no Google Maps
          </a>
          <a
            href={linkRota(end)}
            target="_blank"
            rel="noopener"
            className={`${botao} text-gelo ring-1 ring-borda-forte hover:text-gelo hover:ring-ciano`}
          >
            <Icone d={ROTA} /> Como chegar
          </a>
          {insta && (
            <a
              href={insta}
              target="_blank"
              rel="noopener"
              className={`${botao} text-gelo ring-1 ring-borda-forte hover:text-gelo hover:ring-ciano`}
            >
              Instagram
            </a>
          )}
          {zap && (
            <a
              href={zap}
              target="_blank"
              rel="noopener"
              className={`${botao} text-gelo ring-1 ring-borda-forte hover:text-gelo hover:ring-ciano`}
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
