import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";

export const metadata: Metadata = { title: "Regras e políticas" };

export default function Regras() {
  return (
    <PaginaTexto
      titulo="Regras e políticas"
      atualizado="novembro de 2026 (versão provisória)"
    >
      <p>
        As regras seguem o padrão de torneios da Wizards (MTR), adaptado ao jogo
        online. A única regra própria da liga é o ponto de participação no
        ranking, que reconhece quem joga sempre.
      </p>

      <h2>Participação</h2>
      <ul>
        <li>
          Cadastro completo, uma conta por pessoa, conta do Endstep e do Discord
          vinculadas.
        </li>
        <li>
          Menores de 18 anos participam com autorização do responsável, que
          recebe os prêmios em dinheiro.
        </li>
        <li>
          Inscrição e pagamento pelo portal até o prazo de cada evento. Mínimo
          de 8 inscritos.
        </li>
        <li>
          Sem o mínimo, o evento é cancelado e cada inscrito escolhe reembolso
          ou crédito. O jogador pode cancelar a própria inscrição até 24 horas
          antes do início, com reembolso ou crédito.
        </li>
      </ul>

      <h2>Partidas</h2>
      <ul>
        <li>
          Todas as partidas são melhor de 3, com sideboard. Vitória 3 pontos,
          empate 1, derrota 0.
        </li>
        <li>
          Desempates: % de vitórias dos oponentes (mínimo 33%), % de jogos
          vencidos, % de jogos vencidos dos oponentes.
        </li>
        <li>
          Check-in no Endstep até 10 minutos antes. Atraso de mais de 10 minutos
          numa rodada: perda da partida.
        </li>
        <li>
          Desconexão: 5 minutos para voltar; depois, perda do jogo; mais de 10
          minutos, perda da partida.
        </li>
        <li>
          Tempo esgotado: o jogo em andamento ganha 5 turnos extras; sem
          vencedor, o jogo empata.
        </li>
      </ul>

      <h2>Liga Pauper</h2>
      <ul>
        <li>
          Deck de 60 cartas no mínimo e sideboard de até 15, pela lista oficial
          do Pauper.
        </li>
        <li>
          Rodadas suíças com todos: 3 rodadas com 8 jogadores, 4 com 9 ou mais.
        </li>
        <li>
          Prêmio por classificação: 8 a 11 jogadores (50/30/20%), 12 a 19
          (40/25/17,5/17,5%), 20 ou mais (30/20/12,5/12,5% e 6,25% do 5º ao 8º).
        </li>
      </ul>

      <h2>Liga Limited</h2>
      <ul>
        <li>
          Draft (3 pacotes de 15), selado (6 boosters) ou cubo oficial; deck
          mínimo de 40 cartas.
        </li>
        <li>Pods de 6 a 8 jogadores, 3 rodadas suíças dentro do pod.</li>
        <li>Prêmio por campanha: 3-0 vale 3 cotas, 2-1 vale 1 cota.</li>
      </ul>

      <h2>Conduta</h2>
      <ul>
        <li>Respeito a todos; nenhuma ofensa, assédio ou discriminação.</li>
        <li>
          Proibido: ajuda de terceiros, ferramentas que sugerem jogadas,
          assistir à própria mesa por outra conta, combinar resultados, usar
          mais de uma conta.
        </li>
        <li>
          Transmitir a própria partida é permitido com atraso mínimo de 3
          minutos.
        </li>
        <li>
          Penalidades vão de advertência a banimento, conforme a gravidade.
        </li>
      </ul>

      <h2>Eventos presenciais e proxies</h2>
      <p>
        Em eventos presenciais de formatos construídos, proxies são aceitas
        apenas para cartas de R$ 50 ou mais (menor preço da edição mais barata
        na LigaMagic), declaradas na decklist e avisadas ao oponente, legíveis,
        em sleeve opaco sobre uma carta de Magic e sem imitar a carta original.
      </p>
    </PaginaTexto>
  );
}
