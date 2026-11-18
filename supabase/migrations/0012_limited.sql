-- Limited: coleções (draft e selado, via Scryfall) e cubos (via Cube Cobra)

create table public.colecoes (
  codigo text primary key,            -- código da coleção no Scryfall (ex.: ecl)
  nome text not null,
  icone_svg text,                     -- símbolo da coleção
  lancamento date,
  total_cartas int,
  tipo text,                          -- expansion, core, masters, draft_innovation...
  arte_url text,                      -- arte de capa (enviada em alta ou carta mítica do Scryfall)
  arte_credito text,
  destaques jsonb not null default '[]', -- raras e míticas para a galeria
  atualizado_em timestamptz not null default now()
);

create table public.cubos (
  id uuid primary key default gen_random_uuid(),
  cubecobra_id text not null unique,  -- id curto do Cube Cobra (ex.: LSVCube)
  nome text not null,
  dono text,
  descricao text,
  imagem_url text,
  imagem_credito text,
  total_cartas int,
  cartas jsonb not null default '[]',  -- lista mais recente
  atualizado_em timestamptz not null default now()
);

-- Lista do cubo congelada na data do evento (o cubo muda com o tempo no Cube Cobra)
create table public.evento_cubo (
  evento_id uuid primary key references public.eventos (id) on delete cascade,
  cubo_id uuid not null references public.cubos (id),
  cartas jsonb not null,
  congelado_em timestamptz not null default now()
);

alter table public.eventos
  add column colecao_codigo text references public.colecoes (codigo),
  add column cubo_id uuid references public.cubos (id),
  add column pacotes int check (pacotes is null or pacotes between 1 and 12);

alter table public.colecoes enable row level security;
alter table public.cubos enable row level security;
alter table public.evento_cubo enable row level security;
create policy "colecoes publicas" on public.colecoes for select using (true);
create policy "cubos publicos" on public.cubos for select using (true);
create policy "listas de cubo publicas" on public.evento_cubo for select using (true);
grant select on public.colecoes, public.cubos, public.evento_cubo to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('colecoes', 'colecoes', true)
on conflict (id) do nothing;
