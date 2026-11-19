-- Perguntas frequentes próprias de cada evento (além das padrão por formato e modalidade)
alter table public.eventos add column perguntas jsonb not null default '[]';
