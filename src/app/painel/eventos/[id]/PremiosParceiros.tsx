import { botao } from "@/components/Botao";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { criterioTexto, type PremioParceiro } from "@/lib/premiosParceiros";
import {
  adicionarPremioParceiro,
  removerPremioParceiro,
  sortearPremio,
} from "./premiosParceiros";

const CAMPO =
  "min-h-10 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-sm text-gelo focus:border-ciano focus:outline-none";
const ROTULO = "flex flex-col gap-1 text-sm text-texto2";

/** Prêmios extras dos parceiros no painel do evento (cadastro) e nos resultados (sorteio e entrega). */
export function PremiosParceirosPainel({
  eventoId,
  premios,
  parceiros,
  modo,
  mensagem,
}: {
  eventoId: string;
  premios: PremioParceiro[];
  parceiros: { id: string; nome: string }[];
  modo: "cadastro" | "resultado";
  mensagem?: { tipo: "ok" | "erro"; texto: string } | null;
}) {
  return (
    <section
      id="premios-parceiros"
      className="flex scroll-mt-24 flex-col gap-4 rounded-xl border border-borda bg-grafite p-5"
    >
      <div>
        <h2 className="titulo text-3xl">Prêmios extras dos parceiros</h2>
        <p className="text-sm text-texto2">
          Cupons, boosters e brindes oferecidos pelas lojas. Aparecem na página
          do evento com o logo da loja. Por posição: entregue ao publicar o
          resultado. Por sorteio: sorteie aqui depois do resultado.
        </p>
      </div>
      {mensagem && (
        <p
          role={mensagem.tipo === "erro" ? "alert" : "status"}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${mensagem.tipo === "erro" ? "border-erro text-erro" : "border-ciano text-ciano"}`}
        >
          {mensagem.texto}
        </p>
      )}

      {premios.length === 0 ? (
        <p className="text-sm text-cinza">Nenhum prêmio extra neste evento.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-borda rounded-lg ring-1 ring-borda">
          {premios.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm"
            >
              <span className="flex min-w-48 flex-1 flex-col">
                <span className="font-semibold">{p.descricao}</span>
                <span className="text-cinza">
                  {p.parceiro?.nome} · {criterioTexto(p)}
                  {p.validade
                    ? ` · válido até ${p.validade.split("-").reverse().join("/")}`
                    : ""}
                </span>
              </span>
              {p.entregue_em ? (
                <span className="font-semibold text-ciano">
                  Entregue a{" "}
                  {p.jogador?.nick_endstep || p.jogador?.nome || "jogador"}
                </span>
              ) : (
                <span className="text-cinza">Ainda não entregue</span>
              )}
              {modo === "resultado" &&
                p.criterio === "sorteio" &&
                !p.entregue_em && (
                  <form action={sortearPremio}>
                    <input type="hidden" name="evento_id" value={eventoId} />
                    <input type="hidden" name="id" value={p.id} />
                    <BotaoEnviar
                      className={botao("primario", "sm")}
                      pendente="Sorteando…"
                    >
                      Sortear agora
                    </BotaoEnviar>
                  </form>
                )}
              {modo === "cadastro" && !p.entregue_em && (
                <form action={removerPremioParceiro}>
                  <input type="hidden" name="evento_id" value={eventoId} />
                  <input type="hidden" name="id" value={p.id} />
                  <BotaoEnviar
                    className={botao("perigo", "sm")}
                    pendente="Removendo…"
                  >
                    Remover
                  </BotaoEnviar>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {modo === "cadastro" &&
        (parceiros.length === 0 ? (
          <p className="text-sm text-alerta">
            Cadastre uma loja em Painel → Lojas e parceiros para oferecer
            prêmios.
          </p>
        ) : (
          <form
            action={adicionarPremioParceiro}
            className="grid gap-3 rounded-lg border border-borda p-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input type="hidden" name="evento_id" value={eventoId} />
            <label className={ROTULO}>
              Loja
              <select name="parceiro_id" className={CAMPO} required>
                {parceiros.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className={ROTULO}>
              Tipo
              <select name="tipo" className={CAMPO}>
                <option value="cupom">Cupom de desconto</option>
                <option value="booster">Booster</option>
                <option value="brinde">Brinde</option>
              </select>
            </label>
            <label className={ROTULO}>
              Descrição (aparece no site)
              <input
                name="descricao"
                required
                maxLength={120}
                placeholder="Cupom de R$ 100"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Quem ganha
              <select name="criterio" className={CAMPO}>
                <option value="posicao">Uma posição da classificação</option>
                <option value="sorteio">Sorteio entre os participantes</option>
              </select>
            </label>
            <label className={ROTULO}>
              Posição (se for por posição)
              <input
                name="posicao"
                type="number"
                min={1}
                max={64}
                defaultValue={1}
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Valor de referência em R$ (opcional)
              <input
                name="valor"
                inputMode="decimal"
                placeholder="100"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Código do cupom (só o vencedor vê)
              <input
                name="codigo"
                maxLength={60}
                placeholder="LIGA100"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Validade (opcional)
              <input name="validade" type="date" className={CAMPO} />
            </label>
            <div className="flex items-end">
              <BotaoEnviar
                className={botao("primario")}
                pendente="Adicionando…"
              >
                Adicionar prêmio
              </BotaoEnviar>
            </div>
          </form>
        ))}
    </section>
  );
}
