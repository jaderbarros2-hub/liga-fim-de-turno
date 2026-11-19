import "server-only";
import {
  arteFixa,
  capaDoEvento,
  creditoArte,
  type GrupoArte,
} from "@/lib/artes";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * E-mails do portal pelo Resend (https://resend.com).
 * Sem RESEND_API_KEY, nada é enviado: o e-mail fica registrado como "simulado" no Painel → E-mails.
 * Conta gratuita sem domínio verificado só entrega para o e-mail do dono da conta (remetente onboarding@resend.dev).
 */

export const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://liga-fim-de-turno.vercel.app"
).replace(/\/$/, "");
export const EMAIL_CONTATO =
  process.env.EMAIL_CONTATO || process.env.NEXT_PUBLIC_EMAIL_CONTATO || "";
const REMETENTE =
  process.env.EMAIL_REMETENTE || "Liga Fim de Turno <onboarding@resend.dev>";

/**
 * Modo de teste: enquanto não houver domínio verificado no Resend (remetente @resend.dev) ou com
 * EMAIL_TESTE_PARA definido, todo e-mail para outra pessoa (lojas, outros jogadores) é desviado para
 * esse endereço, com uma faixa no topo dizendo para quem ele iria. Assim nada chega a terceiros durante os testes.
 */
export function destinoDeTeste(): string | null {
  const explicito = process.env.EMAIL_TESTE_PARA?.trim();
  if (explicito) return explicito;
  if (REMETENTE.includes("resend.dev"))
    return EMAIL_CONTATO || process.env.EMAIL_ORGANIZACAO || null;
  return null;
}

export type Imagem = { url: string; credito?: string | null };

export type Conteudo = {
  titulo: string;
  previa?: string; // linha que aparece na caixa de entrada
  imagem?: Imagem; // arte no topo (JPG leve em /public/email/artes ou arte da coleção)
  selo?: { texto: string; tom?: "ciano" | "alerta" | "erro" }; // situação: Confirmado, Cancelado…
  destaque?: { valor: string; rotulo: string }; // número principal (valor do prêmio, do crédito…)
  paragrafos: string[]; // aceita **negrito**
  detalhes?: [string, string][]; // rótulo → valor
  codigo?: { rotulo: string; valor: string };
  botao?: { texto: string; url: string };
  aviso?: string; // regra ou prazo importante
  motivo?: string; // linha do rodapé: por que a pessoa recebe este e-mail
};

/** Arte do banco da liga em versão leve para e-mail (sempre a mesma para a mesma chave). */
export function imagemFixa(
  chave: string,
  formato: GrupoArte = "geral",
): Imagem {
  const a = arteFixa(chave, formato);
  return {
    url: `${SITE}/email/artes/${a.arquivo}.jpg`,
    credito: creditoArte(a),
  };
}

/** Capa do evento para e-mail: arte da coleção ou do cubo, senão a arte da etapa em versão leve. */
export function imagemDoEvento(
  evento: Parameters<typeof capaDoEvento>[0],
): Imagem {
  const c = capaDoEvento(evento);
  const local = c.src.match(/^\/artes\/(.+)\.webp$/);
  return {
    url: local ? `${SITE}/email/artes/${local[1]}.jpg` : c.src,
    credito: c.credito,
  };
}

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
  alerta: "#f2b84b",
  erro: "#ff6b6b",
};
const FONTE = "Inter,'Segoe UI',Helvetica,Arial,sans-serif";
const TITULO = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";

