-- Perfil público do jogador: bio, redes sociais e o que ele quer mostrar

alter table public.jogadores
  add column bio text check (bio is null or length(bio) <= 400),
  add column redes jsonb not null default '{}',
  add column mostrar_resultados boolean not null default true,
  add column mostrar_decks boolean not null default true,
  add column mostrar_artigos boolean not null default true;

-- Autor do blog ligado a um jogador (para a aba Artigos do perfil)
alter table public.autores
  add column jogador_id uuid unique references public.jogadores (id) on delete set null;

create index jogadores_nick_idx on public.jogadores (lower(nick_endstep));
