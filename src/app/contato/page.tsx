import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";

export const metadata: Metadata = { title: "Contato" };

export default function Contato() {
  const discord = process.env.NEXT_PUBLIC_DISCORD_CONVITE;
  const email = process.env.NEXT_PUBLIC_EMAIL_CONTATO;
  return (
    <PaginaTexto titulo="Contato">
      <p>O jeito mais rápido de falar com a organização é pelo Discord da liga.</p>
      <ul>
        <li>
          Discord:{" "}
          {discord ? (
            <a href={discord} target="_blank" rel="noopener noreferrer">
              entrar no servidor
            </a>
          ) : (
            "link em breve"
          )}
        </li>
        <li>E-mail: {email ? <a href={`mailto:${email}`}>{email}</a> : "em breve"}</li>
      </ul>
      <p>Lojas e marcas interessadas em parcerias também podem usar esses canais.</p>
    </PaginaTexto>
  );
}
