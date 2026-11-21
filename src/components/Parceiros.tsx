import Link from "next/link";
import {
  bannerPara,
  linkRastreado,
  listarParceiros,
  type Banner,
  type Posicao,
} from "@/lib/parceiros";

/** Faixa de logos das lojas parceiras, em cinza e colorindo ao passar o mouse. */
export async function FaixaParceiros() {
  const parceiros = (await listarParceiros()).filter(
    (p) => p.logo_url && p.mostrar_logo,
  );
  return (
    <section aria-label="Parceiros da liga" className="border-t border-borda">
      <h2 className="px-6 pt-10 text-center text-xs font-bold uppercase tracking-[0.2em] text-cinza">
        Lojas e empresas que apoiam a liga
      </h2>
      {parceiros.length === 0 ? (
        <div className="mx-auto max-w-6xl px-6 pt-5">
          <Link
            href="/parceiros#anuncie"
            className="flex items-center justify-center rounded-lg border border-dashed border-borda-forte py-6 text-sm font-semibold text-cinza no-underline hover:border-ciano hover:text-gelo"
          >
            Sua loja aqui · apoie a Liga Fim de Turno
          </Link>
        </div>
      ) : (
        <div className="relative overflow-hidden py-6 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <ul
            className={`flex w-max items-center gap-14 px-7 ${parceiros.length > 4 ? "faixa-rolando" : "mx-auto"}`}
          >
            {(parceiros.length > 4
              ? [...parceiros, ...parceiros]
              : parceiros
            ).map((p, i) => (
              <li
                key={`${p.id}-${i}`}
                aria-hidden={i >= parceiros.length || undefined}
              >
                <a
                  href={linkRastreado({
                    parceiro: p.id,
                    origem: "logo",
                    pagina: "/",
                  })}
                  title={p.nome}
                  tabIndex={i >= parceiros.length ? -1 : 0}
                  className="block opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo_url!}
                    alt={p.nome}
                    className="h-12 w-auto max-w-40 object-contain"
                    loading="lazy"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="pb-10 text-center">
        <Link href="/parceiros" className="text-sm font-semibold">
          Seja parceiro →
        </Link>
      </p>
    </section>
  );
}

/** Faixa de anúncio de parceiro, com espaço reservado (sem anúncio, convida a anunciar). */
export async function BannerPatrocinado({
  posicao,
  pagina,
  coluna = false,
}: {
  posicao: Posicao;
  pagina: string;
  /** Versão alta para a coluna lateral dos artigos. */
  coluna?: boolean;
}) {
  const banner = await bannerPara(posicao);
  if (coluna) return <BannerColuna banner={banner} pagina={pagina} />;
  if (!banner) {
    return (
      <Link
        href="/parceiros#anuncie"
        className="flex min-h-24 items-center justify-center rounded-lg bg-[repeating-linear-gradient(135deg,var(--color-grafite)_0_14px,var(--color-fundo2)_14px_28px)] px-6 text-center text-sm font-semibold text-cinza no-underline ring-1 ring-borda hover:text-gelo hover:ring-ciano"
      >
        Anuncie aqui para jogadores de Magic · conheça os planos de parceria
      </Link>
    );
  }
  return (
    <a
      href={linkRastreado({
        parceiro: banner.parceiro_id,
        banner: banner.id,
        origem: "banner",
        pagina,
      })}
      rel="sponsored noopener"
      target="_blank"
      className="group relative flex min-h-24 items-center gap-5 overflow-hidden rounded-lg bg-grafite px-6 py-4 text-gelo no-underline ring-1 ring-borda hover:ring-ciano"
    >
      {banner.imagem_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.imagem_url}
          alt=""
          className="absolute inset-0 -z-0 h-full w-full object-cover opacity-40 transition group-hover:opacity-55"
        />
      )}
      <span className="absolute right-3 top-2 z-10 rounded bg-preto/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cinza">
        Patrocinado
      </span>
      {banner.parceiro?.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.parceiro.logo_url}
          alt={banner.parceiro.nome}
          className="relative z-10 h-12 w-auto max-w-32 object-contain"
        />
      )}
      <span className="relative z-10 flex flex-1 flex-col">
        <span className="text-lg font-semibold">{banner.titulo}</span>
        {banner.texto && (
          <span className="text-sm text-texto2">{banner.texto}</span>
        )}
      </span>
      <span className="relative z-10 hidden text-sm font-semibold text-ciano sm:block">
        Ver na loja →
      </span>
    </a>
  );
}

function BannerColuna({
  banner,
  pagina,
}: {
  banner: Banner | null;
  pagina: string;
}) {
  if (!banner) {
    return (
      <Link
        href="/parceiros#anuncie"
        className="flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-md bg-[repeating-linear-gradient(135deg,var(--color-grafite)_0_14px,var(--color-fundo2)_14px_28px)] p-6 text-center text-cinza no-underline ring-1 ring-borda hover:text-gelo hover:ring-ciano"
      >
        <span className="titulo text-3xl text-gelo">Sua loja aqui</span>
        <span className="text-sm">
          Anuncie para quem joga Magic toda semana
        </span>
        <span className="text-sm font-semibold text-ciano">
          Conheça os planos →
        </span>
      </Link>
    );
  }
  return (
    <a
      href={linkRastreado({
        parceiro: banner.parceiro_id,
        banner: banner.id,
        origem: "banner",
        pagina,
      })}
      rel="sponsored noopener"
      target="_blank"
      className="group relative isolate flex aspect-[3/4] flex-col items-center justify-end gap-3 overflow-hidden rounded-md bg-grafite p-5 text-center text-gelo no-underline ring-1 ring-borda hover:text-gelo hover:ring-ciano"
    >
      {banner.imagem_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.imagem_url}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-preto via-preto/60 to-transparent" />
      <span className="absolute right-2 top-2 rounded bg-preto/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cinza">
        Patrocinado
      </span>
      {banner.parceiro?.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.parceiro.logo_url}
          alt={banner.parceiro.nome}
          className="h-10 w-auto max-w-36 object-contain"
        />
      )}
      <span className="text-lg font-bold leading-tight">{banner.titulo}</span>
      {banner.texto && (
        <span className="text-sm text-texto2">{banner.texto}</span>
      )}
      <span className="rounded bg-white px-4 py-2 text-sm font-semibold text-preto">
        Ver na loja
      </span>
    </a>
  );
}
