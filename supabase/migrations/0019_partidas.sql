-- Histórico de partidas de cada evento (quem jogou contra quem, rodada a rodada).
-- Importado por colagem do Endstep no painel de resultados; trocável por API no futuro.

create table if not exists public.partidas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  rodada int not null,
  fase text not null default 'suico' check (fase in ('suico', 'eliminatoria')),
  rotulo text, -- "Rodada 1", "Quartas", "Semifinal", "Final"
  mesa int,
  jogador_a text not null,
  jogador_b text, -- vazio = bye
  jogador_a_id uuid references public.jogadores (id) on delete set null,
  jogador_b_id uuid references public.jogadores (id) on delete set null,
  vitorias_a int not null default 0,
  vitorias_b int not null default 0,
  empates int not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists partidas_evento_idx on public.partidas (evento_id, rodada, mesa);

alter table public.partidas enable row level security;

create policy "partidas publicas" on public.partidas
  for select using (
    public.eh_equipe() or exists (
      select 1 from public.eventos e where e.id = partidas.evento_id and e.status = 'resultados'
    )
  );
create policy "equipe gerencia partidas" on public.partidas for all
  using (public.eh_equipe()) with check (public.eh_equipe());

select count(*) as partidas from public.partidas;
