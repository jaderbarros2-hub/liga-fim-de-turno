import Link from "next/link";
import { NomeMarca, Simbolo } from "@/components/Logo";

const COLUNAS = [
  {
    titulo: "A liga",
    links: [
      { href: "/sobre", rotulo: "Sobre" },
      { href: "/blog", rotulo: "Artigos" },
      { href: "/como-jogar", rotulo: "Como jogar" },
      { href: "/regras", rotulo: "Regras e políticas" },
      { href: "/parceiros", rotulo: "Parceiros" },
      { href: "/apoie", rotulo: "Seja apoiador" },
      { href: "/como-funciona", rotulo: "Como funcionam os eventos" },
    ],
  },
  {
    titulo: "Eventos",
    links: [
      { href: "/eventos", rotulo: "Agenda" },
      { href: "/circuito", rotulo: "O circuito" },
      { href: "/ranking", rotulo: "Ranking" },
      { href: "/resultados", rotulo: "Últimos eventos" },
      { href: "/ligas/pauper", rotulo: "Liga Pauper" },
      { href: "/ligas/premodern", rotulo: "Liga Premodern" },
      { href: "/ligas/limited", rotulo: "Liga Limitado" },
    ],
  },
  {
    titulo: "Ajuda",
    links: [
      { href: "/perguntas-frequentes", rotulo: "Perguntas frequentes" },
      { href: "/contato", rotulo: "Contato" },
      { href: "/termos", rotulo: "Termos de uso" },
      { href: "/privacidade", rotulo: "Privacidade" },
    ],
  },
];

export function Rodape() {
  return (
    <footer className="border-t border-borda">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4 sm:col-span-3 lg:col-span-1">
          <Link
            href="/"
            aria-label="First Strike, página inicial"
            className="flex items-center gap-3 no-underline"
          >
            <Simbolo tamanho={48} />
            <NomeMarca altura={30} assinatura />
          </Link>
          <p className="max-w-xs text-sm text-cinza">
            Liga competitiva de Magic: Pauper, Premodern e Limitado, online no
            Endstep.
          </p>
        </div>
        {COLUNAS.map((c) => (
          <div key={c.titulo} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-cinza">
              {c.titulo}
            </span>
            {c.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-texto2 no-underline hover:text-brasa"
              >
                {l.rotulo}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-borda px-6 py-6 text-xs leading-relaxed text-cinza">
        <p>
          First Strike é conteúdo de fã não oficial, permitido pela Política de
          Conteúdo de Fãs. Não é aprovado nem endossado pela Wizards. Partes dos
          materiais usados são propriedade da Wizards of the Coast. ©Wizards of
          the Coast LLC. Sem vínculo com a Hasbro ou com o Endstep.
        </p>
        <p>
          Imagens de cartas via Scryfall; os créditos de cada ilustração
          aparecem junto à arte.
        </p>
      </div>
    </footer>
  );
}
