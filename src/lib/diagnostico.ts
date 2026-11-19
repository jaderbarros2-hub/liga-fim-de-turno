import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Saúde do portal para quem configura: o que está faltando ou falhando, com o link para corrigir.
 * erro = algo não funciona para o jogador; alerta = funciona, mas incompleto ou atrasado.
 */
export type Problema = {
  nivel: "erro" | "alerta";
  titulo: string;
  detalhe: string;
  link?: string;
  acao?: string;
};

export type LojaDiag = {
  id: string;
  nome: string;
  ativo: boolean;
  logo_url: string | null;
  site_url: string | null;
  url_compra_lista: string | null;
  mostrar_logo: boolean;
  sede_eventos: boolean;
  aceita_credito: boolean;
  compra_deck: boolean;
  logradouro: string | null;
  numero: string | null;
  cidade: string | null;
  uf: string | null;
  credito: {
    pix_chave: string | null;
    email_pedidos: string | null;
    url_cadastro: string | null;
  } | null;
};

/** O que falta no cadastro de uma loja para cada papel funcionar. */
export function problemasDaLoja(l: LojaDiag): Problema[] {
  if (!l.ativo) return [];
  const p: Problema[] = [];
  const link = `/painel/parceiros?editar=${l.id}#form`;
  if (l.aceita_credito) {
    const falta = [
      !l.credito?.pix_chave && "chave Pix",
      !l.credito?.email_pedidos && "e-mail de pedidos",
    ].filter(Boolean);
    if (falta.length)
      p.push({
        nivel: "erro",
        titulo: `${l.nome} não aparece no resgate da Carteira`,
        detalhe: `Falta ${falta.join(" e ")} da loja.`,
        link,
        acao: "Completar cadastro",
      });
    else if (!l.credito?.url_cadastro)
      p.push({
        nivel: "alerta",
        titulo: `${l.nome}: falta o link de cadastro da loja`,
        detalhe: "O jogador precisa de conta na loja para usar o crédito.",
        link,
        acao: "Adicionar link",
      });
  }
  if (l.sede_eventos && (!l.logradouro || !l.numero || !l.cidade || !l.uf))
    p.push({
      nivel: "erro",
      titulo: `${l.nome} não pode ser sede de evento`,
      detalhe: "Endereço incompleto: rua, número, cidade e UF.",
      link,
      acao: "Completar endereço",
    });
  if (l.mostrar_logo && !l.logo_url)
    p.push({
      nivel: "alerta",
      titulo: `${l.nome} não aparece na faixa de parceiros`,
      detalhe: "Envie o logo da loja.",
      link,
      acao: "Enviar logo",
    });
  if (l.compra_deck && !l.site_url && !l.url_compra_lista)
    p.push({
      nivel: "alerta",
      titulo: `${l.nome}: “Comprar este deck” sem destino`,
      detalhe: "Informe o site ou o link de compra por lista.",
      link,
      acao: "Adicionar site",
    });
  return p;
}

export const CAMPOS_LOJA_DIAG =
  "id, nome, ativo, logo_url, site_url, url_compra_lista, mostrar_logo, sede_eventos, aceita_credito, compra_deck, logradouro, numero, cidade, uf, credito:lojas_credito(pix_chave, email_pedidos, url_cadastro)";

