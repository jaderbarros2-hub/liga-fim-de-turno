import "server-only";
import { chaveCarta, type Carta } from "@/lib/decklist";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Dados de cartas vindos do Scryfall (base pública de cartas de Magic).
 * Ficam guardados na tabela `cartas` para não consultar o Scryfall de novo.
 */

type CartaScryfall = {
  name: string;
  type_line?: string;
  mana_cost?: string;
  cmc?: number;
  colors?: string[];
  oracle_text?: string;
  legalities?: Record<string, string>;
  image_uris?: { small?: string; normal?: string };
  card_faces?: { name: string; type_line?: string; mana_cost?: string; colors?: string[]; oracle_text?: string; image_uris?: { small?: string; normal?: string } }[];
};

function converter(c: CartaScryfall): Carta {
  const face = c.card_faces?.[0];
  const imagens = c.image_uris ?? face?.image_uris;
  const texto = c.oracle_text ?? c.card_faces?.map((f) => f.oracle_text ?? "").join("\n") ?? "";
  return {
    chave: chaveCarta(c.name),
    nome: c.name,
    tipo: c.type_line ?? face?.type_line ?? "",
    custo: c.mana_cost ?? face?.mana_cost ?? null,
    cmc: c.cmc ?? 0,
    cores: c.colors ?? face?.colors ?? [],
    imagem: imagens?.small ?? null,
    imagem_grande: imagens?.normal ?? null,
    legal_pauper: c.legalities?.pauper === "legal",
    qualquer_quantidade: /a deck can have any number of cards named/i.test(texto),
  };
}

/** Devolve um mapa chave → carta. Busca no Scryfall só o que ainda não está guardado. */
export async function buscarCartas(nomes: string[]): Promise<Map<string, Carta>> {
  const db = criarClienteAdmin();
  const chaves = [...new Set(nomes.map(chaveCarta))];
  const mapa = new Map<string, Carta>();
  if (!chaves.length) return mapa;

  const { data: guardadas } = await db.from("cartas").select("*").in("chave", chaves);
  for (const c of (guardadas as Carta[] | null) ?? []) mapa.set(c.chave, c);

  const faltando = nomes.filter((n, i, arr) => !mapa.has(chaveCarta(n)) && arr.findIndex((x) => chaveCarta(x) === chaveCarta(n)) === i);
  for (let i = 0; i < faltando.length; i += 75) {
    const lote = faltando.slice(i, i + 75);
    // Nome de carta dupla ("A // B"): o Scryfall encontra pelo nome da primeira face
    const identificadores = lote.map((n) => ({ name: n.split(" // ")[0] }));
    try {
      const r = await fetch("https://api.scryfall.com/cards/collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "LigaFimDeTurno/1.0",
        },
        body: JSON.stringify({ identifiers: identificadores }),
        cache: "no-store",
      });
      if (!r.ok) {
        console.error("Scryfall:", r.status, await r.text());
        continue;
      }
      const json = (await r.json()) as { data: CartaScryfall[] };
      const novas = json.data.map(converter);
      for (const c of novas) {
        mapa.set(c.chave, c);
        // Também indexa pelo nome da primeira face, como o jogador costuma escrever
        const primeira = chaveCarta(c.nome.split(" // ")[0]);
        if (primeira !== c.chave) mapa.set(primeira, c);
      }
      if (novas.length) await db.from("cartas").upsert(novas, { onConflict: "chave" });
    } catch (e) {
      console.error("Scryfall indisponível:", e);
    }
  }
  return mapa;
}
