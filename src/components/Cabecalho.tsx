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
        <nav aria-label="Principal" className="flex flex-wrap gap-5 text-sm font-semibold uppercase">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-gelo no-underline hover:text-ciano">
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
              Entrar com Discord
            </BotaoLink>
          )}
          <BotaoLink href="/eventos">Inscrever-se</BotaoLink>
        </div>
      </div>
    </header>
  );
}
