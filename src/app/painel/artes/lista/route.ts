import { NextResponse, type NextRequest } from "next/server";
import { usuarioAtual } from "@/lib/dados";
import { montarLista, textoCardsTxt, type GrupoLista } from "@/lib/listaArtes";

export const dynamic = "force-dynamic";

const GRUPOS: GrupoLista[] = ["pauper", "premodern", "limited"];

/** GET /painel/artes/lista?grupo=pauper&quantidade=150&tipo=txt|json */
export async function GET(req: NextRequest) {
  const jogador = await usuarioAtual();
  if (!jogador || jogador.papel !== "organizador") {
    return NextResponse.json(
      { erro: "Só a organização pode gerar listas." },
      { status: 403 },
    );
  }
  const p = req.nextUrl.searchParams;
  const grupo = GRUPOS.find((g) => g === p.get("grupo")) ?? "pauper";
  const quantidade = Math.min(
    Math.max(Number(p.get("quantidade")) || 100, 10),
    500,
  );
  const colecoes = (p.get("colecoes") ?? "")
    .split(/[\s,;]+/)
    .map((c) => c.trim().toLowerCase())
    .filter((c) => /^[a-z0-9]{2,6}$/.test(c));
  const tipo = p.get("tipo") === "json" ? "json" : "txt";

  try {
    const { consulta, itens } = await montarLista(grupo, quantidade, {
      colecoes,
      soEpoca: p.get("epoca") === "1",
      extra: p.get("extra") ?? "",
    });
    if (!itens.length) {
      return new NextResponse(
        `Nenhuma carta nova encontrada para esta busca:\n${consulta}\n\nVolte ao painel e ajuste os filtros.`,
        {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }
    const corpo =
      tipo === "json"
        ? JSON.stringify(
            { grupo, consulta, gerado_em: new Date().toISOString(), itens },
            null,
            1,
          )
        : textoCardsTxt(itens);
    return new NextResponse(corpo, {
      headers: {
        "Content-Type":
          tipo === "json"
            ? "application/json; charset=utf-8"
            : "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${tipo === "json" ? `lista-${grupo}.json` : "cards.txt"}"`,
      },
    });
  } catch (e) {
    return new NextResponse(
      `Não foi possível consultar o Scryfall: ${e instanceof Error ? e.message : String(e)}\n\nVolte ao painel e tente de novo; se repetir, ajuste o filtro extra.`,
      { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}
