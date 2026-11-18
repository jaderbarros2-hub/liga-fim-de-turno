-- Carteira do jogador: prêmios, créditos, compra de ingresso, saques por Pix e envios para lojas parceiras

create table public.carteira_movimentos (
  id uuid primary key default gen_random_uuid(),
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  tipo text not null check (tipo in ('premio', 'credito', 'ajuste', 'ingresso', 'saque', 'envio_loja')),
  valor_centavos int not null,               -- positivo entra, negativo sai
  status text not null default 'concluido' check (status in ('concluido', 'pendente', 'cancelado')),
  descricao text,
  premio_id uuid references public.premios (id) on delete set null,
  inscricao_id uuid references public.inscricoes (id) on delete set null,
  parceiro_id uuid references public.parceiros (id) on delete set null,
  automatico boolean not null default false, -- saque automático (30 dias) ou reembolso
  chave_pix text,                            -- chave usada no saque (cópia do momento)
  codigo_loja text,                          -- cupom/crédito gerado pela loja parceira
  concluido_em timestamptz,
  criado_em timestamptz not null default now()
);
create index carteira_jogador_idx on public.carteira_movimentos (jogador_id, criado_em desc);
create index carteira_pendentes_idx on public.carteira_movimentos (tipo, status) where status = 'pendente';
create unique index carteira_premio_unico on public.carteira_movimentos (premio_id) where premio_id is not null;

alter table public.carteira_movimentos enable row level security;
create policy "carteira do jogador" on public.carteira_movimentos
  for select using (jogador_id = auth.uid() or public.eh_organizador());
grant select on public.carteira_movimentos to authenticated;

-- Saldo disponível: o que entrou menos o que saiu (saídas pendentes já reservam o valor)
create or replace function public.saldo_carteira(p_jogador uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(valor_centavos), 0)::int from public.carteira_movimentos
  where jogador_id = p_jogador and status <> 'cancelado';
$$;

-- Chave Pix: tipo e conferência do titular (feita pela organização no primeiro pagamento)
alter table public.jogadores
  add column pix_tipo text check (pix_tipo in ('cpf', 'email', 'telefone', 'aleatoria')),
  add column pix_verificado_em timestamptz;

-- Lojas parceiras que aceitam receber crédito da liga
alter table public.parceiros
  add column aceita_credito boolean not null default false,
  add column instrucoes_credito text,
  add column bonus_credito_pct int not null default 0 check (bonus_credito_pct between 0 and 100);

-- Créditos antigos (ingressos cancelados) entram na carteira
insert into public.carteira_movimentos (jogador_id, tipo, valor_centavos, status, descricao, inscricao_id, concluido_em, criado_em)
select jogador_id, 'credito', valor_centavos, 'concluido', 'Ingresso cancelado', inscricao_id, criado_em, criado_em
from public.creditos_reembolsos where tipo = 'credito' and status = 'pendente';
insert into public.carteira_movimentos (jogador_id, tipo, valor_centavos, status, descricao, inscricao_id, concluido_em, criado_em)
select jogador_id, 'credito', valor_centavos, 'concluido', 'Ingresso cancelado (reembolso)', inscricao_id, criado_em, criado_em
from public.creditos_reembolsos where tipo = 'reembolso' and status = 'pendente';
insert into public.carteira_movimentos (jogador_id, tipo, valor_centavos, status, descricao, inscricao_id, automatico, criado_em)
select jogador_id, 'saque', -valor_centavos, 'pendente', 'Reembolso de ingresso', inscricao_id, true, criado_em
from public.creditos_reembolsos where tipo = 'reembolso' and status = 'pendente';
update public.creditos_reembolsos set status = 'concluido' where status = 'pendente';

-- Saldo parado há 30 dias vira saque automático para a chave Pix (sem valor mínimo)
create or replace function public.saques_automaticos()
returns int language plpgsql security definer set search_path = public as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select m.jogador_id, sum(m.valor_centavos)::int as saldo, max(m.criado_em) as ultimo
    from public.carteira_movimentos m
    where m.status <> 'cancelado'
    group by m.jogador_id
    having sum(m.valor_centavos) > 0 and max(m.criado_em) < now() - interval '30 days'
  loop
    insert into public.carteira_movimentos (jogador_id, tipo, valor_centavos, status, descricao, automatico, chave_pix)
    select r.jogador_id, 'saque', -r.saldo, 'pendente', 'Saque automático (saldo parado há 30 dias)', true, j.chave_pix
    from public.jogadores j where j.id = r.jogador_id;
    n := n + 1;
  end loop;
  return n;
end;
$$;
select cron.schedule('saques-automaticos', '15 9 * * *', $$select public.saques_automaticos()$$);
