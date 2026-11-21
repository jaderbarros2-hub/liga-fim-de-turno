import "server-only";
import { emailPremioParceiro } from "@/lib/emails";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Prêmios extras dos parceiros (cupom, booster, brinde). A loja premia, a liga dá visibilidade.
 * Por posição: entregue ao publicar o resultado. Por sorteio: a organização sorteia no painel.
 */
export type PremioParceiro = {
  id: string;
  evento_id: string;
  parceiro_id: string;
  tipo: "cupom" | "booster" | "brinde";
  descricao: string;
  valor_centavos: number | null;
  criterio: "posicao" | "sorteio";
  posicao: number | null;
  validade: string | null;
  jogador_id: string | null;
  entregue_em: string | null;
  parceiro: {
    nome: string;
    logo_url: string | null;
    slug: string | null;
  } | null;
  jogador: { nick_endstep: string | null; nome: string | null } | null;
};

const CAMPOS =
  "id, evento_id, parceiro_id, tipo, descricao, valor_centavos, criterio, posicao, validade, jogador_id, entregue_em, parceiro:parceiros(nome, logo_url, slug), jogador:jogadores(nick_endstep, nome)";

export const criterioTexto = (
  p: Pick<PremioParceiro, "criterio" | "posicao">,
) =>
  p.criterio === "sorteio"
    ? "Sorteio entre os participantes"
    : `${p.posicao ?? 1}º lugar`;

export async function premiosDoEventoParceiros(
  eventoId: string,
): Promise<PremioParceiro[]> {
  const { data } = await criarClienteAdmin()
    .from("premios_parceiros")
    .select(CAMPOS)
    .eq("evento_id", eventoId)
    .order("criterio")
    .order("posicao");
  return (data as unknown as PremioParceiro[]) ?? [];
}

/** Cupons e brindes do jogador (com o código do cupom), para a Carteira. */
export async function meusPremiosParceiros(jogadorId: string) {
  const { data } = await criarClienteAdmin()
    .from("premios_parceiros")
    .select(`${CAMPOS}, codigo, evento:eventos(titulo, slug)`)
    .eq("jogador_id", jogadorId)
    .not("entregue_em", "is", null)
    .order("entregue_em", { ascending: false });
  return (
    (data as unknown as (PremioParceiro & {
      codigo: string | null;
      evento: { titulo: string; slug: string } | null;
    })[]) ?? []
  );
}

async function entregar(premioId: string, jogadorId: string) {
  await criarClienteAdmin()
    .from("premios_parceiros")
    .update({ jogador_id: jogadorId, entregue_em: new Date().toISOString() })
    .eq("id", premioId);
  await emailPremioParceiro(premioId);
}

/** Ao publicar o resultado: entrega os prêmios por posição a quem ficou naquela posição. */
export async function entregarPremiosPorPosicao(
  eventoId: string,
  linhas: { jogadorId: string | null }[],
) {
  const premios = (await premiosDoEventoParceiros(eventoId)).filter(
    (p) => p.criterio === "posicao",
  );
  for (const p of premios) {
    const jogadorId = linhas[(p.posicao ?? 1) - 1]?.jogadorId;
    if (!jogadorId || (p.entregue_em && p.jogador_id === jogadorId)) continue;
    await entregar(p.id, jogadorId);
  }
}

/** Sorteia entre os jogadores da classificação do evento (com cadastro). */
export async function sortearPremioParceiro(premioId: string) {
  const db = criarClienteAdmin();
  const { data: premio } = await db
    .from("premios_parceiros")
    .select("id, evento_id, criterio, entregue_em")
    .eq("id", premioId)
    .single();
  if (!premio || premio.criterio !== "sorteio")
    throw new Error("Prêmio não é por sorteio.");
  if (premio.entregue_em) throw new Error("Este prêmio já foi sorteado.");
  const { data: res } = await db
    .from("resultados")
    .select("jogador_id")
    .eq("evento_id", premio.evento_id)
    .not("jogador_id", "is", null);
  const ids = [...new Set((res ?? []).map((r) => r.jogador_id as string))];
  if (!ids.length)
    throw new Error("Publique a classificação antes de sortear.");
  const sorteado = ids[Math.floor(Math.random() * ids.length)];
  await entregar(premioId, sorteado);
  return sorteado;
}
