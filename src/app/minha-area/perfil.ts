"use server";

import { revalidatePath } from "next/cache";
import { REDES, usuarioDaRede, type Redes } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoPerfil = { ok?: boolean; erro?: string };

export async function salvarPerfil(
  _: EstadoPerfil,
  form: FormData,
): Promise<EstadoPerfil> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Entre novamente para salvar." };

  const bio = String(form.get("bio") ?? "").trim();
  if (bio.length > 400) return { erro: "A bio pode ter até 400 caracteres." };

  const redes: Redes = {};
  for (const r of REDES) {
    const bruto = String(form.get(`rede_${r.id}`) ?? "");
    if (!bruto.trim()) continue;
    const u = usuarioDaRede(bruto);
    if (!u)
      return {
        erro: `Não entendemos o usuário do ${r.nome}. Use @usuario ou o link do perfil.`,
      };
    redes[r.id] = u;
  }

  const { data: atual } = await supabase
    .from("jogadores")
    .select("nick_endstep")
    .eq("id", user.id)
    .maybeSingle();
  const { error } = await supabase
    .from("jogadores")
    .update({
      bio: bio || null,
      redes,
      mostrar_resultados: form.get("mostrar_resultados") === "on",
      mostrar_decks: form.get("mostrar_decks") === "on",
      mostrar_artigos: form.get("mostrar_artigos") === "on",
    })
    .eq("id", user.id);
  if (error) return { erro: "Não foi possível salvar agora. Tente de novo." };

  if (atual?.nick_endstep)
    revalidatePath(`/jogadores/${encodeURIComponent(atual.nick_endstep)}`);
  return { ok: true };
}
