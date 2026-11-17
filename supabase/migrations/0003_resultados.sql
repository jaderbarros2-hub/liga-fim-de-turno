-- Bloco 3: resultados e prêmios

-- Divisão do prêmio por posição (percentuais), editável por evento
alter table public.eventos
  add column if not exists distribuicao_premio int[] not null default '{50,30,10,10}';

-- Posição premiada e observação do pagamento do prêmio
alter table public.premios add column if not exists posicao int;
alter table public.premios add column if not exists observacao text;
create unique index if not exists premios_evento_jogador_idx on public.premios (evento_id, jogador_id);

-- Totais públicos de prêmio por posição (só de eventos com resultado publicado)
create or replace view public.premios_publico
with (security_invoker = false) as
  select p.evento_id, p.posicao, p.valor_centavos, p.status
  from public.premios p
  join public.eventos e on e.id = p.evento_id
  where e.status = 'resultados';
grant select on public.premios_publico to anon, authenticated;
