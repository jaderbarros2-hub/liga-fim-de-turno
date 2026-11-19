"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { emailResgateSolicitado, emailSaqueSolicitado } from "@/lib/emails";
import { redirect } from "next/navigation";
import { SAQUE_MINIMO, saldoDaCarteira } from "@/lib/carteira";
import { reais } from "@/lib/formato";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoCarteira = { erro?: string; ok?: string };

async function usuario() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/minha-area?aba=carteira");
  return user.id;
}

const centavos = (v: FormDataEntryValue | null) =>
  Math.round(
    Number(
      String(v ?? "")
        .replace(/[^\d,.-]/g, "")
        .replace(",", "."),
    ) * 100,
  );

/** Pede o saque por Pix (mínimo: o prêmio de um campeão numa etapa padrão). */
export async function solicitarSaque(
  _: EstadoCarteira,
  form: FormData,
): Promise<EstadoCarteira> {
  const id = await usuario();
  const saldo = await saldoDaCarteira(id);
  const valor = form.get("tudo") === "on" ? saldo : centavos(form.get("valor"));
  if (!valor || valor <= 0) return { erro: "Informe o valor do saque." };
  if (valor > saldo) return { erro: "O valor é maior que o seu saldo." };
  if (valor < SAQUE_MINIMO)
    return { erro: `O saque mínimo é ${reais(SAQUE_MINIMO)}.` };
  const db = criarClienteAdmin();
  const { data: j } = await db
    .from("jogadores")
    .select("chave_pix")
    .eq("id", id)
    .single();
  if (!j?.chave_pix)
    return { erro: "Cadastre sua chave Pix em Meus dados antes de sacar." };
  const { data: mov } = await db
    .from("carteira_movimentos")
    .insert({
      jogador_id: id,
      tipo: "saque",
      valor_centavos: -valor,
      status: "pendente",
      descricao: "Saque solicitado",
      chave_pix: j.chave_pix,
    })
    .select("id")
    .single();
  if (mov) after(() => emailSaqueSolicitado(mov.id));
  revalidatePath("/minha-area");
  return {
    ok: `Saque de ${reais(valor)} solicitado. O Pix cai em até 48 horas.`,
  };
}

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const novoCodigo = () =>
  "FDT-" +
  Array.from(
    crypto.getRandomValues(new Uint8Array(5)),
    (b) => LETRAS[b % LETRAS.length],
  ).join("");

/**
 * Resgate em loja parceira: o valor sai da Carteira, a liga faz o Pix para a loja
 * e a loja gera o crédito (com o bônus da parceria) na conta do jogador em até 2 dias úteis.
 */
export async function enviarParaLoja(
  _: EstadoCarteira,
  form: FormData,
): Promise<EstadoCarteira> {
  const id = await usuario();
  const parceiroId = String(form.get("parceiro_id") ?? "");
  const valor = centavos(form.get("valor"));
  const conta = String(form.get("conta_loja") ?? "").trim();
  const saldo = await saldoDaCarteira(id);
  if (!valor || valor <= 0) return { erro: "Informe o valor." };
  if (valor < 500) return { erro: `O resgate mínimo em loja é ${reais(500)}.` };
  if (valor > saldo) return { erro: "O valor é maior que o seu saldo." };
  if (conta.length < 3)
    return {
      erro: "Informe a sua conta na loja (e-mail, CPF ou usuário, como a loja pede).",
    };
  if (form.get("ciente") !== "on")
    return {
      erro: "Confirme que tem cadastro na loja e que leu as regras do resgate.",
    };
  const db = criarClienteAdmin();
  const [{ data: loja }, { data: cred }] = await Promise.all([
    db
      .from("parceiros")
      .select("id, nome, aceita_credito, ativo, bonus_credito_pct")
      .eq("id", parceiroId)
      .maybeSingle(),
    db
      .from("lojas_credito")
      .select("pix_chave, email_pedidos")
      .eq("parceiro_id", parceiroId)
      .maybeSingle(),
  ]);
  if (
    !loja?.ativo ||
    !loja.aceita_credito ||
    !cred?.pix_chave ||
    !cred.email_pedidos
  )
    return { erro: "Escolha uma loja que aceita resgate da liga." };
  const credito = Math.round(valor * (1 + (loja.bonus_credito_pct ?? 0) / 100));
  const codigo = novoCodigo();
  const { data: mov } = await db
    .from("carteira_movimentos")
    .insert({
      jogador_id: id,
      tipo: "envio_loja",
      valor_centavos: -valor,
      credito_centavos: credito,
      conta_loja: conta,
      codigo_loja: codigo,
      status: "pendente",
      descricao: `Crédito na ${loja.nome}`,
      parceiro_id: loja.id,
    })
    .select("id")
    .single();
  if (!mov)
    return { erro: "Não foi possível registrar o resgate. Tente de novo." };
  after(() => emailResgateSolicitado(mov.id));
  revalidatePath("/minha-area");
  return {
    ok: `Pronto! ${reais(credito)} na ${loja.nome} em até 2 dias úteis. Código ${codigo}. Enviamos os detalhes por e-mail.`,
  };
}
