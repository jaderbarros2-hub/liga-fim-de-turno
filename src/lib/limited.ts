import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Limited: coleções vêm do Scryfall (nome, símbolo, raras e míticas) e cubos do Cube Cobra
 * (lista, capa e curador). Tudo fica guardado no banco; as páginas não dependem dos sites externos.
 */

const UA = { "User-Agent": "LigaFimDeTurno/1.0", Accept: "application/json" };
/** O Scryfall pede um intervalo entre consultas seguidas. */
const pausa = () => new Promise((r) => setTimeout(r, 120));
const TIPOS_DRAFT = ["expansion", "core", "masters", "draft_innovation", "funny", "alchemy"];

export type CartaGaleria = { nome: string; imagem: string | null; cor: string; raridade?: string; tipo?: string; cmc?: number };

export type ColecaoResumo = { codigo: string; nome: string; icone_svg: string | null; lancamento: string | null; tipo: string };

type SetScryfall = {
  code: string;
  name: string;
  set_type: string;
  released_at?: string;
  card_count: number;
  icon_svg_uri?: string;
  digital: boolean;
};

/** Coleções jogáveis em draft/selado que batem com o termo (nome ou código). */
export async function procurarColecoes(termo: string): Promise<ColecaoResumo[]> {
  const r = await fetch("https://api.scryfall.com/sets", { headers: UA, next: { revalidate: 86400 } });
  if (!r.ok) throw new Error("Scryfall indisponível.");
  const { data } = (await r.json()) as { data: SetScryfall[] };
  const t = termo.trim().toLowerCase();
  return data
    .filter((s) => TIPOS_DRAFT.includes(s.set_type) && !s.digital && s.card_count > 60)
    .filter((s) => !t || s.name.toLowerCase().includes(t) || s.code === t)
    .slice(0, 12)
    .map((s) => ({ codigo: s.code, nome: s.name, icone_svg: s.icon_svg_uri ?? null, lancamento: s.released_at ?? null, tipo: s.set_type }));
}

type CartaScryfall = {
  name: string;
  rarity: string;
  colors?: string[];
  type_line?: string;
  cmc?: number;
  artist?: string;
  image_uris?: { normal?: string; art_crop?: string };
  card_faces?: { colors?: string[]; image_uris?: { normal?: string; art_crop?: string } }[];
};

