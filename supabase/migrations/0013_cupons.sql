-- Cupons de desconto no ingresso (inclusive 100% = ingresso gratuito)

create table public.cupons (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,               -- sempre em maiúsculas
  descricao text,                            -- uso interno (ex.: "Promo Discord dezembro")
  tipo text not null check (tipo in ('gratis', 'percentual', 'valor')),
  valor int not null default 0,              -- percentual (1-100) ou centavos
  evento_id uuid references public.eventos (id) on delete cascade, -- vazio = qualquer evento
  formato text check (formato in ('pauper', 'limited')),           -- vazio = qualquer formato
  limite_usos int check (limite_usos is null or limite_usos > 0),  -- vazio = ilimitado
  limite_por_jogador int not null default 1,
  valido_de timestamptz,
  valido_ate timestamptz,
  ativo boolean not null default true,
  lote text,                                 -- cupons gerados juntos
  criado_em timestamptz not null default now()
);

alter table public.pagamentos
  add column cupom_id uuid references public.cupons (id),
  add column desconto_centavos int not null default 0;

create index pagamentos_cupom_idx on public.pagamentos (cupom_id) where cupom_id is not null;

-- Só o servidor lê cupons (a validação acontece no checkout, com a chave de serviço)
alter table public.cupons enable row level security;
create policy "organizador ve cupons" on public.cupons for select using (public.eh_organizador());
