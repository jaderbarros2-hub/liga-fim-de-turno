"use client";

import { useState } from "react";

const imagem = (nome: string) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(nome)}&format=image&version=normal`;

/** Nome de carta no texto: mostra a carta ao passar o mouse (ou tocar) e leva ao Scryfall. */
export function CartaNoTexto({
  nome,
  children,
}: {
  nome: string;
  children: React.ReactNode;
}) {
  const [aberta, setAberta] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
    >
      <a
        href={`https://scryfall.com/search?q=${encodeURIComponent(`!"${nome}"`)}`}
        target="_blank"
        rel="noopener"
        onFocus={() => setAberta(true)}
        onBlur={() => setAberta(false)}
        className="font-semibold text-brasa underline decoration-dotted underline-offset-4"
      >
        {children}
      </a>
      {aberta && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagem(nome)}
          alt={nome}
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 max-w-none -translate-x-1/2 rounded-[4.75%/3.5%] shadow-2xl shadow-preto"
        />
      )}
    </span>
  );
}
