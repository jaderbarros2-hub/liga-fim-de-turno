-- Decks: lista do jogador, deck usado em cada evento e base para o metagame

-- Arquétipos (lista mantida pelo organizador no Painel)
create table public.arquetipos (
  id serial primary key,
  formato text not null default 'pauper',
  nome text not null,
  ativo boolean not null default true,
  unique (formato, nome)
);
insert into public.arquetipos (formato, nome) values
  ('pauper', 'Affinity'), ('pauper', 'Bogles'), ('pauper', 'Boros Synthesizer'), ('pauper', 'Caw-Gates'),
  ('pauper', 'Dimir Faeries'), ('pauper', 'Dimir Terror'), ('pauper', 'Elves'), ('pauper', 'Familiar Combo'),
  ('pauper', 'Flicker Tron'), ('pauper', 'Golgari Gardens'), ('pauper', 'Grixis Affinity'), ('pauper', 'Jund Wildfire'),
  ('pauper', 'Kuldotha Burn'), ('pauper', 'Mono-Black Control'), ('pauper', 'Mono-Blue Terror'),
  ('pauper', 'Mono-Green Stompy'), ('pauper', 'Mono-Red Burn'), ('pauper', 'Orzhov Blade'), ('pauper', 'Rakdos Madness'),
  ('pauper', 'Walls Combo'), ('pauper', 'Outro');

-- Cache de cartas do Scryfall
create table public.cartas (
  chave text primary key,
  nome text not null,
  tipo text not null default '',
  custo text,
  cmc numeric not null default 0,
  cores text[] not null default '{}',
  imagem text,
  imagem_grande text,
  legal_pauper boolean not null default false,
  qualquer_quantidade boolean not null default false,
  atualizado_em timestamptz not null default now()
);

-- Decks do jogador
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  nome text not null,
  formato text not null default 'pauper',
  arquetipo_id int references public.arquetipos (id),
  principal jsonb not null default '[]',
  sideboard jsonb not null default '[]',
  qtd_principal int not null default 0,
  qtd_sideboard int not null default 0,
  legal boolean not null default false,
  problemas text[] not null default '{}',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index decks_jogador_idx on public.decks (jogador_id);

-- Deck usado no evento: cópia congelada da lista no momento do envio
alter table public.inscricoes
  add column deck_id uuid references public.decks (id) on delete set null,
  add column deck_nome text,
  add column arquetipo_id int references public.arquetipos (id),
  add column deck_principal jsonb,
  add column deck_sideboard jsonb,
  add column deck_enviado_em timestamptz;

-- Regras de acesso
alter table public.arquetipos enable row level security;
alter table public.cartas enable row level security;
alter table public.decks enable row level security;

create policy "arquetipos publicos" on public.arquetipos for select using (true);
create policy "organizador gerencia arquetipos" on public.arquetipos for all
  using (public.eh_organizador()) with check (public.eh_organizador());
create policy "cartas publicas" on public.cartas for select using (true);
create policy "jogador ve os proprios decks" on public.decks
  for select using (jogador_id = auth.uid() or public.eh_equipe());

grant select on public.arquetipos, public.cartas to anon, authenticated;
grant insert, update, delete on public.arquetipos to authenticated;
grant select on public.decks to authenticated;
grant usage, select on all sequences in schema public to authenticated;
