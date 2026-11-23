import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";

export const metadata: Metadata = { title: "Termos de uso" };

export default function Termos() {
  return (
    <PaginaTexto
      titulo="Termos de uso"
      atualizado="novembro de 2026 (versão provisória)"
    >
      <h2>1. Sobre a liga e aceitação</h2>
      <p>
        A First Strike (&quot;Liga&quot;) é organizada por [nome do organizador,
        CPF ou CNPJ] (&quot;Organização&quot;) e reúne eventos de Magic: The
        Gathering online e presenciais. É um projeto independente, sem vínculo,
        patrocínio ou aprovação da Wizards of the Coast, da Hasbro, do Endstep
        ou de qualquer outra empresa citada. Ao criar uma conta, se inscrever ou
        usar o portal, o usuário aceita estes Termos, a Política de privacidade,
        o Regulamento e as Políticas da Liga.
      </p>
      <h2>2. Cadastro e conta</h2>
      <p>
        O usuário informa dados verdadeiros e mantém apenas uma conta, pessoal e
        intransferível, respondendo por tudo o que for feito com ela e com as
        contas vinculadas (Discord e Endstep). Menores de 18 anos só participam
        com autorização do responsável legal, que responde pelo menor e recebe
        eventuais prêmios em dinheiro. A Organização pode recusar, suspender ou
        encerrar contas com dados falsos, duplicadas ou envolvidas em infrações.
      </p>
      <h2>3. Eventos</h2>
      <p>
        Os eventos seguem o Regulamento vigente na data do evento. A Organização
        pode alterar datas, horários, formatos, estrutura, vagas e regras, e
        cancelar eventos, com aviso no portal ou nos canais oficiais. As
        partidas online acontecem em plataformas de terceiros, como o Endstep, e
        a comunicação no Discord; a Organização não controla essas plataformas e
        não responde por falhas, indisponibilidades ou mudanças nelas. Se uma
        falha afetar um evento, a Organização decide se ele continua, é
        remarcado ou cancelado. As decisões da Organização sobre regras,
        resultados e disputas são finais.
      </p>
      <h2>4. Inscrições, pagamentos e reembolsos</h2>
      <p>
        O valor de cada inscrição aparece na página do evento, e a inscrição só
        é confirmada após a confirmação do pagamento, processado por
        intermediários de pagamento sujeitos aos termos deles. O jogador pode
        cancelar até 24 horas antes do início e escolher reembolso ou crédito;
        evento cancelado pela Organização dá direito a reembolso integral ou
        crédito. Não há reembolso por ausência, atraso, falta de check-in,
        desistência durante o evento, problemas de conexão do próprio jogador,
        desclassificação, suspensão ou banimento. Ficam preservados os direitos
        do Código de Defesa do Consumidor, quando aplicáveis.
      </p>
      <h2>5. Premiação</h2>
      <p>
        Os prêmios seguem as regras divulgadas para cada evento. Prêmios em
        dinheiro são pagos somente à chave Pix de mesma titularidade do cadastro
        (ou do responsável, no caso de menores). O jogador tem até 90 dias após
        o evento para informar dados corretos e receber o prêmio; depois disso,
        o valor pode ser destinado a eventos futuros. A Organização pode reter
        um prêmio durante investigação de fraude ou infração e cancelá-lo se a
        infração for confirmada. Eventuais tributos seguem a legislação vigente.
      </p>
      <h2>6. Conduta e sanções</h2>
      <p>
        O usuário segue o Código de conduta no portal, nas plataformas de jogo,
        no Discord, no WhatsApp e nos eventos presenciais. Conforme a gravidade,
        a Organização pode aplicar advertência, perda de partida,
        desclassificação, perda de prêmio, suspensão ou banimento, sem
        reembolso.
      </p>
      <h2>7. Imagem, resultados e conteúdo</h2>
      <p>
        Ao se inscrever, o usuário autoriza gratuitamente a publicação do seu
        nick, foto de perfil, resultados, decklists e estatísticas no portal,
        nas redes da Liga e em sites de resultados de Magic. Eventos podem ser
        transmitidos, gravados ou fotografados; quem não quiser aparecer deve
        avisar antes do evento.
      </p>
      <h2>8. Propriedade intelectual</h2>
      <p>
        Nome, marca, layout e textos do portal pertencem à Organização. Nomes e
        imagens de cartas e demais elementos de Magic: The Gathering pertencem à
        Wizards of the Coast e são exibidos apenas para identificar as cartas
        usadas nos eventos.
      </p>
      <h2>9. Limitação de responsabilidade</h2>
      <p>
        O portal é oferecido no estado em que se encontra e pode ficar
        indisponível. A Organização não responde por falhas de conexão ou
        equipamento do usuário, problemas em plataformas de terceiros, acordos
        entre usuários, perda ou dano de cartas e objetos em eventos
        presenciais, nem por danos indiretos. Quando houver responsabilidade,
        ela fica limitada ao valor pago na inscrição do evento em questão,
        respeitados os direitos garantidos por lei.
      </p>
      <h2>10. Alterações e encerramento</h2>
      <p>
        Estes Termos podem mudar; a nova versão é publicada aqui com a data, e
        mudanças relevantes são avisadas. Se a Liga ou o portal forem
        encerrados, inscrições futuras e créditos são reembolsados e prêmios
        devidos são pagos.
      </p>
      <h2>11. Lei aplicável e contato</h2>
      <p>
        Estes Termos seguem as leis brasileiras, com foro no domicílio do
        usuário, conforme o Código de Defesa do Consumidor. Antes de qualquer
        medida judicial, as partes buscam resolver pelo contato oficial da Liga.
      </p>
    </PaginaTexto>
  );
}
