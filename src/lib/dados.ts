import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server";

export type Liga = { id: number; slug: string; nome: string; descricao: string | null };

export type Evento = {
  id: string;
  slug: string;
  titulo: string;
  formato: string;
  colecao: string | null;
  inicio: string;
  modalidade: string;
  local: string | null;
  valor_centavos: number;
  vagas: number | null;
  minimo: number;
  inscricoes_ate: string;
  percentual_premio: number;
  detalhes: string | null;
  status: string;
  liga: Liga;
};

const CAMPOS_EVENTO = "*, liga:ligas(*)";

export async function listarProximosEventos(limite = 20, ligaSlug?: string): Promise<Evento[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("eventos")
    .select(ligaSlug ? "*, liga:ligas!inner(*)" : CAMPOS_EVENTO)
    .in("status", ["aberto", "fechado", "em_andamento"])
    .order("inicio", { ascending: true })
    .limit(limite);
  if (ligaSlug) consulta = consulta.eq("liga.slug", ligaSlug);
  const { data } = await consulta;
  return (data as Evento[] | null) ?? [];
}

export async function listarEventosEncerrados(limite = 10): Promise<Evento[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("eventos")
    .select(CAMPOS_EVENTO)
    .eq("status", "resultados")
    .order("inicio", { ascending: false })
    .limit(limite);
  return (data as Evento[] | null) ?? [];
}

export async function buscarEvento(slug: string): Promise<Evento | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("eventos").select(CAMPOS_EVENTO).eq("slug", slug).maybeSingle();
  return (data as Evento | null) ?? null;
}

export async function listarInscritos(eventoId: string) {
  if (!supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("inscritos_publico")
    .select("nick_endstep, discord_nome, confirmado_em")
    .eq("evento_id", eventoId)
    .order("confirmado_em", { ascending: true });
  return data ?? [];
}

export async function listarResultados(eventoId: string) {
  if (!supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("resultados")
    .select("posicao, nick_endstep, pontos, vitorias, empates, derrotas")
    .eq("evento_id", eventoId)
    .order("posicao", { ascending: true });
  return data ?? [];
}

export async function buscarPagina(slug: string) {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("paginas").select("titulo, conteudo").eq("slug", slug).maybeSingle();
  return data;
}

export async function usuarioAtual() {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: jogador } = await supabase
    .from("jogadores")
    .select("id, nome, nick_endstep, discord_nome, avatar_url, papel, cpf, chave_pix, aceite_termos_em")
    .eq("id", user.id)
    .maybeSingle();
  return jogador;
}

/** Prêmio estimado: inscritos confirmados × valor × percentual do prêmio. */
export function premioEstimado(evento: Evento, confirmados: number) {
  return Math.floor((evento.valor_centavos * confirmados * evento.percentual_premio) / 100);
}
