import { BotaoEnviar } from "@/components/BotaoEnviar";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarTeste } from "./actions";

const NOMES: Record<string, string> = {
  boas_vindas: "Boas-vindas",
  ingresso_confirmado: "Ingresso confirmado",
  ingresso_cancelado: "Ingresso cancelado",
  premio: "Prêmio na Carteira",
  saque_solicitado: "Saque solicitado",
  saque_pago: "Saque pago",
  resgate_solicitado: "Resgate em loja (jogador)",
  resgate_loja: "Resgate em loja (loja)",
  organizacao: "Aviso à organização",
  teste: "Teste",
};
const COR: Record<string, string> = {
  enviado: "text-ciano",
  simulado: "text-alerta",
  falhou: "text-erro",
};
const MSG: Record<string, string> = {
  enviado: "E-mail de teste enviado. Confira a caixa de entrada (e o spam).",
  simulado:
    "Sem RESEND_API_KEY na Vercel: o e-mail foi só registrado abaixo, como simulado.",
  falhou: "O Resend recusou o envio. Veja o erro na lista abaixo.",
  invalido: "Informe um e-mail válido.",
};
const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

export default async function Emails({
  searchParams,
}: {
  searchParams: Promise<{ teste?: string }>;
}) {
  const { teste } = await searchParams;
  const { data } = await criarClienteAdmin()
    .from("emails")
    .select("id, para, assunto, tipo, status, erro, criado_em")
    .order("criado_em", { ascending: false })
    .limit(100);
  const configurado = Boolean(process.env.RESEND_API_KEY);
  // Conferência da chave sem revelá-la: só o início (o mesmo que o Resend mostra na lista) e o tamanho
  const bruta = process.env.RESEND_API_KEY ?? "";
  const limpa = bruta.trim().replace(/^["']|["']$/g, "");
  const problemasChave = configurado
    ? [
        !limpa.startsWith("re_") &&
          "não começa com re_ (o Resend sempre começa assim)",
        /\s/.test(limpa) && "tem espaço ou quebra de linha no meio",
        /…|\.\.\./.test(limpa) &&
          "parece cortada (tem “…”): foi copiada da lista e não do botão de copiar",
        limpa.length < 30 && `é curta demais (${limpa.length} caracteres)`,
      ].filter(Boolean)
    : [];
  const remetente =
    process.env.EMAIL_REMETENTE || "Liga Fim de Turno <onboarding@resend.dev>";

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="titulo text-5xl">E-mails</h1>
        <p className="text-sm text-texto2">
          Tudo que o portal enviou (ou tentou enviar), mais recente primeiro.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-borda p-5 sm:grid-cols-[1fr_1.2fr]">
        <dl className="flex flex-col gap-2 text-sm">
          <div>
            <dt className="text-cinza">Envio</dt>
            <dd
              className={`font-semibold ${configurado ? "text-ciano" : "text-alerta"}`}
            >
              {configurado
                ? "Resend conectado"
                : "Simulado (falta RESEND_API_KEY)"}
            </dd>
          </div>
          {configurado && (
            <div>
              <dt className="text-cinza">Chave</dt>
              <dd className="font-mono text-texto2">
                {limpa.slice(0, 7)}… · {limpa.length} caracteres
              </dd>
              {problemasChave.length > 0 && (
                <dd className="mt-1 text-xs text-erro">
                  A chave {problemasChave.join("; ")}.
                </dd>
              )}
            </div>
          )}
          <div>
            <dt className="text-cinza">Remetente</dt>
            <dd className="font-mono text-texto2">{remetente}</dd>
          </div>
          {remetente.includes("resend.dev") && (
            <p className="text-xs text-cinza">
              Sem domínio verificado, o Resend só entrega para o e-mail dono da
              conta. Bom para testar.
            </p>
          )}
        </dl>
        <form action={enviarTeste} className="flex flex-col gap-2">
          <label htmlFor="para" className="text-sm font-semibold">
            Enviar e-mail de teste
          </label>
          <div className="flex gap-2">
            <input
              id="para"
              name="para"
              type="email"
              required
              placeholder="voce@email.com"
              className="min-h-11 flex-1 rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo"
            />
            <BotaoEnviar className="min-h-11 rounded-lg bg-azul px-5 text-sm font-semibold text-white">
              Enviar
            </BotaoEnviar>
          </div>
          {teste && MSG[teste] && (
            <p
              className={`text-sm ${teste === "enviado" ? "text-ciano" : teste === "simulado" ? "text-alerta" : "text-erro"}`}
            >
              {MSG[teste]}
            </p>
          )}
        </form>
      </div>

      {(data ?? []).length === 0 ? (
        <p className="text-texto2">Nenhum e-mail ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-borda">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-cinza">
              <tr>
                <th className="p-3">Quando</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Para</th>
                <th className="p-3">Assunto</th>
                <th className="p-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((e) => (
                <tr key={e.id} className="border-t border-borda align-top">
                  <td className="whitespace-nowrap p-3 text-cinza">
                    {quando(e.criado_em)}
                  </td>
                  <td className="p-3">{NOMES[e.tipo] ?? e.tipo}</td>
                  <td className="p-3 text-texto2">{e.para}</td>
                  <td className="p-3">{e.assunto}</td>
                  <td className={`p-3 font-semibold ${COR[e.status] ?? ""}`}>
                    {e.status}
                    {e.erro && (
                      <span className="block text-xs font-normal text-erro">
                        {e.erro}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
