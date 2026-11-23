import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Integração com o Mercado Pago (API de Orders, Pix).
 * Isolada aqui para facilitar a troca de conta (CPF → CNPJ) ou de provedor.
 */

const API = "https://api.mercadopago.com/v1/orders";
export const MINUTOS_PIX = 30;

export type PedidoPix = {
  idExterno: string;
  status: string; // action_required | processed | expired | canceled | refunded | failed ...
  statusDetalhe?: string;
  statusPagamento?: string; // status da transação Pix dentro do pedido (approved, processed, pending...)
  pago: boolean;
  copiaCola?: string;
  qrBase64?: string;
  expiraEm?: string;
  pagoEm?: string;
};

function token() {
  const t = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  return t;
}

type RespostaOrder = {
  id: string;
  status: string;
  status_detail?: string;
  last_updated_date?: string;
  transactions?: {
    payments?: {
      status?: string;
      date_of_expiration?: string;
      payment_method?: { qr_code?: string; qr_code_base64?: string };
    }[];
  };
};

function converter(o: RespostaOrder): PedidoPix {
  const p = o.transactions?.payments?.[0];
  // Pago quando o pedido foi processado ou a transação Pix foi aprovada (no modo de teste o
  // Mercado Pago às vezes atualiza só a transação antes do pedido)
  const pago =
    o.status === "processed" ||
    ["approved", "processed"].includes(p?.status ?? "");
  return {
    idExterno: o.id,
    status: o.status,
    statusDetalhe: o.status_detail,
    statusPagamento: p?.status,
    pago,
    copiaCola: p?.payment_method?.qr_code,
    qrBase64: p?.payment_method?.qr_code_base64,
    expiraEm: p?.date_of_expiration,
    pagoEm: pago
      ? (o.last_updated_date ?? new Date().toISOString())
      : undefined,
  };
}

export async function criarPedidoPix(dados: {
  referencia: string; // id do pagamento no nosso banco (também é a chave de idempotência)
  valorCentavos: number;
  descricao: string;
  email: string;
  nome?: string | null;
  cpf?: string | null;
}): Promise<PedidoPix> {
  const valor = (dados.valorCentavos / 100).toFixed(2);
  // Modo de teste (credenciais de teste): o nome "APRO" faz o Mercado Pago aprovar o Pix sozinho,
  // o que dispara o aviso (webhook) sem precisar pagar. Liga com MERCADO_PAGO_TESTE_APROVAR=1.
  const aprovarTeste = process.env.MERCADO_PAGO_TESTE_APROVAR === "1";
  const [primeiro, ...resto] = (aprovarTeste ? "APRO" : (dados.nome ?? ""))
    .trim()
    .split(/\s+/);
  const corpo = {
    type: "online",
    external_reference: dados.referencia,
    description: dados.descricao,
    total_amount: valor,
    processing_mode: "automatic",
    transactions: {
      payments: [
        {
          amount: valor,
          payment_method: { id: "pix", type: "bank_transfer" },
          expiration_time: `PT${MINUTOS_PIX}M`,
        },
      ],
    },
    payer: {
      email: dados.email,
      ...(primeiro
        ? { first_name: primeiro, last_name: resto.join(" ") || undefined }
        : {}),
      ...(dados.cpf
        ? { identification: { type: "CPF", number: dados.cpf } }
        : {}),
    },
  };

  const r = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      "X-Idempotency-Key": dados.referencia,
    },
    body: JSON.stringify(corpo),
    cache: "no-store",
  });
  if (!r.ok) {
    const texto = await r.text();
    console.error("Mercado Pago: falha ao criar Pix", r.status, texto);
    throw new Error(
      "Não foi possível gerar o Pix agora. Tente de novo em instantes.",
    );
  }
  return converter(await r.json());
}

export async function buscarPedido(
  idExterno: string,
): Promise<PedidoPix | null> {
  const r = await fetch(`${API}/${encodeURIComponent(idExterno)}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  if (r.status === 404) return null;
  if (!r.ok) {
    console.error(
      "Mercado Pago: falha ao consultar pedido",
      r.status,
      await r.text(),
    );
    return null;
  }
  return converter(await r.json());
}

/**
 * Confere a assinatura do aviso (webhook) do Mercado Pago.
 * Mesmo sem segredo configurado o aviso é seguro: a confirmação sempre
 * consulta o pedido direto na API antes de mudar qualquer coisa.
 */
export function assinaturaValida(
  cabecalhoAssinatura: string | null,
  requestId: string | null,
  dataId: string,
) {
  const segredo = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!segredo) return true;
  if (!cabecalhoAssinatura) return false;
  const partes = Object.fromEntries(
    cabecalhoAssinatura
      .split(",")
      .map((p) => p.trim().split("=", 2) as [string, string]),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;
  const manifesto = `id:${dataId.toLowerCase()};request-id:${requestId ?? ""};ts:${ts};`;
  const esperado = createHmac("sha256", segredo)
    .update(manifesto)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(esperado), Buffer.from(v1));
  } catch {
    return false;
  }
}
