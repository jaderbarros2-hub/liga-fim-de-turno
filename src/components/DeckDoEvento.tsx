import { BotaoEnviar } from "@/components/BotaoEnviar";
import Link from "next/link";
import { escolherDeckDoEvento } from "@/app/minha-area/decks/actions";
import type { Evento } from "@/lib/dados";
import { ehConstruido } from "@/lib/formatos";
import {
  criarClienteServidor,
  supabaseConfigurado,
} from "@/lib/supabase/server";

/** Bloco da página do evento: o inscrito escolhe o deck (Pauper) até o início. */
export async function DeckDoEvento({ evento }: { evento: Evento }) {
  if (!ehConstruido(evento.formato) || !supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: insc } = await supabase
    .from("inscricoes")
    .select("status, deck_id, deck_nome, deck_enviado_em")
    .eq("evento_id", evento.id)
    .eq("jogador_id", user.id)
    .maybeSingle();
  // Antes do pagamento, o deck é escolhido no checkout do ingresso; aqui só para quem já tem ingresso
  if (insc?.status !== "confirmada") return null;

  const aberto =
    new Date(evento.inicio).getTime() > Date.now() &&
    ["aberto", "fechado"].includes(evento.status);
  if (!aberto) {
    return (
      <div className="rounded-xl border border-borda bg-grafite p-4 text-sm">
        {insc.deck_nome ? (
          <>
            Deck registrado:{" "}
            <strong className="text-marfim">{insc.deck_nome}</strong>
          </>
        ) : (
          <span className="text-alerta">
            Nenhum deck registrado para este evento.
          </span>
        )}
      </div>
    );
  }

  const { data: decks } = await supabase
    .from("decks")
    .select("id, nome, legal")
    .eq("jogador_id", user.id)
    .eq("formato", evento.formato)
    .order("atualizado_em", { ascending: false });
  const legais = (decks ?? []).filter((d) => d.legal);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-borda bg-grafite p-4 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <strong className="text-marfim">Seu deck para este evento</strong>
        <span className="text-xs text-cinza">pode trocar até o início</span>
      </div>
      {insc.deck_nome ? (
        <p className="text-brasa">✓ {insc.deck_nome}</p>
      ) : (
        <p className="text-alerta">Escolha o deck que você vai jogar.</p>
      )}
      {legais.length ? (
        <form action={escolherDeckDoEvento} className="flex flex-wrap gap-2">
          <input type="hidden" name="slug" value={evento.slug} />
          <select
            name="deck_id"
            defaultValue={insc.deck_id ?? legais[0].id}
            className="min-h-10 flex-1 rounded-lg border border-borda-forte bg-fundo2 px-2 text-marfim"
          >
            {legais.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
          <BotaoEnviar className="min-h-10 rounded-lg border border-borda-forte px-4 font-semibold hover:border-brasa">
            {insc.deck_nome ? "Trocar" : "Registrar"}
          </BotaoEnviar>
        </form>
      ) : null}
      <Link
        href={`/minha-area/decks/novo?formato=${evento.formato}`}
        className="font-semibold"
      >
        {legais.length ? "Importar outro deck" : "Importar meu deck do Endstep"}
      </Link>
    </div>
  );
}
