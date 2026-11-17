import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";

export const metadata: Metadata = { title: "Sobre a liga" };

export default function Sobre() {
  return (
    <PaginaTexto titulo="Sobre a liga">
      <p>
        A Liga Fim de Turno organiza eventos semanais de Magic: The Gathering nos formatos Pauper e Limited
        (draft, selado e cubo). As partidas acontecem online no Endstep, um cliente gratuito que roda no
        navegador, então ninguém precisa ter as cartas para competir.
      </p>
      <h2>Como funciona</h2>
      <ol>
        <li>Você cria sua conta no portal entrando com o Discord.</li>
        <li>Escolhe uma etapa, se inscreve e paga a inscrição por Pix.</li>
        <li>Recebe o link privado do evento no Endstep, faz o check-in e joga.</li>
        <li>Os resultados e os prêmios aparecem aqui no portal depois do evento.</li>
      </ol>
      <h2>As duas ligas</h2>
      <p>
        A Liga Pauper usa apenas cartas comuns, com rodadas suíças e premiação por classificação. A Liga Limited
        reúne draft, selado e cubo em pods de até 8 jogadores, com prêmio por campanha. A partir de 2027, cada liga
        terá ranking por temporada, finais trimestrais e um Top 8 anual que define o Player of the Year.
      </p>
      <h2>Quem organiza</h2>
      <p>
        A liga é um projeto independente de jogadores, sem vínculo com a Wizards of the Coast, a Hasbro ou o
        Endstep. Dúvidas, sugestões e parcerias: veja a página de contato.
      </p>
    </PaginaTexto>
  );
}
