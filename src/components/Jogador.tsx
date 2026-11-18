import Link from "next/link";
import { linkJogador } from "@/lib/perfil";

/** Foto do jogador (do Discord) ou a inicial do nick. */
export function FotoJogador({
  nick,
  avatar,
  tamanho = 28,
}: {
  nick: string;
  avatar: string | null;
  tamanho?: number;
}) {
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatar}
        alt=""
        width={tamanho}
        height={tamanho}
        className="shrink-0 rounded-full object-cover"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }
  const cores = [
    "#2e6bff",
    "#1f8a70",
    "#8a4fff",
    "#c2410c",
    "#0e7490",
    "#be185d",
  ];
  let h = 0;
  for (const c of nick) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: tamanho,
        height: tamanho,
        fontSize: tamanho * 0.42,
        background: cores[h % cores.length],
      }}
    >
      {nick.trim().charAt(0).toUpperCase()}
    </span>
  );
}

/** Nick clicável que leva ao perfil público do jogador */
export function NomeJogador({
  nick,
  className = "",
}: {
  nick: string;
  className?: string;
}) {
  return (
    <Link
      href={linkJogador(nick)}
      className={`text-inherit no-underline hover:text-ciano hover:underline ${className}`}
    >
      {nick}
    </Link>
  );
}
