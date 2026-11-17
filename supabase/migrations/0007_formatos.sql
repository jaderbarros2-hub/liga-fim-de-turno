-- Formatos no menu: ligas ativas aparecem em "Formatos"; novas entram desativadas
alter table public.ligas add column if not exists ativo boolean not null default true;
alter table public.ligas add column if not exists ordem int not null default 0;
update public.ligas set ordem = 1 where slug = 'pauper';
update public.ligas set ordem = 2 where slug = 'limited';
insert into public.ligas (slug, nome, descricao, ativo, ordem) values
  ('modern', 'Liga Modern', 'Em breve.', false, 3),
  ('premodern', 'Liga Premodern', 'Em breve.', false, 4)
on conflict (slug) do nothing;
grant update on public.ligas to authenticated;
create policy "organizador edita ligas" on public.ligas for update
  using (public.eh_organizador()) with check (public.eh_organizador());