export async function diagnosticar(): Promise<Problema[]> {
  const p: Problema[] = [];

  // Configuração na Vercel
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN)
    p.push({
      nivel: "erro",
      titulo: "Pagamento por Pix desligado",
      detalhe: "Falta MERCADO_PAGO_ACCESS_TOKEN nas variáveis da Vercel.",
    });
  if (!process.env.MERCADO_PAGO_WEBHOOK_SECRET)
    p.push({
      nivel: "alerta",
      titulo: "Webhook do Mercado Pago sem assinatura",
      detalhe:
        "Falta MERCADO_PAGO_WEBHOOK_SECRET: a confirmação automática do Pix pode não funcionar.",
    });
  if (!process.env.RESEND_API_KEY)
    p.push({
      nivel: "alerta",
      titulo: "E-mails não estão saindo",
      detalhe:
        "Falta RESEND_API_KEY na Vercel: os e-mails ficam só registrados como simulados.",
      link: "/painel/emails",
      acao: "Ver e-mails",
    });
  else if (
    (process.env.EMAIL_REMETENTE ?? "onboarding@resend.dev").includes(
      "resend.dev",
    )
  )
    p.push({
      nivel: "alerta",
      titulo: "E-mails em modo de teste",
      detalhe:
        "Sem domínio verificado no Resend, os e-mails só chegam no e-mail dono da conta.",
      link: "/painel/emails",
      acao: "Ver e-mails",
    });
  if (!process.env.EMAIL_CONTATO && !process.env.NEXT_PUBLIC_EMAIL_CONTATO)
    p.push({
      nivel: "alerta",
      titulo: "Sem e-mail de contato",
      detalhe:
        "Defina EMAIL_CONTATO na Vercel: ele aparece nos e-mails e recebe as respostas.",
    });

  const db = criarClienteAdmin();
  const semana = new Date(Date.now() - 7 * 864e5).toISOString();
  const umDia = new Date(Date.now() - 864e5).toISOString();
  const doisDias = new Date(Date.now() - 2 * 864e5).toISOString();
  const [
    { data: lojas },
    { data: eventos },
    { data: links },
    { count: falhas },
    { data: pendentes },
  ] = await Promise.all([
    db.from("parceiros").select(CAMPOS_LOJA_DIAG),
    db
      .from("eventos")
      .select("id, titulo, modalidade, loja_id, status")
      .in("status", ["aberto", "fechado", "em_andamento"]),
    db.from("evento_links").select("evento_id"),
    db
      .from("emails")
      .select("id", { count: "exact", head: true })
      .eq("status", "falhou")
      .gte("criado_em", semana),
    db
      .from("carteira_movimentos")
      .select("tipo, criado_em")
      .eq("status", "pendente")
      .in("tipo", ["saque", "envio_loja"]),
  ]);

  for (const l of (lojas as unknown as LojaDiag[] | null) ?? [])
    p.push(...problemasDaLoja(l));

  const comLink = new Set((links ?? []).map((l) => l.evento_id));
  for (const e of eventos ?? []) {
    const link = `/painel/eventos/${e.id}`;
    if (e.modalidade === "presencial" && !e.loja_id)
      p.push({
        nivel: "erro",
        titulo: `${e.titulo}: evento presencial sem loja`,
        detalhe: "Quem se inscreve não vê endereço nem mapa.",
        link,
        acao: "Escolher loja",
      });
    if (e.modalidade !== "presencial" && !comLink.has(e.id))
      p.push({
        nivel: "erro",
        titulo: `${e.titulo}: sem link do Endstep`,
        detalhe: "Quem tem ingresso não consegue entrar no torneio.",
        link,
        acao: "Adicionar link",
      });
  }

  if (falhas)
    p.push({
      nivel: "erro",
      titulo: `${falhas} e-mail(s) falharam na última semana`,
      detalhe: "Veja o motivo de cada um no registro.",
      link: "/painel/emails",
      acao: "Ver e-mails",
    });

  const resgatesAtrasados = (pendentes ?? []).filter(
    (m) => m.tipo === "envio_loja" && m.criado_em < umDia,
  ).length;
  const saquesAtrasados = (pendentes ?? []).filter(
    (m) => m.tipo === "saque" && m.criado_em < doisDias,
  ).length;
  if (resgatesAtrasados)
    p.push({
      nivel: "alerta",
      titulo: `${resgatesAtrasados} resgate(s) em loja esperando Pix há mais de 1 dia`,
      detalhe: "O jogador foi avisado de 2 dias úteis.",
      link: "/painel/financeiro",
      acao: "Abrir Financeiro",
    });
  if (saquesAtrasados)
    p.push({
      nivel: "alerta",
      titulo: `${saquesAtrasados} saque(s) esperando Pix há mais de 48 horas`,
      detalhe: "O prazo informado ao jogador é de 48 horas.",
      link: "/painel/financeiro",
      acao: "Abrir Financeiro",
    });

  return p.sort((a, b) =>
    a.nivel === b.nivel ? 0 : a.nivel === "erro" ? -1 : 1,
  );
}
