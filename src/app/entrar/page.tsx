import type { Metadata } from "next";
import { BotaoDiscord } from "./BotaoDiscord";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ voltar?: string; erro?: string }> }) {
  const { voltar, erro } = await searchParams;
  const destino = voltar && voltar.startsWith("/") ? voltar : "/minha-area";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="titulo text-5xl">Entrar</h1>
      <p className="text-texto2">
        A liga usa a sua conta do Discord para o login. É por lá que acontecem os avisos e o suporte nos dias de
        evento, então você entra e já fica conectado à comunidade.
      </p>
      {erro && (
        <p role="alert" className="rounded-lg border border-erro p-3 text-sm text-erro">
          Não foi possível entrar. Tente de novo.
        </p>
      )}
      <BotaoDiscord destino={destino} />
      <p className="text-xs text-cinza">
        Ao entrar você concorda com os <a href="/termos">Termos de uso</a> e a{" "}
        <a href="/privacidade">Política de privacidade</a>.
      </p>
    </div>
  );
}
