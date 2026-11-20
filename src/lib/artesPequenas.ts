/**
 * Ilustrações do Scryfall (art_crop, ~626 px) para espaços pequenos: cartões de evento,
 * cartões das ligas, miniaturas. Os banners grandes continuam no banco em alta resolução.
 *
 * Pauper e Premodern: as staples do formato (staples.ts); no Premodern, sempre a arte original (até 2003). Limited: raras e míticas das
 * últimas coleções. A busca fica em cache por 7 dias; se o Scryfall falhar, usa o banco.
 */
import { cache } from "react";
import {
  BANCO,
  capaDoEvento,
  creditoArte,
  grupoDoFormato,
  hash,
  srcArte,
  type ArteBanco,
  type GrupoArte,
} from "./artes";
import { SEM_ESPECIAIS } from "./listaArtes";
import { criarClienteAdmin } from "./supabase/admin";
import { STAPLES } from "./staples";

const API = "https://api.scryfall.com";
const UMA_SEMANA = 60 * 60 * 24 * 7;
const CABECALHOS = {
  "User-Agent": "LigaFimDeTurno/1.0 (artes do portal)",
  Accept: "application/json",
};

type CartaScryfall = {
  name: string;
  artist?: string;
  set_name: string;
  image_uris?: { art_crop?: string };
  card_faces?: {
    name: string;
    artist?: string;
    image_uris?: { art_crop?: string };
  }[];
};

async function scryfall<T>(caminho: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${caminho}`, {
      headers: CABECALHOS,
      next: { revalidate: UMA_SEMANA, tags: ["artes-scryfall"] },
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

async function ultimasColecoes(n = 3) {
  const j = await scryfall<{
    data: {
      code: string;
      set_type: string;
      digital: boolean;
      released_at?: string;
    }[];
  }>("/sets");
  const hoje = new Date().toISOString().slice(0, 10);
  return (j?.data ?? [])
    .filter(
      (s) =>
        s.set_type === "expansion" &&
        !s.digital &&
        s.released_at &&
        s.released_at <= hoje,
    )
    .sort((a, b) => (b.released_at ?? "").localeCompare(a.released_at ?? ""))
    .slice(0, n)
    .map((s) => s.code);
}

function paraArte(c: CartaScryfall, grupo: GrupoArte): ArteBanco | null {
  const face = c.card_faces?.[0];
  const url = c.image_uris?.art_crop ?? face?.image_uris?.art_crop;
  const artista = c.artist ?? face?.artist;
  if (!url || !artista) return null;
  const carta = face?.name ?? c.name;
  return {
    arquivo: `scryfall-${carta.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    carta,
    artista,
    colecao: c.set_name,
    grupo,
    largura: 626,
    altura: 457,
    foco: "50% 40%",
    url,
  };
}

async function buscar(q: string, ordem: string, preferir = "newest") {
  const params = new URLSearchParams({
    q: `${q} prefer:${preferir}`,
    unique: "cards",
    order: ordem,
  });
  const j = await scryfall<{ data: CartaScryfall[] }>(
    `/cards/search?${params}`,
  );
  return j?.data ?? [];
}

/** 40 cartas variadas dos cubos cadastrados (Cube Cobra), sem terrenos básicos. */
async function cartasDosCubos(): Promise<string[]> {
  try {
    const { data } = await criarClienteAdmin()
      .from("cubos")
      .select("cartas")
      .limit(5);
    const nomes = (data ?? [])
      .flatMap((c) => (c.cartas ?? []) as { nome?: string; tipo?: string }[])
      .filter(
        (c) => c.nome && c.nome !== "?" && !/Basic Land/i.test(c.tipo ?? ""),
      )
      .map((c) => c.nome!.split(" // ")[0]);
    const unicos = [...new Set(nomes)];
    // Amostra espalhada pela lista (não só as primeiras cartas de uma cor)
    const passo = Math.max(1, Math.floor(unicos.length / 40));
    return unicos.filter((_, i) => i % passo === 0).slice(0, 40);
  } catch {
    return [];
  }
}

