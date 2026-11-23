import "server-only";
import { ehConstruido, NOME_LIGA } from "@/lib/formatos";
import { classificadosPOTY, periodo, ranking } from "@/lib/circuito";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import type { Redes } from "@/lib/perfil";

export type PerfilJogador = {
  id: string;
  nick: string;
  avatar: string | null;
  bio: string | null;
  redes: Redes;
  desde: string;
  mostrarResultados: boolean;
  mostrarDecks: boolean;
  mostrarArtigos: boolean;
  autorId: string | null;
};

export type ResultadoJogador = {
  posicao: number;
  vitorias: number;
  derrotas: number;
  empates: number;
  pontos: number;
  arquetipo: string | null;
  temLista: boolean;
  principal: { qtd: number; nome: string }[] | null; // só do top 8 (lista pública)
  evento: {
    id: string;
    slug: string;
    titulo: string;
    inicio: string;
    tipo: string;
    formato: string;
    colecao: string | null;
  };
};

export type Insignia = {
  id: string;
  titulo: string;
  texto: string;
  nivel: "ouro" | "prata" | "bronze" | "brasa";
  icone:
    | "trofeu"
    | "coroa"
    | "estrela"
    | "escudo"
    | "pena"
    | "chama"
    | "alvo"
    | "diamante";
  vezes?: number;
};

/** Busca pelo nick do Endstep (sem diferenciar maiúsculas) ou, na falta dele, pelo nome do Discord. */
export async function buscarJogador(
  nick: string,
): Promise<PerfilJogador | null> {
  const db = criarClienteAdmin();
  const campos =
    "id, nick_endstep, discord_nome, avatar_url, bio, redes, criado_em, mostrar_resultados, mostrar_decks, mostrar_artigos";
  let { data } = await db
    .from("jogadores")
    .select(campos)
    .ilike("nick_endstep", nick.replace(/[%_]/g, "\\$&"))
    .limit(1)
    .maybeSingle();
  if (!data)
    ({ data } = await db
      .from("jogadores")
      .select(campos)
      .ilike("discord_nome", nick.replace(/[%_]/g, "\\$&"))
      .limit(1)
      .maybeSingle());
  if (!data) return null;
  const { data: autor } = await db
    .from("autores")
    .select("id")
    .eq("jogador_id", data.id)
    .maybeSingle();
  return {
    id: data.id,
    nick: data.nick_endstep || data.discord_nome || nick,
    avatar: data.avatar_url,
    bio: data.bio,
    redes: (data.redes as Redes) ?? {},
    desde: data.criado_em,
    mostrarResultados: data.mostrar_resultados,
    mostrarDecks: data.mostrar_decks,
    mostrarArtigos: data.mostrar_artigos,
    autorId: autor?.id ?? null,
  };
}

/** Resultados publicados do jogador, do mais recente ao mais antigo, com o arquétipo usado. */
export async function resultadosDoJogador(
  jogadorId: string,
): Promise<ResultadoJogador[]> {
  const db = criarClienteAdmin();
  const [{ data: res }, { data: insc }] = await Promise.all([
    db
      .from("resultados")
      .select(
        "posicao, vitorias, derrotas, empates, pontos, evento:eventos!inner(id, slug, titulo, inicio, tipo, formato, colecao, status)",
      )
      .eq("jogador_id", jogadorId)
      .eq("evento.status", "resultados"),
    db
      .from("inscricoes")
      .select("evento_id, deck_principal, arquetipo:arquetipos(nome)")
      .eq("jogador_id", jogadorId)
      .eq("status", "confirmada"),
  ]);
  const porEvento = new Map(
    (
      (insc as unknown as {
        evento_id: string;
        deck_principal: unknown[] | null;
        arquetipo: { nome: string } | null;
      }[]) ?? []
    ).map((i) => [i.evento_id, i]),
  );
  return (
    (res as unknown as Omit<
      ResultadoJogador,
      "arquetipo" | "temLista" | "principal"
    >[]) ?? []
  )
    .map((r) => {
      const i = porEvento.get(r.evento.id);
      const temLista = Boolean(i?.deck_principal?.length);
      return {
        ...r,
        arquetipo: i?.arquetipo?.nome ?? null,
        temLista,
        principal:
          temLista && r.posicao <= 8
            ? (i!.deck_principal as { qtd: number; nome: string }[])
            : null,
      };
    })
    .sort((a, b) => b.evento.inicio.localeCompare(a.evento.inicio));
}

