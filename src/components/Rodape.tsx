import Link from "next/link";

const COLUNAS = [
  {
    titulo: "A liga",
    links: [
      { href: "/sobre", rotulo: "Sobre" },
      { href: "/como-jogar", rotulo: "Como jogar" },
      { href: "/regras", rotulo: "Regras e políticas" },
    ],
  },
  {
    titulo: "Eventos",
    links: [
      { href: "/eventos", rotulo: "Agenda" },
      { href: "/resultados", rotulo: "Resultados" },
      { href: "/ligas/pauper", rotulo: "Liga Pauper" },
      { href: "/ligas/limited", rotulo: "Liga Limited" },
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
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
        {COLUNAS.map((c) => (
          <div key={c.titulo} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-cinza">{c.titulo}</span>
            {c.links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-texto2 no-underline hover:text-ciano">
                {l.rotulo}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-8 text-xs text-cinza">
        Liga Fim de Turno (nome provisório). Projeto independente, sem vínculo com a Wizards of the
        Coast, a Hasbro ou o Endstep. Magic: The Gathering é marca da Wizards of the Coast.
      </div>
    </footer>
  );
}
