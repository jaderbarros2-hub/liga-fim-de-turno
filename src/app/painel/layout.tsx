import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/dados";
import { diagnosticar } from "@/lib/diagnostico";

export const dynamic = "force-dynamic";

const MENU = [
  { href: "/painel", rotulo: "Visão geral" },
  { href: "/painel/eventos", rotulo: "Eventos" },
  { href: "/painel/arquetipos", rotulo: "Arquétipos" },
  { href: "/painel/financeiro", rotulo: "Financeiro" },
  { href: "/painel/cupons", rotulo: "Cupons" },
  { href: "/painel/blog", rotulo: "Blog" },
  { href: "/painel/parceiros", rotulo: "Lojas e parceiros" },
  { href: "/painel/emails", rotulo: "E-mails" },
];

export default async function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  const jogador = await usuarioAtual();
  if (!jogador) redirect("/entrar?voltar=/painel");
  if (jogador.papel !== "organizador" && jogador.papel !== "juiz")
    redirect("/");
  const erros =
    jogador.papel === "organizador"
      ? (await diagnosticar()).filter((p) => p.nivel === "erro").length
      : 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-wrap">
      <nav
        aria-label="Painel"
        className="flex flex-[1_1_200px] flex-col gap-1 border-r border-borda px-4 py-8 text-sm font-semibold"
      >
        <span className="titulo px-3 pb-4 text-2xl">Painel</span>
        {MENU.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-texto2 no-underline hover:bg-grafite hover:text-gelo"
          >
            {m.rotulo}
            {m.href === "/painel" && erros > 0 && (
              <span
                title="Pendências de configuração"
                className="grid h-5 min-w-5 place-items-center rounded-full bg-erro px-1.5 text-xs font-bold text-preto"
              >
                {erros}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="min-w-0 flex-[999_1_640px] px-8 py-8">{children}</div>
    </div>
  );
}
