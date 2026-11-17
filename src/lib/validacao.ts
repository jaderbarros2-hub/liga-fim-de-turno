/** Remove tudo que não é dígito. */
export function soDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

/** Valida CPF pelos dígitos verificadores. */
export function cpfValido(valor: string) {
  const cpf = soDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(cpf.slice(0, 9), 10) === Number(cpf[9]) && digito(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

export function idadeEm(nascimento: string, hoje = new Date()) {
  const n = new Date(`${nascimento}T12:00:00`);
  let idade = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) idade--;
  return idade;
}

export function mascararCpf(cpf: string | null) {
  if (!cpf) return "";
  const d = soDigitos(cpf);
  return `***.${d.slice(3, 6)}.***-${d.slice(9, 11)}`;
}

export function mascararChave(chave: string | null) {
  if (!chave) return "";
  if (chave.length <= 6) return "***";
  return `${chave.slice(0, 3)}***${chave.slice(-3)}`;
}
