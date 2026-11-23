/** Utilitários do perfil público que também rodam no navegador. */

export const linkJogador = (nick: string) =>
  `/jogadores/${encodeURIComponent(nick)}`;

export const REDES = [
  { id: "twitch", nome: "Twitch", base: "https://twitch.tv/" },
  { id: "youtube", nome: "YouTube", base: "https://youtube.com/@" },
  { id: "instagram", nome: "Instagram", base: "https://instagram.com/" },
  { id: "x", nome: "X", base: "https://x.com/" },
  { id: "tiktok", nome: "TikTok", base: "https://tiktok.com/@" },
] as const;

export type Redes = Partial<Record<(typeof REDES)[number]["id"], string>>;

/** Aceita @usuario, usuario ou o link completo e guarda só o usuário. */
export function usuarioDaRede(valor: string) {
  const v = valor.trim();
  if (!v) return "";
  const semLink = v
    .replace(/^https?:\/\/(www\.)?[^/]+\/(@)?/i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
  return /^[A-Za-z0-9._-]{2,40}$/.test(semLink) ? semLink : "";
}
