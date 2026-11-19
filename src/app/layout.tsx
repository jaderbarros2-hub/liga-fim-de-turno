import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Liga Fim de Turno", template: "%s · Liga Fim de Turno" },
  description:
    "Liga semanal de Magic: The Gathering nos formatos Pauper, Premodern e Limited, jogada online no Endstep.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <Cabecalho />
        <main className="min-h-[60vh]">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
