"use server";

import { redirect } from "next/navigation";
import { emailTeste } from "@/lib/emails";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function enviarTeste(form: FormData) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/painel/emails");
  const { data } = await supabase
    .from("jogadores")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.papel !== "organizador") throw new Error("Apenas o organizador.");
  const para = String(form.get("para") ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(para)) redirect("/painel/emails?teste=invalido");
  const r = await emailTeste(para);
  redirect(`/painel/emails?teste=${r.ok ? r.status : "falhou"}`);
}
