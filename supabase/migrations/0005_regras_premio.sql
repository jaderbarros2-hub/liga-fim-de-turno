-- Prêmio segue a regra da liga (Pauper por tamanho do evento, Limited por campanha).
-- distribuicao_premio passa a ser só uma divisão personalizada opcional (null = regra da liga).
alter table public.eventos alter column distribuicao_premio drop not null;
alter table public.eventos alter column distribuicao_premio drop default;
alter table public.eventos alter column distribuicao_premio type numeric[] using distribuicao_premio::numeric[];
update public.eventos set distribuicao_premio = null;
