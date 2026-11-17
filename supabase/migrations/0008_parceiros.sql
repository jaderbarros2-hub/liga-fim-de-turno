-- Parceiros (lojas e empresas que apoiam a liga), banners patrocinados e cliques rastreados

create table public.parceiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  logo_url text,
  site_url text not null,
  -- Link de compra por lista (opcional). Use {lista} onde a loja recebe a lista de cartas.
  -- Ex.: https://minhaloja.com.br/busca-por-lista?cards={lista}
  url_compra_lista text,
  compra_deck boolean not null default false,
  ativo boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros (id) on delete cascade,
  titulo text not null,
  texto text,
  imagem_url text,
  destino_url text not null,
  -- Onde aparece: home, evento, deck
  posicoes text[] not null default '{home}',
  inicio date,
  fim date,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.cliques (
  id bigserial primary key,
  parceiro_id uuid references public.parceiros (id) on delete set null,
  banner_id uuid references public.banners (id) on delete set null,
  origem text not null, -- logo, banner, deck
  pagina text,
  criado_em timestamptz not null default now()
);
create index cliques_parceiro_idx on public.cliques (parceiro_id, criado_em);

alter table public.parceiros enable row level security;
alter table public.banners enable row level security;
alter table public.cliques enable row level security;

create policy "parceiros ativos publicos" on public.parceiros for select using (ativo or public.eh_organizador());
create policy "banners ativos publicos" on public.banners for select using (ativo or public.eh_organizador());
create policy "organizador ve cliques" on public.cliques for select using (public.eh_organizador());

grant select on public.parceiros, public.banners to anon, authenticated;
grant select on public.cliques to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Imagens de logos e banners (bucket público; gravação só pelo servidor)
insert into storage.buckets (id, name, public)
values ('parceiros', 'parceiros', true)
on conflict (id) do nothing;