/** Insígnias calculadas a partir dos resultados (não precisam de cadastro manual). */
export async function insigniasDoJogador(
  perfil: PerfilJogador,
  resultados: ResultadoJogador[],
): Promise<Insignia[]> {
  const lista: Insignia[] = [];
  const conta = (f: (r: ResultadoJogador) => boolean) =>
    resultados.filter(f).length;

  const poty = resultados.filter(
    (r) => r.evento.tipo === "player_of_the_year" && r.posicao === 1,
  );
  if (poty.length)
    lista.push({
      id: "poty",
      titulo: "Player of the Year",
      texto: poty.map((r) => periodo(r.evento.inicio).temporada).join(", "),
      nivel: "ouro",
      icone: "coroa",
      vezes: poty.length,
    });

  const finais = resultados.filter(
    (r) => r.evento.tipo === "final_trimestre" && r.posicao === 1,
  );
  if (finais.length)
    lista.push({
      id: "campeao-trimestre",
      titulo: "Campeão do Trimestre",
      texto: finais
        .map(
          (r) =>
            `T${periodo(r.evento.inicio).trimestre} ${periodo(r.evento.inicio).temporada}`,
        )
        .join(", "),
      nivel: "ouro",
      icone: "trofeu",
      vezes: finais.length,
    });
  const vices = conta(
    (r) => r.evento.tipo === "final_trimestre" && r.posicao === 2,
  );
  if (vices)
    lista.push({
      id: "vice-trimestre",
      titulo: "Vice do Trimestre",
      texto: "Segundo lugar numa Final do Trimestre",
      nivel: "prata",
      icone: "trofeu",
      vezes: vices,
    });

  const titulos = conta((r) => r.evento.tipo === "etapa" && r.posicao === 1);
  if (titulos)
    lista.push({
      id: "campeao-etapa",
      titulo: "Campeão de etapa",
      texto: `${titulos} ${titulos === 1 ? "título" : "títulos"} em etapas da liga`,
      nivel: "ouro",
      icone: "estrela",
      vezes: titulos,
    });

  // Classificado ao Player of the Year e líder do ranking na temporada atual
  const agora = periodo(new Date().toISOString());
  for (const liga of ["pauper", "premodern", "limited"] as const) {
    const nome = NOME_LIGA[liga];
    const [poty, rank] = await Promise.all([
      classificadosPOTY(liga, agora.temporada),
      ranking(liga, agora.temporada, agora.trimestre),
    ]);
    const vaga = poty.vagas.find((v) => v.id === perfil.id);
    if (vaga)
      lista.push({
        id: `poty-${liga}`,
        titulo: `Classificado POTY ${nome}`,
        texto: `${vaga.motivo} · temporada ${agora.temporada}`,
        nivel: "brasa",
        icone: "escudo",
      });
    if (rank[0]?.id === perfil.id)
      lista.push({
        id: `lider-${liga}`,
        titulo: `Líder do ranking ${nome}`,
        texto: `${agora.trimestre}º trimestre de ${agora.temporada}`,
        nivel: "brasa",
        icone: "chama",
      });
  }

  const invicto = conta(
    (r) =>
      !ehConstruido(r.evento.formato) && r.vitorias >= 3 && r.derrotas === 0,
  );
  if (invicto)
    lista.push({
      id: "3-0",
      titulo: "3-0 no Limited",
      texto: "Campanha perfeita num pod",
      nivel: "prata",
      icone: "alvo",
      vezes: invicto,
    });

  const top8 = conta((r) => r.posicao <= 8);
  if (top8 >= 3)
    lista.push({
      id: "top8",
      titulo: "Top 8 recorrente",
      texto: `${top8} vezes no top 8`,
      nivel: "prata",
      icone: "estrela",
      vezes: top8,
    });

  // Especialista: o arquétipo com que mais chegou ao top 8 (mínimo 2 vezes)
  const porArq = new Map<string, number>();
  for (const r of resultados)
    if (r.arquetipo && r.posicao <= 8)
      porArq.set(r.arquetipo, (porArq.get(r.arquetipo) ?? 0) + 1);
  const [arq, vezesArq] =
    [...porArq.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (arq && vezesArq >= 2)
    lista.push({
      id: "especialista",
      titulo: `Especialista em ${arq}`,
      texto: `${vezesArq} top 8 com o deck`,
      nivel: "bronze",
      icone: "alvo",
      vezes: vezesArq,
    });

  const etapas = resultados.length;
  const veterano =
    etapas >= 50 ? 50 : etapas >= 25 ? 25 : etapas >= 10 ? 10 : 0;
  if (veterano)
    lista.push({
      id: "veterano",
      titulo: `Veterano ${veterano}+`,
      texto: `${etapas} etapas jogadas`,
      nivel: veterano >= 25 ? "prata" : "bronze",
      icone: "escudo",
    });

  if (perfil.autorId)
    lista.push({
      id: "autor",
      titulo: "Autor do blog",
      texto: "Escreve para o portal da liga",
      nivel: "brasa",
      icone: "pena",
    });
  if (new Date(perfil.desde).getFullYear() <= 2026)
    lista.push({
      id: "fundador",
      titulo: "Jogador fundador",
      texto: "Na liga desde a primeira temporada",
      nivel: "bronze",
      icone: "escudo",
    });
  return lista;
}
