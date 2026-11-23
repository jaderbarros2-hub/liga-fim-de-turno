import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.ligafirststrike.com.br",
  ),
  title: { default: "First Strike", template: "%s · First Strike" },
  description:
    "First Strike é uma liga competitiva de Magic: The Gathering com etapas de Pauper, Premodern e Limitado, jogada online no Endstep.",
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
