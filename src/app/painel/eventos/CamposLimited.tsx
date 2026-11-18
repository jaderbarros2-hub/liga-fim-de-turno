"use client";

import { useState, useTransition } from "react";
import { buscarColecoes, previsualizarCubo } from "./actions";

const campo = "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo focus:border-ciano focus:outline-none";

type Colecao = { codigo: string; nome: string; icone_svg: string | null; lancamento: string | null };
type Cubo = { cubecobra_id: string; nome: string; dono: string | null; imagem_url: string | null; total_cartas: number };

/** Campos do Limited: coleção (draft e selado, busca no Scryfall) ou cubo (link do Cube Cobra). */
export function CamposLimited({
  formato,
  inicial,
}: {
  formato: string;
  inicial: { colecao_codigo: string; colecao_nome: string; colecao_icone: string | null; pacotes: string; cubo_link: string; cubo: Cubo | null };
}) {
  const [colecao, setColecao] = useState<Colecao | null>(
    inicial.colecao_codigo ? { codigo: inicial.colecao_codigo, nome: inicial.colecao_nome, icone_svg: inicial.colecao_icone, lancamento: null } : null,
  );
  const [termo, setTermo] = useState("");
  const [opcoes, setOpcoes] = useState<Colecao[]>([]);
  const [cubo, setCubo] = useState<Cubo | null>(inicial.cubo);
  const [link, setLink] = useState(inicial.cubo_link);
  const [erro, setErro] = useState("");
  const [carregando, iniciar] = useTransition();

  if (formato === "pauper") return null;

  if (formato === "cubo") {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-borda p-4 md:col-span-2">
        <label htmlFor="cubo_link" className="text-sm font-semibold">
          Cubo do Cube Cobra
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="cubo_link"
            name="cubo_link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://cubecobra.com/cube/list/LSVCube"
            className={`${campo} flex-1`}
          />
          <button
            type="button"
            disabled={!link || carregando}
            onClick={() =>
              iniciar(async () => {
                setErro("");
                const r = await previsualizarCubo(link);
                if (r.cubo) setCubo(r.cubo);
                else setErro(r.erro ?? "Não foi possível carregar.");
              })
            }
            className="min-h-11 rounded-lg px-4 text-sm font-semibold ring-1 ring-borda-forte hover:ring-ciano disabled:opacity-50"
          >
            {carregando ? "Carregando…" : "Carregar cubo"}
          </button>
        </div>
        {cubo && (
          <div className="flex items-center gap-4 rounded-md bg-grafite p-3 ring-1 ring-borda">
            {cubo.imagem_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cubo.imagem_url} alt="" className="h-14 w-20 rounded object-cover" />
            )}
            <span className="flex flex-col text-sm">
              <strong>{cubo.nome}</strong>
              <span className="text-cinza">
                {cubo.total_cartas} cartas{cubo.dono ? ` · curadoria de ${cubo.dono}` : ""}
              </span>
            </span>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="atualizar_lista" /> Atualizar a lista congelada deste evento com a versão atual do Cube Cobra
        </label>
        <span className="text-xs text-cinza">A lista é congelada na primeira vez que o evento é salvo, para o histórico mostrar o cubo que foi jogado.</span>
        {erro && <span className="text-sm text-erro">{erro}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-borda p-4 md:col-span-2">
      <span className="text-sm font-semibold">Coleção do {formato === "draft" ? "draft" : "selado"}</span>
      <input type="hidden" name="colecao_codigo" value={colecao?.codigo ?? ""} />
      {colecao ? (
        <div className="flex items-center gap-3 rounded-md bg-grafite p-3 ring-1 ring-borda">
          {colecao.icone_svg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={colecao.icone_svg} alt="" className="h-8 w-8 invert" />
          )}
          <span className="flex flex-1 flex-col text-sm">
            <strong>{colecao.nome}</strong>
            <span className="uppercase text-cinza">{colecao.codigo}</span>
          </span>
          <button type="button" onClick={() => setColecao(null)} className="text-sm font-semibold text-ciano">
            Trocar
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Nome ou código da coleção (ex.: Lorwyn, ecl)"
              className={`${campo} flex-1`}
            />
            <button
              type="button"
              disabled={carregando}
              onClick={() =>
                iniciar(async () => {
                  setErro("");
                  const r = await buscarColecoes(termo);
                  if (r.lista) setOpcoes(r.lista);
                  else setErro(r.erro ?? "Falha na busca.");
                })
              }
              className="min-h-11 rounded-lg px-4 text-sm font-semibold ring-1 ring-borda-forte hover:ring-ciano disabled:opacity-50"
            >
              {carregando ? "Buscando…" : "Buscar"}
            </button>
          </div>
          {opcoes.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {opcoes.map((o) => (
                <li key={o.codigo}>
                  <button
                    type="button"
                    onClick={() => setColecao(o)}
                    className="flex w-full items-center gap-3 rounded-md bg-grafite p-2.5 text-left text-sm ring-1 ring-borda hover:ring-ciano"
                  >
                    {o.icone_svg && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.icone_svg} alt="" className="h-6 w-6 invert" />
                    )}
                    <span className="flex flex-col">
                      <span className="font-semibold">{o.nome}</span>
                      <span className="text-xs text-cinza">
                        {o.codigo.toUpperCase()}
                        {o.lancamento ? ` · ${o.lancamento.slice(0, 4)}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Boosters
          <input name="pacotes" type="number" min={1} max={12} defaultValue={inicial.pacotes || (formato === "draft" ? 3 : 6)} className={campo} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Arte da coleção em alta (opcional)
          <input type="file" name="arte_colecao" accept="image/png,image/jpeg,image/webp" className="text-sm font-normal" />
        </label>
      </div>
      <input name="arte_credito" placeholder="Crédito da arte (ex.: Carta · ilustração de Artista · © Wizards of the Coast)" className={campo} />
      <span className="text-xs text-cinza">Sem arte enviada, o portal usa a arte de uma mítica da coleção (do Scryfall).</span>
      {erro && <span className="text-sm text-erro">{erro}</span>}
    </div>
  );
}
