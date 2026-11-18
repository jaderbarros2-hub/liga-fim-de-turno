-- Circuito: 4 etapas por mês; a última etapa de cada trimestre é a Final do Trimestre;
-- em dezembro, o Player of the Year reúne os campeões e vices trimestrais (top 8).

alter table public.eventos
  add column tipo text not null default 'etapa'
    check (tipo in ('etapa', 'final_trimestre', 'player_of_the_year'));

create index eventos_circuito_idx on public.eventos (liga_id, tipo, inicio);
