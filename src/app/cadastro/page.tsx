import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  criarClienteServidor,
  supabaseConfigurado,
} from "@/lib/supabase/server";
import { FormularioCadastro } from "./Formulario";

export const metadata: Metadata = { title: "Completar cadastro" };
export const dynamic = "force-dynamic";

export default async function Cadastro({
  searchParams,
}: {
  searchParams: Promise<{ voltar?: string }>;
}) {
  const { voltar } = await searchParams;
  if (!supabaseConfigurado()) redirect("/");
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?voltar=/cadastro");

  const { data: j } = await supabase
    .from("jogadores")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-12">
      <h1 className="titulo text-4xl">Complete seu cadastro</h1>
      <p className="text-texto2">
        Precisamos desses dados para confirmar sua inscrição e pagar seus
        prêmios. Só o seu nick aparece publicamente.
      </p>
      <FormularioCadastro
        voltar={voltar && voltar.startsWith("/") ? voltar : "/minha-area"}
        inicial={{
          nome: j?.nome ?? "",
          email: j?.email ?? user.email ?? "",
          nascimento: j?.nascimento ?? "",
          nick_endstep: j?.nick_endstep ?? "",
          cpf: j?.cpf ?? "",
          chave_pix: j?.chave_pix ?? "",
          pix_tipo: j?.pix_tipo ?? "",
          responsavel_nome: j?.responsavel_nome ?? "",
          responsavel_cpf: j?.responsavel_cpf ?? "",
        }}
      />
    </div>
  );
}
