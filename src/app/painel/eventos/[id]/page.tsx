import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { FormularioEvento } from "../FormularioEvento";

/** ISO → "AAAA-MM-DDTHH:MM" no horário de Brasília, para o campo datetime-local. */
function paraCampo(iso: string) {
  const d = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return d.toISOString().slice(0, 16);
}

export default async function EditarEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await criarClienteServidor();
  const [{ data: evento }, { data: ligas }, { data: link }] = await Promise.all([
    supabase.from("eventos").select("*").eq("id", id).maybeSingle(),
    supabase.from("ligas").select("id, nome").order("id"),
    supabase.from("evento_links").select("link_endstep").eq("evento_id", id).maybeSingle(),
  ]);
  if (!evento) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/painel/eventos" className="text-sm">
        ← Eventos
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-5xl">{evento.titulo}</h1>
        <Link href={`/eventos/${evento.slug}`} className="text-sm font-semibold">
          Ver página pública
        </Link>
      </div>
      <FormularioEvento
        ligas={ligas ?? []}
        valores={{
          id: evento.id,
          titulo: evento.titulo,
          liga_id: evento.liga_id,
          formato: evento.formato,
          colecao: evento.colecao ?? "",
          inicio: paraCampo(evento.inicio),
          inscricoes_ate: paraCampo(evento.inscricoes_ate),
          modalidade: evento.modalidade,
          local: evento.local ?? "",
          valor: (evento.valor_centavos / 100).toFixed(2),
          vagas: evento.vagas ? String(evento.vagas) : "",
          minimo: String(evento.minimo),
          percentual_premio: String(evento.percentual_premio),
          detalhes: evento.detalhes ?? "",
          status: evento.status,
          link_endstep: link?.link_endstep ?? "",
        }}
      />
    </div>
  );
}
