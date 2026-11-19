import { botao } from "@/components/Botao";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { FormularioEvento } from "../FormularioEvento";
import { escreverPerguntas } from "@/lib/eventoInfo";
import { confirmarManual } from "./inscritos";

type Inscrito = {
  id: string;
  status: string;
  deck_nome: string | null;
  arquetipo: { nome: string } | null;
  jogador: {
    nome: string | null;
    nick_endstep: string | null;
    discord_nome: string | null;
  } | null;
};

const NOMES_INSCRICAO: Record<string, string> = {
  confirmada: "Confirmada",
  aguardando_pagamento: "Aguardando Pix",
  expirada: "Pix expirado",
  cancelada: "Cancelada",
  reembolsada: "Reembolsada",
};

/** ISO → "AAAA-MM-DDTHH:MM" no horário de Brasília, para o campo datetime-local. */
function paraCampo(iso: string) {
  const d = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return d.toISOString().slice(0, 16);
}

export default async function EditarEvento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await criarClienteServidor();
  const [{ data: evento }, { data: ligas }, { data: link }, { data: lojas }] =
    await Promise.all([
      supabase
        .from("eventos")
        .select(
          "*, colecao_info:colecoes(nome, icone_svg), cubo_info:cubos(cubecobra_id, nome, dono, imagem_url, total_cartas)",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("ligas").select("id, nome").order("id"),
      supabase
        .from("evento_links")
        .select("link_endstep")
        .eq("evento_id", id)
        .maybeSingle(),
      supabase
        .from("parceiros")
        .select("id, nome, cidade")
        .eq("ativo", true)
        .eq("sede_eventos", true)
        .order("nome"),
    ]);
  if (!evento) notFound();

  const { data: inscricoes } = await supabase
    .from("inscricoes")
    .select(
      "id, status, deck_nome, arquetipo:arquetipos(nome), jogador:jogadores(nome, nick_endstep, discord_nome)",
    )
    .eq("evento_id", id)
    .order("criado_em");
  const confirmadas = (inscricoes ?? []).filter(
    (i) => i.status === "confirmada",
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href="/painel/eventos" className="text-sm">
        ← Eventos
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-5xl">{evento.titulo}</h1>
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link href={`/painel/eventos/${evento.id}/resultados`}>
            Resultados e prêmios
          </Link>
          <Link href={`/eventos/${evento.slug}`}>Ver página pública</Link>
        </div>
      </div>
      <section className="flex flex-col gap-3 rounded-xl border border-borda bg-grafite p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="titulo text-3xl">Inscritos</h2>
          <span className="text-sm text-cinza">
            {confirmadas.length} confirmados ·{" "}
            {(inscricoes ?? []).length - confirmadas.length} outros
          </span>
        </div>
        {(inscricoes ?? []).length === 0 ? (
          <p className="text-sm text-texto2">Nenhuma inscrição ainda.</p>
        ) : (
          <ul className="flex flex-col border-t border-borda text-sm">
            {(inscricoes as unknown as Inscrito[]).map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-borda py-2"
              >
                <span className="min-w-40 flex-1 font-semibold">
                  {i.jogador?.nick_endstep || i.jogador?.nome}
                </span>
                <span className="text-cinza">{i.jogador?.discord_nome}</span>
                {evento.formato === "pauper" &&
                  (i.deck_nome ? (
                    <Link
                      href={`/painel/eventos/${evento.id}/deck/${i.id}`}
                      className="text-sm"
                    >
                      {i.arquetipo?.nome ?? i.deck_nome}
                    </Link>
                  ) : (
                    <span className="text-sm text-cinza">sem deck</span>
                  ))}
                <span
                  className={
                    i.status === "confirmada" ? "text-ciano" : "text-alerta"
                  }
                >
                  {NOMES_INSCRICAO[i.status] ?? i.status}
                </span>
                {i.status !== "confirmada" && i.status !== "reembolsada" && (
                  <form action={confirmarManual}>
                    <input type="hidden" name="inscricao_id" value={i.id} />
                    <input type="hidden" name="evento_id" value={evento.id} />
                    <BotaoEnviar
                      className={botao("secundario")}
                      pendente="Confirmando…"
                    >
                      Confirmar manualmente
                    </BotaoEnviar>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <FormularioEvento
        ligas={ligas ?? []}
        lojas={lojas ?? []}
        valores={{
          id: evento.id,
          titulo: evento.titulo,
          liga_id: evento.liga_id,
          formato: evento.formato,
          tipo: evento.tipo ?? "etapa",
          colecao: evento.colecao ?? "",
          inicio: paraCampo(evento.inicio),
          inscricoes_ate: paraCampo(evento.inscricoes_ate),
          modalidade: evento.modalidade,
          local: evento.local ?? "",
          loja_id: evento.loja_id ?? "",
          valor: (evento.valor_centavos / 100).toFixed(2),
          vagas: evento.vagas ? String(evento.vagas) : "",
          minimo: String(evento.minimo),
          percentual_premio: String(evento.percentual_premio),
          detalhes: evento.detalhes ?? "",
          perguntas: escreverPerguntas(
            (evento.perguntas as { p: string; r: string }[] | null) ?? [],
          ),
          status: evento.status,
          link_endstep: link?.link_endstep ?? "",
          colecao_codigo: evento.colecao_codigo ?? "",
          colecao_icone: evento.colecao_info?.icone_svg ?? null,
          pacotes: evento.pacotes ? String(evento.pacotes) : "",
          cubo_link: evento.cubo_info
            ? `https://cubecobra.com/cube/list/${evento.cubo_info.cubecobra_id}`
            : "",
          cubo: evento.cubo_info ?? null,
        }}
      />
    </div>
  );
}
