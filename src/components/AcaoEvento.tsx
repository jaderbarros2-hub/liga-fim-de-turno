import { BotaoLink } from "@/components/Botao";
import type { Evento } from "@/lib/dados";
import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server";

/** Botão principal da página do evento: muda conforme o momento e a situação do jogador. */
export async function AcaoEvento({ evento, totalInscritos }: { evento: Evento; totalInscritos: number }) {
  const caminho = `/eventos/${evento.slug}`;
  const aviso = (texto: string) => <p className="text-sm text-cinza">{texto}</p>;

  if (evento.status === "cancelado") return aviso("Evento cancelado. Os inscritos recebem reembolso ou crédito.");
  if (evento.status === "resultados")
    return <BotaoLink href={`${caminho}?aba=resultados`}>Ver resultado</BotaoLink>;

  let inscricao: { status: string } | null = null;
  let link: string | null = null;

  if (supabaseConfigurado()) {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("inscricoes")
        .select("status")
        .eq("evento_id", evento.id)
        .eq("jogador_id", user.id)
        .maybeSingle();
      inscricao = data;
      if (data?.status === "confirmada") {
        const { data: l } = await supabase
          .from("evento_links")
          .select("link_endstep")
          .eq("evento_id", evento.id)
          .maybeSingle();
        link = l?.link_endstep ?? null;
      }
    } else if (evento.status === "aberto") {
      return (
        <div className="flex flex-col gap-2">
          <BotaoLink href={`/entrar?voltar=${encodeURIComponent(`${caminho}/inscricao`)}`}>Garantir ingresso</BotaoLink>
          <span className="text-xs text-cinza">Pix com confirmação na hora · cancelamento até 24h antes</span>
        </div>
      );
    }
  }

  if (inscricao?.status === "confirmada") {
    return (
      <div className="flex flex-col gap-2">
        {link ? (
          <BotaoLink href={link} target="_blank" rel="noopener noreferrer">
            Abrir no Endstep
          </BotaoLink>
        ) : (
          aviso("Inscrição confirmada. O link do Endstep aparece aqui assim que a organização liberar.")
        )}
        <a href={`${caminho}/inscricao`} className="text-xs font-semibold text-ciano">
          ✓ Ingresso confirmado · ver ingresso
        </a>
      </div>
    );
  }

  if (evento.status !== "aberto") return aviso("Inscrições encerradas.");

  if (evento.vagas && totalInscritos >= evento.vagas) return aviso("Vagas esgotadas.");

  if (inscricao?.status === "aguardando_pagamento") {
    return (
      <div className="flex flex-col gap-2">
        <BotaoLink href={`${caminho}/inscricao`}>Concluir compra do ingresso</BotaoLink>
        <span className="text-xs text-alerta">Você tem um Pix gerado aguardando pagamento.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <BotaoLink href={`${caminho}/inscricao`}>Garantir ingresso</BotaoLink>
      <span className="text-xs text-cinza">Pix com confirmação na hora · cancelamento até 24h antes</span>
    </div>
  );
}
