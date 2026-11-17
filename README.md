# Liga Fim de Turno (nome provisório)

Portal da liga de Magic: The Gathering (Pauper e Limited) jogada no Endstep: agenda de eventos, cadastro com
Discord, inscrição com Pix (Mercado Pago), resultados e prêmios.

Stack: Next.js 15 (App Router) · Supabase (Postgres, login, regras de acesso) · Vercel · Tailwind CSS 4.

## Configuração

1. **Banco:** no Supabase, abra *SQL Editor* e execute, em ordem, os arquivos de `supabase/migrations/` (0001, 0002...). O primeiro é
   `supabase/migrations/0001_estrutura_inicial.sql` e execute (primeiro no projeto de teste).
2. **Login com Discord:** em *Authentication > Sign In / Providers > Discord*, ative e cole o Client ID e o
   Client Secret da aplicação criada no portal de desenvolvedores do Discord. No Discord, cadastre o endereço de
   retorno mostrado pelo Supabase (`https://<projeto>.supabase.co/auth/v1/callback`). Em
   *Authentication > URL Configuration*, coloque o endereço do site em *Site URL* e
   `https://<site>/auth/callback` em *Redirect URLs*.
3. **Variáveis:** copie `.env.example` para `.env.local` (local) ou cadastre na Vercel
   (*Settings > Environment Variables*).
4. **Organizador:** depois de entrar no site pela primeira vez, rode no SQL Editor:

   ```sql
   update public.jogadores set papel = 'organizador' where email = 'seu-email@exemplo.com';
   ```

## Desenvolvimento

```bash
npm install
npm run dev
```

## Blocos do MVP

- [x] Bloco 0/1: base, identidade visual, páginas, login com Discord, cadastro, agenda, página do evento,
      painel de eventos (criar, editar, link do Endstep)
- [x] Bloco 2: inscrição e Pix (Mercado Pago), webhook, confirmação automática, cancelamento, confirmação manual no painel
- [ ] Avisos por e-mail e Discord (depende do domínio)
- [ ] Bloco 3: resultados colados do Endstep, cálculo de prêmios, pagamentos de prêmios, financeiro
