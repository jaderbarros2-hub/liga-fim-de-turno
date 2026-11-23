import { criarClienteServidor } from "@/lib/supabase/server";
import { FormularioEvento } from "../FormularioEvento";

export default async function NovoEvento() {
  const supabase = await criarClienteServidor();
  const { data: ligas } = await supabase
    .from("ligas")
    .select("id, nome")
    .order("id");
  const { data: lojas } = await supabase
    .from("parceiros")
    .select("id, nome, cidade")
    .eq("ativo", true)
    .eq("sede_eventos", true)
    .order("nome");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="titulo text-5xl">Novo evento</h1>
      <FormularioEvento
        ligas={ligas ?? []}
        lojas={lojas ?? []}
        valores={{
          titulo: "",
          liga_id: ligas?.[0]?.id ?? 1,
          formato: "pauper",
          tipo: "etapa",
          colecao: "",
          inicio: "",
          inscricoes_ate: "",
          modalidade: "online",
          local: "",
          valor: "15",
          vagas: "",
          minimo: "8",
          percentual_premio: "80",
          detalhes: "",
          status: "aberto",
          link_endstep: "",
        }}
      />
    </div>
  );
}
