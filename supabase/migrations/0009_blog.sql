-- Blog da liga: artigos escritos no Painel em Markdown

create table public.artigos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumo text,
  conteudo text not null default '',
  capa_url text,
  categoria text not null default 'geral', -- geral, pauper, limited, liga
  autor_nome text not null,
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index artigos_publicados_idx on public.artigos (status, publicado_em desc);

alter table public.artigos enable row level security;
create policy "artigos publicados sao publicos" on public.artigos
  for select using ((status = 'publicado' and publicado_em <= now()) or public.eh_organizador());
grant select on public.artigos to anon, authenticated;

-- Capas e imagens dos artigos (bucket público; gravação só pelo servidor)
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;
