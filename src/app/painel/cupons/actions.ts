"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizarCodigo } from "@/lib/cupons";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

async function exigirOrganizador() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/painel/cupons");
  const { data } = await supabase.from("jogadores").select("papel").eq("id", user.id).maybeSingle();
  if (data?.papel !== "organizador") throw new Error("Apenas o organizador.");
}

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O e 1/I para não confundir
const sufixo = (n: number) => Array.from(randomBytes(n), (b) => ALFABETO[b % ALFABETO.length]).join("");
const deBrasilia = (v: string) => (v ? new Date(`${v}:00-03:00`).toISOString() : null);

export type EstadoCupom = { erro?: string; ok?: string; codigos?: string[] };

/** Cria um cupom com código escolhido, ou um lote de códigos únicos (PREFIXO-XXXXX), cada um de uso único. */
export async function criarCupons(_: EstadoCupom, form: FormData): Promise<EstadoCupom> {
  await exigirOrganizador();
  const t = (c: string) => String(form.get(c) ?? "").trim();
  const tipo = t("tipo");
  if (!["gratis", "percentual", "valor"].includes(tipo)) return { erro: "Escolha o tipo de desconto." };
  const valorBruto = Number(t("valor").replace(",", "."));
  const valor = tipo === "gratis" ? 0 : tipo === "percentual" ? Math.round(valorBruto) : Math.round(valorBruto * 100);
  if (tipo === "percentual" && (valor < 1 || valor > 100)) return { erro: "Percentual entre 1 e 100." };
  if (tipo === "valor" && valor < 1) return { erro: "Informe o valor do desconto em reais." };

  const quantidade = Math.min(Math.max(Number(t("quantidade")) || 1, 1), 500);
  const base = normalizarCodigo(t("codigo"));
  if (!base || !/^[A-Z0-9-]{3,24}$/.test(base)) return { erro: "Código com 3 a 24 letras, números ou hífen." };

  const comum = {
    descricao: t("descricao") || null,
    tipo,
    valor,
    evento_id: t("evento_id") || null,
    formato: ["pauper", "limited"].includes(t("formato")) ? t("formato") : null,
    limite_por_jogador: 1,
    valido_de: deBrasilia(t("valido_de")),
    valido_ate: deBrasilia(t("valido_ate")),
  };
  type Linha = typeof comum & { codigo: string; limite_usos: number | null; lote: string | null };
  const linhas: Linha[] =
    quantidade === 1
      ? [{ ...comum, codigo: base, limite_usos: Number(t("limite_usos")) || null, lote: null }]
      : Array.from({ length: quantidade }, () => ({ ...comum, codigo: `${base}-${sufixo(5)}`, limite_usos: 1, lote: base }));

  const { error } = await criarClienteAdmin().from("cupons").insert(linhas);
  if (error) return { erro: error.code === "23505" ? "Já existe um cupom com esse código." : "Não foi possível criar." };
  revalidatePath("/painel/cupons");
  return quantidade === 1 ? { ok: `Cupom ${base} criado.` } : { ok: `${quantidade} códigos criados no lote ${base}.`, codigos: linhas.map((l) => l.codigo) };
}

export async function alternarCupom(form: FormData) {
  await exigirOrganizador();
  await criarClienteAdmin().from("cupons").update({ ativo: form.get("ativo") !== "true" }).eq("id", String(form.get("id")));
  revalidatePath("/painel/cupons");
}
