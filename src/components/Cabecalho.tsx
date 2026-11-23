import { BotaoEnviar } from "@/components/BotaoEnviar";
import Link from "next/link";
import { sair } from "@/app/minha-area/actions";
import { Diamante } from "@/components/Diamante";
import { Logo } from "@/components/Logo";
import { MenuSuspenso, type ItemMenu } from "@/components/MenuSuspenso";
import { listarFormatos, usuarioAtual } from "@/lib/dados";

const linkMenu = "shrink-0 py-1 text-marfim no-underline hover:text-brasa";

export async function Cabecalho() {
  const [jogador, formatos] = await Promise.all([
    usuarioAtual(),
    listarFormatos(),
  ]);
  const equipe =
    jogador && (jogador.papel === "organizador" || jogador.papel === "juiz");
  const nome = jogador?.nick_endstep || jogador?.discord_nome || "Minha conta";

  const itensFormatos: ItemMenu[] = formatos.map((f) => ({
    href: `/ligas/${f.slug}`,
    rotulo: f.slug === "limited" ? "Limitado" : f.nome.replace(/^Liga /, ""),
  }));

  const itensCircuito: ItemMenu[] = [
    {
      href: "/circuito",
      rotulo: "Como funciona",
    },
    {
      href: "/ranking",
      rotulo: "Ranking",
    },
    {
      href: "/resultados",
      rotulo: "Últimos eventos",
    },
  ];

  const itensConta: ItemMenu[] = [
    {
      href: "/minha-area",
      rotulo: "Minha área",
    },
    { href: "/minha-area?aba=decks", rotulo: "Meus decks" },
    { href: "/minha-area?aba=carteira", rotulo: "Carteira" },
    { href: "/minha-area?aba=dados", rotulo: "Meus dados" },
    {
      href: "/apoie",
      rotulo: "Seja apoiador",
      separar: true,
    },
    ...(equipe
      ? [{ href: "/painel", rotulo: "Painel da organização", separar: true }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-borda bg-preto/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-6 py-3">
        <Link href="/" className="no-underline" aria-label="Página inicial">
          <Logo />
        </Link>

        <nav
          aria-label="Principal"
          className="order-last flex w-full items-center justify-between text-[13px] font-semibold uppercase sm:justify-start sm:gap-6 md:order-none md:mr-auto md:w-auto md:text-sm"
        >
          <MenuSuspenso
            gatilho="Formatos"
            itens={itensFormatos}
            classeGatilho={`${linkMenu} uppercase`}
          />
          <MenuSuspenso
            gatilho="Circuito"
            itens={itensCircuito}
            classeGatilho={`${linkMenu} uppercase`}
          />
          <Link href="/blog" className={linkMenu}>
            Artigos
          </Link>
          <Link href="/eventos" className={linkMenu}>
            Agenda
          </Link>
          <Link href="/sobre" className={linkMenu}>
            Sobre
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/apoie"
            className="group hidden items-center gap-2 text-sm font-semibold text-texto2 no-underline hover:text-marfim sm:inline-flex"
          >
            <span>Apoie</span>
            <Diamante className="text-brasa transition group-hover:rotate-45 group-hover:text-marfim" />
          </Link>
          {jogador ? (
            <MenuSuspenso
              alinhar="direita"
              rotuloAcessivel={`Conta de ${nome}`}
              classeGatilho="rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-marfim ring-1 ring-borda-forte hover:ring-brasa"
              gatilho={
                <>
                  {jogador.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={jogador.avatar_url}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full"
                    />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-vermelho text-xs font-bold text-white">
                      {nome.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-32 truncate">{nome}</span>
                </>
              }
              itens={itensConta}
              rodape={
                <form action={sair}>
                  <BotaoEnviar className="w-full py-1.5 text-left text-sm text-cinza hover:text-marfim">
                    Sair
                  </BotaoEnviar>
                </form>
              }
            />
          ) : (
            <Link
              href="/entrar"
              className="inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold text-marfim no-underline ring-1 ring-borda-forte hover:ring-brasa"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
