# Pendências e ideias para tratar depois

Lista viva do que ficou combinado para fases futuras. Atualizada em 18/11/2026.

## 1. Overhaul de texto (todo o portal)

- Página do evento e ingresso: descrever horário do check-in, horário de início das rodadas e como confirmar presença no Endstep (campos próprios no cadastro do evento).

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
- Jurídico: incluir a Carteira (guarda de saldo de jogadores, saque automático em 30 dias) na conversa com o advogado; avaliar regras do Banco Central.
- E-mail avisando saque automático e depósito feito (depende do domínio).
- Pagamento automático de saques via API do Mercado Pago (exige aprovação da conta) em vez de Pix manual.
- Jurídico: validar com Wizards/Endstep/advogado a cobrança de ingresso com prêmio em dinheiro (ver conversa de 18/11).

## 4. Dados fictícios para a apresentação (por último)

Temporada simulada: ~60 jogadores, etapas de janeiro a novembro com resultados e decks, Finais do Trimestre, artigos e parceiros com nomes inventados.
Tudo marcado no banco de teste para limpar com um comando antes da produção.

## Seja apoiador (/apoie) — esboço no ar, falta definir
- Valores (hoje R$ 19,90/mês e R$ 199/ano), brindes finais e meta da comunidade (hoje fictícia: 23/50).
- Integração: Assinaturas do Mercado Pago (preapproval, mensal/anual), webhook, gestão na Minha área, endereço para brindes.
- Insígnia "Apoiador" (azul) / "Apoiador anual" (ouro) e losango ao lado do nick.
- ATENÇÃO: a Fan Content Policy da Wizards proíbe cobrar acesso a conteúdo (artigos exclusivos/paywall). Benefícios devem ser comunidade, reconhecimento e brindes com a marca da liga (sem arte de cartas/logos da Wizards).

## E-mails e Carteira — próximos passos
- Lembretes agendados (precisam de cron): 24h antes do evento, deck pendente no Pauper, aviso 7 dias antes do saque automático. O saque automático (pg_cron) ainda não manda e-mail.
- Domínio próprio no Resend para enviar a qualquer jogador (hoje só chega no e-mail dono da conta).
- Pagar lojas e saques pela API de Payouts do Mercado Pago (botão "pagar pendentes").
- Futuro da Carteira: desconto em ingressos e lojinha de brindes da liga.
- Termo simples de parceria com as lojas (prazo de 2 dias úteis, bônus, dados do cliente).

- Limpeza: apagar o ajuste "Saldo de teste (apagar depois)" de R$ 50 da Carteira do Infinity420.