/** HTML com o visual da liga: arte no topo, título, número em destaque, detalhes e um botão. */
export function montarEmail(
  c: Conteudo,
  desviadoDe?: string,
): { html: string; texto: string } {
  const imagem = c.imagem
    ? `<tr><td style="padding:0;line-height:0"><img src="${escapar(c.imagem.url)}" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:12px 12px 0 0"></td></tr>`
    : "";
  const tomSelo =
    c.selo?.tom === "erro"
      ? C.erro
      : c.selo?.tom === "alerta"
        ? C.alerta
        : C.ciano;
  const selo = c.selo
    ? `<div style="margin:0 0 14px"><span style="display:inline-block;padding:5px 10px;border-radius:999px;border:1px solid ${tomSelo};font:600 12px ${FONTE};color:${tomSelo}">${escapar(c.selo.texto)}</span></div>`
    : "";
  const destaque = c.destaque
    ? `<div style="margin:4px 0 20px"><div style="font:700 44px/1 ${TITULO};color:${C.ciano}">${escapar(c.destaque.valor)}</div><div style="margin-top:6px;font:14px ${FONTE};color:${C.cinza}">${escapar(c.destaque.rotulo)}</div></div>`
    : "";
  const p = c.paragrafos
    .map(
      (t) =>
        `<p style="margin:0 0 14px;font:16px/1.6 ${FONTE};color:${C.texto2}">${negrito(t)}</p>`,
    )
    .join("");
  const detalhes = c.detalhes?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 22px;border-top:1px solid ${C.borda}">${c.detalhes
        .map(
          ([r, v]) =>
            `<tr><td style="padding:12px 0;border-bottom:1px solid ${C.borda};font:14px ${FONTE};color:${C.cinza}">${escapar(r)}</td><td align="right" style="padding:12px 0 12px 16px;border-bottom:1px solid ${C.borda};font:600 14px ${FONTE};color:${C.texto}">${escapar(v)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const codigo = c.codigo
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr><td align="center" style="padding:16px;border:1px dashed ${C.ciano};border-radius:10px;background:#0b0e14"><div style="font:600 12px ${FONTE};color:${C.cinza}">${escapar(c.codigo.rotulo)}</div><div style="margin-top:6px;font:700 30px ${TITULO};letter-spacing:4px;color:${C.ciano}">${escapar(c.codigo.valor)}</div></td></tr></table>`
    : "";
  const aviso = c.aviso
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr><td style="padding:14px 16px;border-left:4px solid ${C.azul};background:#0b0e14;font:14px/1.55 ${FONTE};color:${C.texto2}">${negrito(c.aviso)}</td></tr></table>`
    : "";
  const botao = c.botao
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 0"><tr><td align="center" style="border-radius:10px;background:${C.azul}"><a href="${escapar(c.botao.url)}" style="display:block;padding:15px 24px;font:700 16px ${FONTE};color:#ffffff;text-decoration:none">${escapar(c.botao.texto)}</a></td></tr></table>`
    : "";
  const credito = c.imagem?.credito
    ? `<div style="margin-top:22px;font:11px ${FONTE};color:#5b6576">Arte: ${escapar(c.imagem.credito)}</div>`
    : "";
  const contato = EMAIL_CONTATO
    ? `Dúvidas? Responda este e-mail ou escreva para <a href="mailto:${escapar(EMAIL_CONTATO)}" style="color:${C.ciano}">${escapar(EMAIL_CONTATO)}</a>.`
    : "Dúvidas? Responda este e-mail.";

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>${escapar(c.titulo)}</title></head>
<body style="margin:0;padding:0;background:${C.fundo}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapar(c.previa ?? c.titulo)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fundo}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
${desviadoDe ? `<tr><td style="padding:0 0 16px"><div style="padding:12px 14px;border:1px dashed ${C.alerta};border-radius:10px;font:13px/1.5 ${FONTE};color:${C.alerta}"><strong>Modo de teste.</strong> Este e-mail iria para <strong>${escapar(desviadoDe)}</strong> e foi desviado para você. Nada foi enviado a essa pessoa.</div></td></tr>` : ""}
<tr><td style="padding:0 4px 18px"><a href="${SITE}" style="text-decoration:none"><img src="${SITE}/email/logo.png" width="32" height="32" alt="" style="vertical-align:middle;border:0"><span style="margin-left:10px;vertical-align:middle;font:700 20px ${TITULO};letter-spacing:.5px;color:${C.texto}">LIGA FIM DE TURNO</span></a></td></tr>
<tr><td style="background:${C.cartao};border:1px solid ${C.borda};border-radius:12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${imagem}
<tr><td style="padding:28px 28px 30px">
${selo}<h1 style="margin:0 0 16px;font:700 28px/1.2 ${FONTE};letter-spacing:-.3px;color:${C.texto}">${escapar(c.titulo)}</h1>
${destaque}${p}${detalhes}${codigo}${aviso}${botao}${credito}
</td></tr></table>
</td></tr>
<tr><td style="padding:20px 6px;font:12px/1.6 ${FONTE};color:${C.cinza}">${contato}<br>${escapar(c.motivo ?? "Você recebe este e-mail porque tem cadastro na Liga Fim de Turno")} · <a href="${SITE}" style="color:${C.cinza}">${SITE.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;

  const texto = [
    c.titulo,
    "",
    c.destaque ? `${c.destaque.valor} · ${c.destaque.rotulo}` : "",
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
  const teste = destinoDeTeste();
  const desviar =
    teste && e.para.trim().toLowerCase() !== teste.toLowerCase()
      ? e.para
      : undefined;
  const para = desviar ? teste! : e.para;
  const assunto = desviar ? `[Teste para ${desviar}] ${e.assunto}` : e.assunto;
  const { html, texto } = montarEmail(e.conteudo, desviar);
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
          to: [para],
          subject: assunto,
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
      para: desviar ? `${e.para} → ${para} (teste)` : e.para,
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
