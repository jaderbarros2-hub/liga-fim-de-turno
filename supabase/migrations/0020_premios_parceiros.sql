-- Prêmios extras oferecidos por parceiros (cupom de desconto, booster, brinde) e banners com arte própria.
-- A parceria é por permuta: a loja premia e divulga, a liga dá visibilidade e relatório de cliques.

create table if not exists public.premios_parceiros (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  parceiro_id uuid not null references public.parceiros (id) on delete cascade,
  tipo text not null default 'cupom' check (tipo in ('cupom', 'booster', 'brinde')),
  descricao text not null,               -- "Cupom de R$ 100 na loja"
  valor_centavos int,                    -- valor de referência (opcional)
  criterio text not null default 'posicao' check (criterio in ('posicao', 'sorteio')),
  posicao int default 1,                 -- quando o critério é posição
  codigo text,                           -- código do cupom: só o vencedor e a organização veem
  validade date,
  jogador_id uuid references public.jogadores (id) on delete set null,
  entregue_em timestamptz,
  criado_em timestamptz not null default now()
);
create index if not exists premios_parceiros_evento_idx on public.premios_parceiros (evento_id);
create index if not exists premios_parceiros_jogador_idx on public.premios_parceiros (jogador_id);

alter table public.premios_parceiros enable row level security;
create policy "premios de parceiros publicos" on public.premios_parceiros for select using (true);
create policy "organizacao gerencia premios de parceiros" on public.premios_parceiros for all
  using (public.eh_organizador()) with check (public.eh_organizador());

-- O código do cupom não é público: leitura por coluna
revoke select on public.premios_parceiros from anon, authenticated;
grant select (id, evento_id, parceiro_id, tipo, descricao, valor_centavos, criterio, posicao, validade, jogador_id, entregue_em, criado_em)
  on public.premios_parceiros to anon, authenticated;

-- Banner com arte própria da loja (imagem inteira, aceita GIF) ou composto (logo + texto sobre a imagem)
alter table public.banners add column if not exists formato text not null default 'composto'
  check (formato in ('composto', 'imagem'));

select count(*) as premios_parceiros from public.premios_parceiros;
