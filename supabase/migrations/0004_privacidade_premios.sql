-- Valores de prêmio: só o próprio jogador e o organizador enxergam.
-- O site público mostra apenas o valor da inscrição e o percentual da premiação.

drop view if exists public.premios_publico;

drop policy if exists "premios visiveis" on public.premios;
create policy "premios do jogador" on public.premios
  for select using (jogador_id = auth.uid() or public.eh_organizador());

revoke select on public.premios from anon;
