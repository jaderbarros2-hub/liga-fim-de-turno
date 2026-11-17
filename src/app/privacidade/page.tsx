import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function Privacidade() {
  return (
    <PaginaTexto titulo="Política de privacidade" atualizado="novembro de 2026 (versão provisória)">
      <p>
        Esta política explica como a Liga trata dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei
        13.709/2018). A controladora dos dados é a Organização: [nome, CPF ou CNPJ], contato [e-mail da Liga].
      </p>
      <h2>Dados coletados e para quê</h2>
      <ul>
        <li>Nome, e-mail, data de nascimento, conta do Discord e nick do Endstep: criar a conta, identificar o jogador e enviar avisos (execução de contrato).</li>
        <li>CPF e chave Pix: identificar quem paga, evitar contas duplicadas, pagar prêmios e reembolsos (execução de contrato e obrigação legal).</li>
        <li>Inscrições, pagamentos e prêmios: controle financeiro e prestação de contas.</li>
        <li>Resultados, decklists e estatísticas: classificação, ranking e publicação dos eventos (legítimo interesse).</li>
        <li>Imagem e voz em transmissões e fotos: divulgação da Liga (consentimento, que pode ser retirado).</li>
        <li>Registros de acesso: segurança e prevenção de fraudes.</li>
      </ul>
      <h2>O que é público</h2>
      <p>
        Nick, foto de perfil do Discord, resultados, decklists, ranking e conquistas. Nome completo, CPF, chave
        Pix, e-mail e data de nascimento nunca são exibidos.
      </p>
      <h2>Compartilhamento</h2>
      <p>
        Apenas com os serviços necessários para o portal funcionar (hospedagem, banco de dados, envio de e-mails,
        intermediário de pagamento, Discord), com lojas parceiras quando o prêmio for crédito na loja, e com
        autoridades quando a lei exigir. Alguns serviços guardam dados fora do Brasil, com proteções contratuais
        compatíveis com a LGPD. A Liga não vende dados.
      </p>
      <h2>Por quanto tempo</h2>
      <p>
        Enquanto a conta existir. Dados financeiros ficam guardados pelo prazo da legislação fiscal (em geral, 5
        anos) e registros de acesso por 6 meses (Marco Civil da Internet). Resultados históricos podem ser
        mantidos de forma anonimizada após o encerramento da conta.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Confirmar se tratamos seus dados, acessar, corrigir, pedir anonimização ou exclusão, pedir portabilidade,
        saber com quem compartilhamos e retirar consentimentos. Os pedidos são feitos pelo contato da Liga e
        respondidos em até 15 dias. Também é possível reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>
      <h2>Menores de idade</h2>
      <p>Dados de menores de 18 anos são tratados com o consentimento do responsável legal e no melhor interesse do menor.</p>
      <h2>Cookies e segurança</h2>
      <p>
        O portal usa cookies essenciais para manter o login. O acesso aos dados é restrito, a conexão é
        criptografada e as chaves ficam em serviços protegidos. Em caso de incidente relevante, os titulares e a
        ANPD são avisados.
      </p>
    </PaginaTexto>
  );
}
