"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";

/** As regras de acesso garantem que só o organizador altera arquétipos. */
export async function adicionarArquetipo(form: FormData) {
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome) return;
  const supabase = await criarClienteServidor();
  const formato = form.get("formato") === "premodern" ? "premodern" : "pauper";
  await supabase.from("arquetipos").insert({ formato, nome });
  revalidatePath("/painel/arquetipos");
}

export async function alternarArquetipo(form: FormData) {
  const id = Number(form.get("id"));
  const ativo = form.get("ativo") === "true";
  const supabase = await criarClienteServidor();
  await supabase.from("arquetipos").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/painel/arquetipos");
}
