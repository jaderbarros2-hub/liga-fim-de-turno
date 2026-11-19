import Link from "next/link";

const COLUNAS = [
  {
    titulo: "A liga",
    links: [
      { href: "/sobre", rotulo: "Sobre" },
      { href: "/blog", rotulo: "Blog" },
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
      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-borda px-6 py-6 text-xs leading-relaxed text-cinza">
        <p>
          A Liga Fim de Turno (nome provisório) é conteúdo de fã não oficial, permitido pela Fan Content Policy. Não é
          aprovada nem endossada pela Wizards. Partes do material utilizado são propriedade da Wizards of the Coast.
          ©Wizards of the Coast LLC. Sem vínculo com a Hasbro ou com o Endstep.
        </p>
        <p>Imagens de cartas via Scryfall; os créditos de cada ilustração aparecem junto à arte.</p>
      </div>
    </footer>
  );
}
