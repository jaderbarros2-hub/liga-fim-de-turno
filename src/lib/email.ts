import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * E-mails do portal pelo Resend (https://resend.com).
 * Sem RESEND_API_KEY, nada é enviado: o e-mail fica registrado como "simulado" no Painel → E-mails.
 * Conta gratuita sem domínio verificado só entrega para o e-mail do dono da conta (remetente onboarding@resend.dev).
 */

export const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://liga-fim-de-turno.vercel.app"
).replace(/\/$/, "");
export const EMAIL_CONTATO = process.env.EMAIL_CONTATO || process.env.NEXT_PUBLIC_EMAIL_CONTATO || "";
const REMETENTE =
  process.env.EMAIL_REMETENTE || "Liga Fim de Turno <onboarding@resend.dev>";

export type Conteudo = {
  titulo: string;
  previa?: string; // linha que aparece na caixa de entrada
  paragrafos: string[]; // aceita **negrito**
  detalhes?: [string, string][]; // tabela rótulo → valor
  codigo?: { rotulo: string; valor: string };
  botao?: { texto: string; url: string };
  aviso?: string; // caixa de destaque (ex.: prazo, regra)
};

const escapar = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const negrito = (s: string) =>
  escapar(s).replace(
    /\*\*(.+?)\*\*/g,
    '<strong style="color:#eef2f8">$1</strong>',
  );

const C = {
  fundo: "#06070a",
  cartao: "#10141c",
  borda: "#1e2533",
  texto: "#eef2f8",
  texto2: "#c9d2e0",
  cinza: "#9aa6b8",
  azul: "#2e6bff",
  ciano: "#5cc8ff",
};
const FONTE = "Inter,Segoe UI,Helvetica,Arial,sans-serif";
const TITULO = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";

/** HTML com o visual da liga (tabelas e estilos em linha, que é o que os clientes de e-mail entendem). */
export function montarEmail(c: Conteudo): { html: string; texto: string } {
  const p = c.paragrafos
    .map(
      (t) =>
        `<p style="margin:0 0 16px;font:16px/1.6 ${FONTE};color:${C.texto2}">${negrito(t)}</p>`,
    )
    .join("");
  const detalhes = c.detalhes?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border:1px solid ${C.borda};border-radius:8px;border-collapse:separate">${c.detalhes
        .map(
          ([r, v], i) =>
            `<tr><td style="padding:12px 16px;font:13px ${FONTE};color:${C.cinza};${i ? `border-top:1px solid ${C.borda};` : ""}">${escapar(r)}</td><td align="right" style="padding:12px 16px;font:600 14px ${FONTE};color:${C.texto};${i ? `border-top:1px solid ${C.borda};` : ""}">${escapar(v)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const codigo = c.codigo
    ? `<div style="margin:8px 0 20px;padding:16px;border:1px dashed ${C.ciano};border-radius:8px;text-align:center"><div style="font:600 12px ${FONTE};letter-spacing:2px;text-transform:uppercase;color:${C.cinza}">${escapar(c.codigo.rotulo)}</div><div style="margin-top:6px;font:700 30px ${TITULO};letter-spacing:3px;color:${C.ciano}">${escapar(c.codigo.valor)}</div></div>`
    : "";
  const aviso = c.aviso
    ? `<div style="margin:4px 0 20px;padding:14px 16px;border-left:4px solid ${C.azul};background:#0b0e14;font:14px/1.5 ${FONTE};color:${C.texto2}">${negrito(c.aviso)}</div>`
    : "";
  const botao = c.botao
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px"><tr><td style="border-radius:8px;background:${C.azul}"><a href="${escapar(c.botao.url)}" style="display:inline-block;padding:14px 24px;font:600 15px ${FONTE};color:#ffffff;text-decoration:none">${escapar(c.botao.texto)}</a></td></tr></table>`
    : "";
  const contato = EMAIL_CONTATO
    ? `Dúvidas? Responda este e-mail ou escreva para <a href="mailto:${escapar(EMAIL_CONTATO)}" style="color:${C.ciano}">${escapar(EMAIL_CONTATO)}</a>.`
    : "Dúvidas? Responda este e-mail.";

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${escapar(c.titulo)}</title></head>
<body style="margin:0;padding:0;background:${C.fundo}">
<div style="display:none;max-height:0;overflow:hidden">${escapar(c.previa ?? c.titulo)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fundo}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 0 20px"><a href="${SITE}" style="text-decoration:none"><img src="${SITE}/email/logo.png" width="36" height="36" alt="" style="vertical-align:middle;border:0"><span style="margin-left:10px;vertical-align:middle;font:700 22px ${TITULO};letter-spacing:.5px;text-transform:uppercase;color:${C.texto}">Liga Fim de Turno</span></a></td></tr>
<tr><td style="background:${C.cartao};border:1px solid ${C.borda};border-radius:12px;padding:32px 28px">
<h1 style="margin:0 0 20px;font:700 34px/1.05 ${TITULO};text-transform:uppercase;color:${C.texto}">${escapar(c.titulo)}</h1>
${p}${detalhes}${codigo}${aviso}${botao}
</td></tr>
<tr><td style="padding:20px 4px;font:12px/1.6 ${FONTE};color:${C.cinza}">${contato}<br>Liga Fim de Turno · <a href="${SITE}" style="color:${C.cinza}">${SITE.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;

  const texto = [
    c.titulo,
    "",
    ...c.paragrafos.map((t) => t.replace(/\*\*/g, "")),
    ...(c.detalhes ?? []).map(([r, v]) => `${r}: ${v}`),
    c.codigo ? `${c.codigo.rotulo}: ${c.codigo.valor}` : "",
    c.aviso ? c.aviso.replace(/\*\*/g, "") : "",
    c.botao ? `${c.botao.texto}: ${c.botao.url}` : "",
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
  return { html, texto };
}

/** Envia e registra. Nunca lança erro: falha de e-mail não pode travar pagamento, saque ou inscrição. */
export async function enviarEmail(e: {
  para: string | null | undefined;
  assunto: string;
  conteudo: Conteudo;
  tipo: string;
  jogadorId?: string | null;
  referencia?: string | null;
}) {
  if (!e.para) return { ok: false as const, erro: "sem destinatário" };
  const { html, texto } = montarEmail(e.conteudo);
  // Remove espaços, quebras de linha e aspas que costumam vir junto ao colar a chave na Vercel
  const chave = process.env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, "");
  let status: "enviado" | "falhou" | "simulado" = "simulado";
  let erro: string | null = null;
  let idExterno: string | null = null;

  if (chave) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${chave}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: REMETENTE,
          to: [e.para],
          subject: e.assunto,
          html,
          text: texto,
          ...(EMAIL_CONTATO ? { reply_to: EMAIL_CONTATO } : {}),
        }),
      });
      const corpo = (await r.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
      };
      if (r.ok) {
        status = "enviado";
        idExterno = corpo.id ?? null;
      } else {
        status = "falhou";
        erro = corpo.message ?? `HTTP ${r.status}`;
      }
    } catch (x) {
      status = "falhou";
      erro = x instanceof Error ? x.message : "erro de rede";
    }
  }

  await criarClienteAdmin()
    .from("emails")
    .insert({
      para: e.para,
      assunto: e.assunto,
      tipo: e.tipo,
      status,
      erro,
      id_externo: idExterno,
      jogador_id: e.jogadorId ?? null,
      referencia: e.referencia ?? null,
    })
    .then(
      () => null,
      () => null,
    );
  return status === "falhou"
    ? { ok: false as const, erro }
    : { ok: true as const, status };
}