const aspas = (nome: string) => `!"${nome.replace(/"/g, "")}"`;

/** Lista de ilustrações pequenas do grupo (em cache). */
export const artesPequenas = cache(
  async (grupo: GrupoArte): Promise<ArteBanco[]> => {
    let cartas: CartaScryfall[] = [];
    if (grupo === "pauper" || grupo === "premodern") {
      const nomes = STAPLES[grupo];
      const partes = [nomes.slice(0, 25), nomes.slice(25)];
      const res = await Promise.all(
        partes.map((p) =>
          grupo === "premodern"
            ? // Premodern: a arte original da época (impressões até Scourge, 2003)
              buscar(
                `(${p.map(aspas).join(" or ")}) ${SEM_ESPECIAIS} date<=2003-07-30`,
                "name",
                "oldest",
              )
            : buscar(`(${p.map(aspas).join(" or ")}) ${SEM_ESPECIAIS}`, "name"),
        ),
      );
      const validos = new Set(nomes.map((n) => n.toLowerCase()));
      cartas = res
        .flat()
        .filter((c) =>
          validos.has((c.card_faces?.[0]?.name ?? c.name).toLowerCase()),
        );
    } else {
      // Limited é variado: raras dos drafts recentes + cartas dos cubos cadastrados
      const [colecoes, nomesCubo] = await Promise.all([
        ultimasColecoes(),
        cartasDosCubos(),
      ]);
      const [recentes, ...doCubo] = await Promise.all([
        colecoes.length
          ? buscar(
              `(${colecoes.map((c) => `e:${c}`).join(" or ")}) (r:rare or r:mythic) ${SEM_ESPECIAIS}`,
              "rarity",
            )
          : Promise.resolve([]),
        ...[nomesCubo.slice(0, 20), nomesCubo.slice(20, 40)]
          .filter((p) => p.length)
          .map((p) =>
            buscar(`(${p.map(aspas).join(" or ")}) ${SEM_ESPECIAIS}`, "name"),
          ),
      ]);
      // Intercala para não ficar tudo de uma fonte só
      const cubo = doCubo.flat();
      const n = Math.max(recentes.length, cubo.length);
      for (let i = 0; i < n; i++) {
        if (cubo[i]) cartas.push(cubo[i]);
        if (recentes[i]) cartas.push(recentes[i]);
      }
    }
    const lista = cartas
      .map((c) => paraArte(c, grupo))
      .filter((a): a is ArteBanco => !!a);
    if (lista.length) return lista;
    // Scryfall indisponível: usa o banco em alta resolução
    const banco = BANCO.filter((a) => a.grupo === grupo);
    return banco.length ? banco : BANCO;
  },
);

/** Sorteio a cada visita, sem repetir. */
export async function sortearPequenas(grupo: GrupoArte, quantidade: number) {
  const lista = [...(await artesPequenas(grupo))];
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return Array.from({ length: quantidade }, (_, i) => lista[i % lista.length]);
}

/** Sempre a mesma ilustração para a mesma chave. */
export async function pequenaFixa(grupo: GrupoArte, chave: string) {
  const lista = await artesPequenas(grupo);
  return lista[hash(chave) % lista.length];
}

/** Capa de cartão de evento: arte da coleção/cubo quando houver; senão uma ilustração fixa do formato. */
export async function capaPequena(evento: Parameters<typeof capaDoEvento>[0]) {
  if (evento.colecao_info?.arte_url || evento.cubo_info?.imagem_url)
    return capaDoEvento(evento);
  const a = await pequenaFixa(
    grupoDoFormato(evento.formato ?? evento.liga.slug),
    evento.id,
  );
  return {
    src: srcArte(a),
    foco: a.foco,
    credito: creditoArte(a),
    artista: a.artista,
  };
}
