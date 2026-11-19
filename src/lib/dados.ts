import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server";

export type Liga = { id: number; slug: string; nome: string; descricao: string | null };

export type LojaEvento = {
  id: string;
  nome: string;
  slug: string | null;
  logo_url: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  mapa_url: string | null;
  instagram: string | null;
  whatsapp: string | null;
  horario: string | null;
  observacoes_local: string | null;
};

export type Evento = {
  id: string;
  slug: string;
  titulo: string;
  formato: string;
  tipo: "etapa" | "final_trimestre" | "player_of_the_year";
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
  colecao_codigo: string | null;
  cubo_id: string | null;
  pacotes: number | null;
  colecao_info: {
    codigo: string;
    nome: string;
    icone_svg: string | null;
    arte_url: string | null;
    arte_credito: string | null;
    lancamento: string | null;
    total_cartas: number | null;
  } | null;
  loja_id: string | null;
  loja: LojaEvento | null;
  cubo_info: {
    cubecobra_id: string;
    nome: string;
    dono: string | null;
    imagem_url: string | null;
    imagem_credito: string | null;
    total_cartas: number | null;
  } | null;
};

const CAMPOS_EVENTO =
  "*, liga:ligas(*), colecao_info:colecoes(codigo, nome, icone_svg, arte_url, arte_credito, lancamento, total_cartas), cubo_info:cubos(cubecobra_id, nome, dono, imagem_url, imagem_credito, total_cartas), loja:parceiros(id, nome, slug, logo_url, logradouro, numero, complemento, bairro, cidade, uf, cep, mapa_url, instagram, whatsapp, horario, observacoes_local)";

export async function listarProximosEventos(limite = 20, ligaSlug?: string): Promise<Evento[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("eventos")
    .select(ligaSlug ? CAMPOS_EVENTO.replace("liga:ligas(*)", "liga:ligas!inner(*)") : CAMPOS_EVENTO)
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

/** Prêmio do jogador logado neste evento (só ele e o organizador enxergam valores). */
export async function meuPremio(eventoId: string) {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("premios")
    .select("valor_centavos, status, posicao")
    .eq("evento_id", eventoId)
    .eq("jogador_id", user.id)
    .maybeSingle();
  return data;
}

/** Formatos (ligas) ativos, na ordem do menu. */
export async function listarFormatos(): Promise<{ slug: string; nome: string; descricao: string | null }[]> {
  if (!supabaseConfigurado()) return [{ slug: "pauper", nome: "Liga Pauper", descricao: null }, { slug: "limited", nome: "Liga Limited", descricao: null }];
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("ligas").select("slug, nome, descricao").eq("ativo", true).order("ordem");
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
    .select("id, nome, email, nick_endstep, discord_nome, avatar_url, papel, cpf, chave_pix, aceite_termos_em")
    .eq("id", user.id)
    .maybeSingle();
  return jogador;
}

/** Próximos eventos (e os últimos com resultado) numa loja. */
export async function eventosDaLoja(lojaId: string): Promise<{ proximos: Evento[]; passados: Evento[] }> {
  if (!supabaseConfigurado()) return { proximos: [], passados: [] };
  const supabase = await criarClienteServidor();
  const [{ data: p }, { data: r }] = await Promise.all([
    supabase.from("eventos").select(CAMPOS_EVENTO).eq("loja_id", lojaId).in("status", ["aberto", "fechado", "em_andamento"]).order("inicio").limit(12),
    supabase.from("eventos").select(CAMPOS_EVENTO).eq("loja_id", lojaId).eq("status", "resultados").order("inicio", { ascending: false }).limit(6),
  ]);
  return { proximos: (p as Evento[] | null) ?? [], passados: (r as Evento[] | null) ?? [] };
}
