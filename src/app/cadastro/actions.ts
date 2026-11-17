"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { cpfValido, idadeEm, soDigitos } from "@/lib/validacao";

export type EstadoCadastro = { erro?: string };

const IDADE_MINIMA = 13;

export async function salvarCadastro(_: EstadoCadastro, form: FormData): Promise<EstadoCadastro> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const texto = (campo: string) => String(form.get(campo) ?? "").trim();
  const nome = texto("nome");
  const email = texto("email");
  const nascimento = texto("nascimento");
  const nick = texto("nick_endstep");
  const cpf = soDigitos(texto("cpf"));
  const chavePix = texto("chave_pix");
  const responsavelNome = texto("responsavel_nome");
  const responsavelCpf = soDigitos(texto("responsavel_cpf"));
  const aceite = form.get("aceite") === "on";
  const voltarBruto = texto("voltar") || "/minha-area";
  const voltar = voltarBruto.startsWith("/") ? voltarBruto : "/minha-area";

  if (!nome || !email || !nascimento || !nick || !chavePix) return { erro: "Preencha todos os campos obrigatórios." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { erro: "E-mail inválido." };
  if (!cpfValido(cpf)) return { erro: "CPF inválido." };
  const idade = idadeEm(nascimento);
  if (Number.isNaN(idade) || idade < 0 || idade > 120) return { erro: "Data de nascimento inválida." };
  if (idade < IDADE_MINIMA) return { erro: `A idade mínima para participar é ${IDADE_MINIMA} anos.` };
  if (idade < 18 && (!responsavelNome || !cpfValido(responsavelCpf)))
    return { erro: "Menores de 18 anos precisam informar nome e CPF do responsável." };
  if (!aceite) return { erro: "É preciso aceitar os Termos de uso e a Política de privacidade." };

  const { error } = await supabase
    .from("jogadores")
    .update({
      nome,
      email,
      nascimento,
      nick_endstep: nick,
      cpf,
      chave_pix: chavePix,
      responsavel_nome: idade < 18 ? responsavelNome : null,
      responsavel_cpf: idade < 18 ? responsavelCpf : null,
      aceite_termos_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { erro: "Este CPF já está cadastrado em outra conta. Fale com a organização." };
    return { erro: "Não foi possível salvar. Tente de novo." };
  }

  redirect(voltar);
}
