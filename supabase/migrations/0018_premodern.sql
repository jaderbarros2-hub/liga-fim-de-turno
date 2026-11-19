-- Liga Premodern: formato construído com cartas de Fourth Edition a Scourge (1995 a 2003)

update public.ligas
set ativo = true,
    ordem = 2,
    descricao = 'Magic clássico: cartas de Fourth Edition a Scourge, decks de 60 cartas e o metagame de 1995 a 2003.'
where slug = 'premodern';
update public.ligas set ordem = 3 where slug = 'limited';

-- Eventos e cupons aceitam o novo formato
alter table public.eventos drop constraint if exists eventos_formato_check;
alter table public.eventos add constraint eventos_formato_check check (formato in ('pauper', 'premodern', 'draft', 'selado', 'cubo'));
alter table public.cupons drop constraint if exists cupons_formato_check;
alter table public.cupons add constraint cupons_formato_check check (formato in ('pauper', 'premodern', 'limited'));

-- Legalidade no Premodern vem do Scryfall (vazio = ainda não consultada; a carta é buscada de novo)
alter table public.cartas add column if not exists legal_premodern boolean;

-- Arquétipos iniciais (o organizador ajusta em Painel → Arquétipos)
insert into public.arquetipos (formato, nome) values
  ('premodern', 'Burn'), ('premodern', 'Goblins'), ('premodern', 'Elves'), ('premodern', 'Stiflenought'),
  ('premodern', 'The Rock'), ('premodern', 'Enchantress'), ('premodern', 'Oath of Druids'), ('premodern', 'Replenish'),
  ('premodern', 'Landstill'), ('premodern', 'Deadguy Ale'), ('premodern', 'Mono Black'), ('premodern', 'Survival'),
  ('premodern', 'Madness'), ('premodern', 'Merfolk'), ('premodern', 'Astral Slide'), ('premodern', 'Outro')
on conflict (formato, nome) do nothing;
