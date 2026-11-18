import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";

export const metadata: Metadata = { title: "Como jogar" };

export default function ComoJogar() {
  return (
    <PaginaTexto titulo="Como jogar">
      <h2>1. Crie sua conta no Endstep</h2>
      <p>
        Acesse <a href="https://endstep.cc" target="_blank" rel="noopener noreferrer">endstep.cc</a>, crie sua conta
        gratuita e anote o seu nick: é por ele que a organização encontra você nos resultados. Vale jogar uma partida
        de teste para conhecer a interface.
      </p>
      <h2>2. Crie sua conta na liga</h2>
      <p>
        Clique em <strong>Entrar com Discord</strong> e complete o cadastro com seu nome, e-mail, data de nascimento,
        nick do Endstep, CPF e a chave Pix onde quer receber prêmios. Entre também no servidor do Discord da liga.
      </p>
      <h2>3. Inscreva-se numa etapa</h2>
      <p>
        Na agenda, escolha a etapa e clique em <strong>Inscrever-se</strong>. O portal gera um Pix; assim que o
        pagamento cai, sua inscrição é confirmada na hora.
      </p>
      <h2>4. No dia do evento</h2>
      <ul>
        <li>Abra o link privado do evento (no portal, na sua área de jogador).</li>
        <li>Faça o check-in no Endstep até 10 minutos antes do início.</li>
        <li>No Pauper, registre seu deck no Endstep antes de começar.</li>
        <li>Jogue as rodadas pelo Endstep. Dúvidas na hora: canal do evento no Discord.</li>
      </ul>
      <h2>5. Depois do evento</h2>
      <p>
        A classificação aparece na página do evento. Os prêmios caem na sua Carteira, na Minha área: dá para sacar
        por Pix, usar no próximo ingresso ou enviar para uma loja parceira.
      </p>
    </PaginaTexto>
  );
}
