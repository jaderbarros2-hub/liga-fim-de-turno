-- Bloco 2: inscrição com Pix (Mercado Pago)

-- Equipe pode registrar ações no histórico
grant insert on public.registro_atividades to authenticated;
create policy "equipe registra historico" on public.registro_atividades
  for insert with check (public.eh_equipe() and ator_id = auth.uid());

-- Consultas rápidas
create index if not exists pagamentos_inscricao_idx on public.pagamentos (inscricao_id, status);
create index if not exists inscricoes_evento_idx on public.inscricoes (evento_id, status);
create index if not exists inscricoes_jogador_idx on public.inscricoes (jogador_id);

-- Limpeza: Pix pendente que passou do prazo vira expirado (roda a cada 10 min)
create or replace function public.expirar_pix_vencidos()
returns void language sql security definer set search_path = public as $$
  with vencidos as (
    update public.pagamentos set status = 'expirado'
    where status = 'pendente' and expira_em < now() - interval '5 minutes'
    returning inscricao_id
  )
  update public.inscricoes i set status = 'expirada'
  where i.id in (select inscricao_id from vencidos) and i.status = 'aguardando_pagamento';
$$;

create extension if not exists pg_cron;
select cron.schedule('expirar-pix', '*/10 * * * *', $$select public.expirar_pix_vencidos()$$);