const corDe = (cores: string[] | undefined, tipo = "") => {
  if (/\bLand\b/.test(tipo) && !/Creature/.test(tipo)) return "Lands";
  if (!cores?.length) return "Colorless";
  if (cores.length > 1) return "Multicolored";
  return { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" }[cores[0]] ?? "Colorless";
};

/** Busca a coleção no Scryfall e guarda (com as raras e míticas e uma arte de capa provisória). */
export async function importarColecao(codigo: string) {
  const db = criarClienteAdmin();
  const rs = await fetch(`https://api.scryfall.com/sets/${encodeURIComponent(codigo)}`, { headers: UA, cache: "no-store" });
  if (!rs.ok) throw new Error("Coleção não encontrada no Scryfall.");
  const set = (await rs.json()) as SetScryfall;

  const destaques: CartaGaleria[] = [];
  let capa: { url: string; credito: string } | null = null;
  // Sem "is:booster": em coleções novas o Scryfall ainda não marca as cartas de booster e a busca volta vazia
  await pausa();
  const q = encodeURIComponent(`set:${set.code} (r:r or r:m) -is:digital`);
  const rc = await fetch(`https://api.scryfall.com/cards/search?q=${q}&order=edhrec&unique=cards`, { headers: UA, cache: "no-store" });
  if (rc.ok) {
    const { data } = (await rc.json()) as { data: CartaScryfall[] };
    for (const c of data.slice(0, 120)) {
      const face = c.card_faces?.[0];
      const img = c.image_uris ?? face?.image_uris;
      destaques.push({ nome: c.name, imagem: img?.normal ?? null, cor: corDe(c.colors ?? face?.colors, c.type_line), raridade: c.rarity, tipo: c.type_line });
    }
  }
  // Capa provisória: a primeira opção de arte inédita da coleção (nunca reimpressão)
  await pausa();
  const opcoes = await opcoesDeArte(set.code).catch(() => []);
  if (opcoes[0]) capa = { url: opcoes[0].url, credito: opcoes[0].credito };

  const { data: atual } = await db.from("colecoes").select("arte_url, arte_credito").eq("codigo", set.code).maybeSingle();
  const manterArte = atual?.arte_url && !atual.arte_url.includes("scryfall");
  await db.from("colecoes").upsert({
    codigo: set.code,
    nome: set.name,
    icone_svg: set.icon_svg_uri ?? null,
    lancamento: set.released_at ?? null,
    total_cartas: set.card_count,
    tipo: set.set_type,
    ...(destaques.length ? { destaques } : {}),
    arte_url: manterArte || (atual?.arte_url && !capa) ? atual!.arte_url : (capa?.url ?? null),
    arte_credito: manterArte || (atual?.arte_url && !capa) ? atual!.arte_credito : (capa?.credito ?? null),
    atualizado_em: new Date().toISOString(),
  });
  return { codigo: set.code, nome: set.name };
}

export type OpcaoArte = { url: string; credito: string; nome: string };

/**
 * Artes que pertencem à coleção: raras e míticas impressas pela primeira vez nela
 * (sem reimpressões nem terrenos), uma por ilustração.
 */
export async function opcoesDeArte(codigo: string): Promise<OpcaoArte[]> {
  const q = encodeURIComponent(`set:${codigo} (r:m or r:r) not:reprint -t:land -is:digital`);
  const r = await fetch(`https://api.scryfall.com/cards/search?q=${q}&order=edhrec&unique=art`, { headers: UA, cache: "no-store" });
  if (!r.ok) return [];
  const { data } = (await r.json()) as { data: CartaScryfall[] };
  return data
    .map((c) => {
      const img = c.image_uris ?? c.card_faces?.[0]?.image_uris;
      return img?.art_crop
        ? { url: img.art_crop, nome: c.name, credito: `${c.name} · ilustração de ${c.artist ?? "artista não informado"} · © Wizards of the Coast` }
        : null;
    })
    .filter(Boolean)
    .slice(0, 30) as OpcaoArte[];
}

/** Aceita o link do Cube Cobra (list, overview, playtest…) ou só o id. */
export function idDoCubo(entrada: string) {
  const t = entrada.trim();
  const m = t.match(/cubecobra\.com\/cube\/(?:[a-z]+\/)?(?:[a-z]+\/)?([A-Za-z0-9_-]+)/i);
  const id = m ? m[1] : t;
  return /^[A-Za-z0-9_-]{2,64}$/.test(id) ? id : null;
}

type CartaCubo = {
  colorCategory?: string;
  type_line?: string;
  cmc?: number;
  details?: { name?: string; image_normal?: string; colorcategory?: string; type?: string; cmc?: number };
};

export type CuboResumo = { id: string; cubecobra_id: string; nome: string; dono: string | null; imagem_url: string | null; total_cartas: number };

/** Busca o cubo no Cube Cobra e guarda a lista mais recente. */
export async function importarCubo(entrada: string): Promise<CuboResumo> {
  const id = idDoCubo(entrada);
  if (!id) throw new Error("Link do Cube Cobra inválido.");
  const r = await fetch(`https://cubecobra.com/cube/api/cubeJSON/${encodeURIComponent(id)}`, { headers: UA, cache: "no-store" });
  if (!r.ok) throw new Error("Cubo não encontrado no Cube Cobra (confira se ele é público).");
  const j = (await r.json()) as {
    shortId?: string;
    name: string;
    description?: string;
    owner?: { username?: string } | string;
    image?: { uri?: string; artist?: string; imageName?: string };
    cards?: { mainboard?: CartaCubo[] };
  };
  const cartas: CartaGaleria[] = (j.cards?.mainboard ?? []).map((c) => ({
    nome: c.details?.name ?? "?",
    imagem: c.details?.image_normal ?? null,
    cor: c.colorCategory ?? c.details?.colorcategory ?? "Colorless",
    tipo: c.type_line ?? c.details?.type,
    cmc: c.cmc ?? c.details?.cmc,
  }));
  const nomeCarta = j.image?.imageName?.replace(/\s*\[.*\]$/, "").replace(/\b\w/g, (l) => l.toUpperCase());
  const dados = {
    cubecobra_id: j.shortId || id,
    nome: j.name.trim(),
    dono: typeof j.owner === "string" ? j.owner : (j.owner?.username ?? null),
    descricao: j.description?.slice(0, 2000) || null,
    imagem_url: j.image?.uri ?? null,
    imagem_credito: j.image?.artist ? `${nomeCarta ? `${nomeCarta} · ` : ""}ilustração de ${j.image.artist} · © Wizards of the Coast` : null,
    total_cartas: cartas.length,
    cartas,
    atualizado_em: new Date().toISOString(),
  };
  const { data, error } = await criarClienteAdmin().from("cubos").upsert(dados, { onConflict: "cubecobra_id" }).select("id, cubecobra_id, nome, dono, imagem_url, total_cartas").single();
  if (error) throw new Error("Não foi possível guardar o cubo.");
  return data as CuboResumo;
}

/** Congela a lista do cubo no evento (só na primeira vez, ou quando pedir para atualizar). */
export async function congelarCubo(eventoId: string, cuboId: string, atualizar = false) {
  const db = criarClienteAdmin();
  const { data: ja } = await db.from("evento_cubo").select("cubo_id").eq("evento_id", eventoId).maybeSingle();
  if (ja && ja.cubo_id === cuboId && !atualizar) return;
  const { data: cubo } = await db.from("cubos").select("cartas").eq("id", cuboId).single();
  await db.from("evento_cubo").upsert({ evento_id: eventoId, cubo_id: cuboId, cartas: cubo?.cartas ?? [], congelado_em: new Date().toISOString() });
}

/** Envia uma arte em alta da coleção (substitui a provisória do Scryfall). */
export async function guardarArteColecao(codigo: string, arquivo: File, credito: string) {
  if (arquivo.size > 3.5 * 1024 * 1024) throw new Error("Arte maior que 3,5 MB.");
  if (!/^image\/(png|jpe?g|webp)$/.test(arquivo.type)) throw new Error("Use PNG, JPG ou WebP na arte.");
  const db = criarClienteAdmin();
  const caminho = `${codigo}/${crypto.randomUUID()}.${arquivo.type.split("/")[1].replace("jpeg", "jpg")}`;
  const { error } = await db.storage.from("colecoes").upload(caminho, arquivo, { contentType: arquivo.type });
  if (error) throw new Error("Falha ao enviar a arte.");
  const url = db.storage.from("colecoes").getPublicUrl(caminho).data.publicUrl;
  await db.from("colecoes").update({ arte_url: url, arte_credito: credito || null }).eq("codigo", codigo);
}
