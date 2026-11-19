/** Utilitários de lojas e parceiros que também rodam no navegador. */

export type Endereco = {
  nome?: string;
  logradouro: string | null;
  numero: string | null;
  complemento?: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep?: string | null;
  mapa_url?: string | null;
};

/** "Rua X, 123 - Sala 2 · Bairro · Cidade/UF" */
export function enderecoLinha(l: Endereco) {
  const rua =
    [l.logradouro, l.numero].filter(Boolean).join(", ") +
    (l.complemento ? ` - ${l.complemento}` : "");
  const cidade = [l.cidade, l.uf].filter(Boolean).join("/");
  return [rua, l.bairro, cidade].filter(Boolean).join(" · ");
}

const consulta = (l: Endereco) =>
  [
    l.nome,
    [l.logradouro, l.numero].filter(Boolean).join(" "),
    l.bairro,
    l.cidade,
    l.uf,
    l.cep,
  ]
    .filter(Boolean)
    .join(", ");

/** Link do Google Maps: o colado no cadastro ou montado a partir do endereço. */
export const linkMapa = (l: Endereco) =>
  l.mapa_url ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta(l))}`;
export const linkRota = (l: Endereco) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(consulta(l))}`;
/** Mapa embutido (sem chave de API). */
export const mapaEmbutido = (l: Endereco) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(consulta(l))}&z=16&output=embed`;

export const usuarioInstagram = (v: string | null) =>
  v
    ? v
        .trim()
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .split(/[/?#]/)[0]
    : "";
export const linkInstagram = (v: string | null) =>
  usuarioInstagram(v) ? `https://instagram.com/${usuarioInstagram(v)}` : null;
export const linkWhatsapp = (v: string | null) => {
  const d = (v ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return `https://wa.me/${d.length <= 11 ? `55${d}` : d}`;
};

export const IDENTIFICACAO: Record<string, string> = {
  email: "E-mail da sua conta na loja",
  cpf: "CPF cadastrado na loja",
  usuario: "Usuário da sua conta na loja",
};

export const slugLoja = (nome: string) =>
  nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "loja";
