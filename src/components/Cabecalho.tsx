import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BotaoLink } from "@/components/Botao";
import { usuarioAtual } from "@/lib/dados";

const LINKS = [
  { href: "/eventos", rotulo: "Eventos" },
  { href: "/ligas/pauper", rotulo: "Pauper" },
  { href: "/ligas/limited", rotulo: "Limited" },
  { href: "/resultados", rotulo: "Resultados" },
  { href: "/regras", rotulo: "Regras" },
];

export async function Cabecalho() {
  const jogador = await usuarioAtual();
  const equipe = jogador && (jogador.papel === "organizador" || jogador.papel === "juiz");

  return (
    <header className="border-b border-borda bg-preto">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="no-underline" aria-label="Página inicial">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="order-last -mx-6 flex w-full gap-5 overflow-x-auto px-6 text-sm font-semibold uppercase md:order-none md:mx-0 md:w-auto md:px-0">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="shrink-0 py-1 text-gelo no-underline hover:text-ciano">
              {l.rotulo}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          {equipe && (
            <BotaoLink href="/painel" variante="contorno">
              Painel
            </BotaoLink>
          )}
          {jogador ? (
            <BotaoLink href="/minha-area" variante="contorno">
              {jogador.nick_endstep || jogador.discord_nome || "Minha área"}
            </BotaoLink>
          ) : (
            <BotaoLink href="/entrar" variante="contorno">
              <span className="sm:hidden">Entrar</span>
              <span className="hidden sm:inline">Entrar com Discord</span>
            </BotaoLink>
          )}
          <span className="hidden sm:block">
            <BotaoLink href="/eventos">Inscrever-se</BotaoLink>
          </span>
        </div>
      </div>
    </header>
  );
}
