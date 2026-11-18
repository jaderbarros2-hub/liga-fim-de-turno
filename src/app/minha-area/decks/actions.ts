"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { conferirPauper, lerLista, total } from "@/lib/decklist";
import { buscarCartas } from "@/lib/scryfall";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoDeck = { erro?: string };

async function usuario() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/minha-area/decks");
  return user.id;
}

/** Cria ou atualiza um deck a partir do texto colado (ou do .txt exportado do Endstep). */
export async function salvarDeck(_: EstadoDeck, form: FormData): Promise<EstadoDeck> {
  const jogadorId = await usuario();
  const id = String(form.get("id") ?? "");
  const nome = String(form.get("nome") ?? "").trim();
  const arquetipoId = Number(form.get("arquetipo_id")) || null;
  const texto = String(form.get("lista") ?? "");

  if (!nome) return { erro: "Dê um nome ao deck." };
  if (!arquetipoId) return { erro: "Escolha o arquétipo." };
  const lista = lerLista(texto);
  if (!lista.principal.length) return { erro: "Não encontrei cartas na lista. Cole o texto exportado do Endstep." };

  const cartas = await buscarCartas([...lista.principal, ...lista.sideboard].map((i) => i.nome));
  if (!cartas.size) return { erro: "Não foi possível consultar as cartas agora. Tente de novo em instantes." };
  const problemas = conferirPauper(lista, cartas);

  const dados = {
    jogador_id: jogadorId,
    nome,
    formato: "pauper",
    arquetipo_id: arquetipoId,
    principal: lista.principal,
    sideboard: lista.sideboard,
    qtd_principal: total(lista.principal),
    qtd_sideboard: total(lista.sideboard),
    legal: problemas.length === 0,
    problemas,
    atualizado_em: new Date().toISOString(),
  };

  const db = criarClienteAdmin();
  let deckId = id;
  if (id) {
    const { error } = await db.from("decks").update(dados).eq("id", id).eq("jogador_id", jogadorId);
    if (error) return { erro: "Não foi possível salvar o deck." };
  } else {
    const { data, error } = await db.from("decks").insert(dados).select("id").single();
    if (error || !data) return { erro: "Não foi possível salvar o deck." };
    deckId = data.id;
  }
  revalidatePath("/minha-area/decks");
  redirect(`/minha-area/decks/${deckId}`);
}

export async function apagarDeck(form: FormData) {
  const jogadorId = await usuario();
  const id = String(form.get("id"));
  await criarClienteAdmin().from("decks").delete().eq("id", id).eq("jogador_id", jogadorId);
  revalidatePath("/minha-area/decks");
  redirect("/minha-area?aba=decks");
}

/** Escolhe o deck do evento: guarda uma cópia congelada da lista na inscrição. Fecha no início do evento. */
export async function escolherDeckDoEvento(form: FormData) {
  const jogadorId = await usuario();
  const slug = String(form.get("slug"));
  const deckId = String(form.get("deck_id"));
  const db = criarClienteAdmin();

  const { data: evento } = await db.from("eventos").select("id, inicio").eq("slug", slug).single();
  if (!evento || new Date(evento.inicio).getTime() <= Date.now()) redirect(`/eventos/${slug}?aviso=deck-fechado`);

  const { data: deck } = await db
    .from("decks")
    .select("id, nome, arquetipo_id, principal, sideboard, legal")
    .eq("id", deckId)
    .eq("jogador_id", jogadorId)
    .single();
  if (!deck?.legal) redirect(`/eventos/${slug}?aviso=deck-invalido`);

  await db
    .from("inscricoes")
    .update({
      deck_id: deck.id,
      deck_nome: deck.nome,
      arquetipo_id: deck.arquetipo_id,
      deck_principal: deck.principal,
      deck_sideboard: deck.sideboard,
      deck_enviado_em: new Date().toISOString(),
    })
    .eq("evento_id", evento.id)
    .eq("jogador_id", jogadorId)
    .in("status", ["aguardando_pagamento", "confirmada"]);

  revalidatePath(`/eventos/${slug}`);
  redirect(`/eventos/${slug}`);
}
