"use server";

import { revalidatePath } from "next/cache";
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

const centavos = (v: FormDataEntryValue | null) => Math.round(Number(String(v ?? "").replace(/[^\d,.-]/g, "").replace(",", ".")) * 100);

/** Pede o saque por Pix (mínimo: o prêmio de um campeão numa etapa padrão). */
export async function solicitarSaque(_: EstadoCarteira, form: FormData): Promise<EstadoCarteira> {
  const id = await usuario();
  const saldo = await saldoDaCarteira(id);
  const valor = form.get("tudo") === "on" ? saldo : centavos(form.get("valor"));
  if (!valor || valor <= 0) return { erro: "Informe o valor do saque." };
  if (valor > saldo) return { erro: "O valor é maior que o seu saldo." };
  if (valor < SAQUE_MINIMO) return { erro: `O saque mínimo é ${reais(SAQUE_MINIMO)}.` };
  const db = criarClienteAdmin();
  const { data: j } = await db.from("jogadores").select("chave_pix").eq("id", id).single();
  if (!j?.chave_pix) return { erro: "Cadastre sua chave Pix em Meus dados antes de sacar." };
  await db.from("carteira_movimentos").insert({ jogador_id: id, tipo: "saque", valor_centavos: -valor, status: "pendente", descricao: "Saque solicitado", chave_pix: j.chave_pix });
  revalidatePath("/minha-area");
  return { ok: `Saque de ${reais(valor)} solicitado. O Pix cai em até 48 horas.` };
}

/** Envia saldo para uma loja parceira (a organização repassa e a loja gera o crédito). */
export async function enviarParaLoja(_: EstadoCarteira, form: FormData): Promise<EstadoCarteira> {
  const id = await usuario();
  const parceiroId = String(form.get("parceiro_id") ?? "");
  const valor = centavos(form.get("valor"));
  const saldo = await saldoDaCarteira(id);
  if (!valor || valor <= 0) return { erro: "Informe o valor." };
  if (valor > saldo) return { erro: "O valor é maior que o seu saldo." };
  const db = criarClienteAdmin();
  const { data: loja } = await db.from("parceiros").select("id, nome, aceita_credito, ativo").eq("id", parceiroId).maybeSingle();
  if (!loja?.ativo || !loja.aceita_credito) return { erro: "Escolha uma loja que aceita crédito da liga." };
  await db.from("carteira_movimentos").insert({
    jogador_id: id,
    tipo: "envio_loja",
    valor_centavos: -valor,
    status: "pendente",
    descricao: `Envio para ${loja.nome}`,
    parceiro_id: loja.id,
  });
  revalidatePath("/minha-area");
  return { ok: `Pedido de envio de ${reais(valor)} para ${loja.nome} registrado. Você acompanha o status aqui.` };
}
