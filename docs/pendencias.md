# Pendências e ideias para tratar depois

Lista viva do que ficou combinado para fases futuras. Atualizada em 18/11/2026.

## 1. Overhaul de texto (todo o portal)

Os textos atuais são rascunho e estão genéricos. Revisar com calma, com pesquisa, página por página:
home, circuito, formatos (Pauper e Limited), sobre, como jogar, regras, perguntas frequentes, evento, login, Minha área, parceiros e blog.

## 2. Dinâmica do circuito: "jogue quando quiser"

Princípio: **toda etapa vale por si; o circuito é bônus.**

- Ninguém precisa jogar todas as etapas. A pessoa pode jogar um evento avulso (ex.: só um draft ou cubo de que gostou) e tem o resultado e o prêmio daquele evento.
- Toda participação já coloca o jogador no ranking. Reforçar na comunicação: "Sempre que você joga, aumenta a chance de ficar bem ranqueado."
- A Final do Trimestre continua aberta a todos: uma noite boa pode levar ao Player of the Year.
- Comunicar os dois jeitos de jogar: **jogo avulso** (prêmio do evento, top 8, destaque) e **circuito** (pontos acumulados ao longo da temporada).
- Tirar dos textos a ideia de "precisa jogar toda semana".

### A decidir

- **Vagas do Player of the Year:** hoje são 4 campeões + 4 vices dos trimestres (ranking só preenche repetidas). Avaliar dar parte das vagas aos **melhores ranqueados** do ano.
- **Melhores N resultados:** contar só os melhores resultados do trimestre (sugestão: 6 de ~12 etapas) para não punir quem joga menos.
- **Conquistas no perfil:** selos que não dependem de volume (primeira vitória, campeão de etapa, 3-0 no draft, top 8, jogou 3 coleções).
- **Passaporte da temporada:** recompensa por presença (ex.: a cada 10 etapas, uma inscrição grátis ou brinde de parceiro). Ideia para 2027.
- **Perfil público do jogador** (link no ranking): resultados, decks do top 8 e conquistas, sem valores de prêmio.

## 3. Técnico e infraestrutura

- Mercado Pago: configurar o webhook e o segredo; testar o fluxo completo.
- Credenciais de produção do Mercado Pago.
- Banco de produção em São Paulo e migração de todas as tabelas.
- Domínio definitivo; e-mails automáticos (Resend); avisos no Discord (etapa aberta, resultado).
- Deixar o repositório privado e revogar o token do GitHub colado na conversa.
- Apagar o projeto duplicado na Vercel (liga-fim-de-turno-m5l3), com a confirmação do Jader.
- Contato com o Endstep sobre API para importar resultados.
- Apagar `src/components/VisualDeck.tsx` e `src/app/eventos/[slug]/inscricao/BotaoGerar.tsx` (não são mais usados).
- Cartão de crédito no ingresso (Mercado Pago Card Payment Brick, transparente).
- E-mail de confirmação do ingresso (depende do domínio e do Resend).
- Jurídico: validar com Wizards/Endstep/advogado a cobrança de ingresso com prêmio em dinheiro (ver conversa de 18/11).

## 4. Dados fictícios para a apresentação (por último)

Temporada simulada: ~60 jogadores, etapas de janeiro a novembro com resultados e decks, Finais do Trimestre, artigos e parceiros com nomes inventados.
Tudo marcado no banco de teste para limpar com um comando antes da produção.
