import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export type Cupom = {
  id: string;
  codigo: string;
  descricao: string | null;
  tipo: "gratis" | "percentual" | "valor";
  valor: number;
  evento_id: string | null;
  formato: "pauper" | "limited" | null;
  limite_usos: number | null;
  limite_por_jogador: number;
  valido_de: string | null;
  valido_ate: string | null;
  ativo: boolean;
  lote: string | null;
};

export const normalizarCodigo = (c: string) => c.trim().toUpperCase().replace(/\s+/g, "");

export function descontoDe(cupom: Pick<Cupom, "tipo" | "valor">, preco: number) {
  if (cupom.tipo === "gratis") return preco;
  if (cupom.tipo === "percentual") return Math.min(preco, Math.round((preco * cupom.valor) / 100));
  return Math.min(preco, cupom.valor);
}

export const descreverCupom = (c: Pick<Cupom, "tipo" | "valor">) =>
  c.tipo === "gratis"
    ? "Ingresso gratuito"
    : c.tipo === "percentual"
      ? `${c.valor}% de desconto`
      : `${(c.valor / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} de desconto`;

/** Usos já confirmados (pagamento aprovado) do cupom, no total e pelo jogador. */
async function usos(cupomId: string, jogadorId?: string) {
  const db = criarClienteAdmin();
  const { data } = await db.from("pagamentos").select("id, inscricao:inscricoes(jogador_id)").eq("cupom_id", cupomId).eq("status", "aprovado");
  const lista = (data as unknown as { inscricao: { jogador_id: string } | null }[]) ?? [];
  return { total: lista.length, doJogador: jogadorId ? lista.filter((u) => u.inscricao?.jogador_id === jogadorId).length : 0 };
}

/**
 * Confere se o cupom vale para este evento e este jogador.
 * Devolve o desconto e o valor final, ou o motivo de não valer.
 */
export async function validarCupom(
  codigoBruto: string,
  evento: { id: string; formato: string; valor_centavos: number },
  jogadorId: string,
): Promise<{ erro: string } | { cupom: Cupom; desconto: number; final: number }> {
  const codigo = normalizarCodigo(codigoBruto);
  if (!codigo) return { erro: "Digite o código do cupom." };
  const { data } = await criarClienteAdmin().from("cupons").select("*").eq("codigo", codigo).maybeSingle();
  const cupom = data as Cupom | null;
  const agora = Date.now();
  if (!cupom || !cupom.ativo) return { erro: "Cupom não encontrado ou inativo." };
  if (cupom.valido_de && new Date(cupom.valido_de).getTime() > agora) return { erro: "Este cupom ainda não está valendo." };
  if (cupom.valido_ate && new Date(cupom.valido_ate).getTime() < agora) return { erro: "Este cupom expirou." };
  if (cupom.evento_id && cupom.evento_id !== evento.id) return { erro: "Este cupom é de outro evento." };
  const liga = evento.formato === "pauper" ? "pauper" : "limited";
  if (cupom.formato && cupom.formato !== liga) return { erro: `Este cupom vale só para ${cupom.formato === "pauper" ? "Pauper" : "Limited"}.` };
  const u = await usos(cupom.id, jogadorId);
  if (cupom.limite_usos && u.total >= cupom.limite_usos) return { erro: "Este cupom já atingiu o limite de usos." };
  if (u.doJogador >= cupom.limite_por_jogador) return { erro: "Você já usou este cupom." };
  const desconto = descontoDe(cupom, evento.valor_centavos);
  return { cupom, desconto, final: evento.valor_centavos - desconto };
}

/** Quantos usos confirmados cada cupom tem (para o Painel). */
export async function contarUsos(): Promise<Map<string, number>> {
  const { data } = await criarClienteAdmin().from("pagamentos").select("cupom_id").eq("status", "aprovado").not("cupom_id", "is", null);
  const m = new Map<string, number>();
  for (const p of data ?? []) m.set(p.cupom_id, (m.get(p.cupom_id) ?? 0) + 1);
  return m;
}
