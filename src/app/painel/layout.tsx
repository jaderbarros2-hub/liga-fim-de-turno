import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/dados";

export const dynamic = "force-dynamic";

const MENU = [
  { href: "/painel", rotulo: "Visão geral" },
  { href: "/painel/eventos", rotulo: "Eventos" },
  { href: "/painel/arquetipos", rotulo: "Arquétipos" },
  { href: "/painel/parceiros", rotulo: "Parceiros" },
];

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const jogador = await usuarioAtual();
  if (!jogador) redirect("/entrar?voltar=/painel");
  if (jogador.papel !== "organizador" && jogador.papel !== "juiz") redirect("/");

  return (
    <div className="mx-auto flex max-w-7xl flex-wrap">
      <nav aria-label="Painel" className="flex flex-[1_1_200px] flex-col gap-1 border-r border-borda px-4 py-8 text-sm font-semibold">
        <span className="titulo px-3 pb-4 text-2xl">Painel</span>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className="rounded-lg px-3 py-2.5 text-texto2 no-underline hover:bg-grafite hover:text-gelo">
            {m.rotulo}
          </Link>
        ))}
      </nav>
      <div className="min-w-0 flex-[999_1_640px] px-8 py-8">{children}</div>
    </div>
  );
}
