-- Blog no formato de portal: autores com foto e bio, tipo do artigo e contagem de leituras

create table public.autores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  bio text,
  avatar_url text,
  link text,
  criado_em timestamptz not null default now()
);
alter table public.autores enable row level security;
create policy "autores publicos" on public.autores for select using (true);
grant select on public.autores to anon, authenticated;

alter table public.artigos
  add column autor_id uuid references public.autores (id) on delete set null,
  add column tipo text not null default 'Artigo',
  add column visualizacoes int not null default 0;

-- Conta uma leitura (só de artigo publicado). Chamado pela página do artigo.
create or replace function public.registrar_leitura(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.artigos set visualizacoes = visualizacoes + 1
  where slug = p_slug and status = 'publicado' and publicado_em <= now();
$$;
grant execute on function public.registrar_leitura(text) to anon, authenticated;

-- Primeiro autor: o organizador, com a foto do Discord
insert into public.autores (nome, bio, avatar_url)
select coalesce(nullif(j.nome, ''), nullif(j.nick_endstep, ''), j.discord_nome, 'Organização'), 'Organizador da Liga Fim de Turno. Joga Pauper desde sempre e Limited sempre que dá.', j.avatar_url
from public.jogadores j where j.papel = 'organizador'
order by j.criado_em limit 1
on conflict (nome) do nothing;

update public.artigos a set autor_id = au.id from public.autores au where a.autor_id is null and au.nome = a.autor_nome;
