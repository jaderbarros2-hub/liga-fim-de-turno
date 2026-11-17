-- Liga Fim de Turno (nome provisório) — estrutura inicial do MVP
-- Rodar no editor SQL do Supabase (projeto de teste primeiro, depois produção).

-- =====================================================================
-- Jogadores (um registro por conta de login)
-- =====================================================================
create table public.jogadores (
  id uuid primary key references auth.users (id) on delete cascade,
  discord_id text,
  discord_nome text,
  avatar_url text,
  nome text,
  email text,
  nascimento date,
  nick_endstep text,
  cpf text unique,
  chave_pix text,
  responsavel_nome text,
  responsavel_cpf text,
  papel text not null default 'jogador'
    check (papel in ('jogador', 'autor', 'juiz', 'organizador')),
  aceite_termos_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Funções auxiliares de permissão (security definer evita recursão nas regras)
create or replace function public.papel_atual()
returns text
language sql stable security definer set search_path = public
as $$ select papel from public.jogadores where id = auth.uid() $$;

create or replace function public.eh_organizador()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.papel_atual() = 'organizador', false) $$;

create or replace function public.eh_equipe()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.papel_atual() in ('organizador', 'juiz'), false) $$;

-- Cria o registro do jogador quando alguém entra pela primeira vez (login com Discord)
create or replace function public.criar_jogador()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.jogadores (id, email, discord_id, discord_nome, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'provider_id',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_jogador();

-- Visão pública: só dados que podem aparecer no site
create view public.jogadores_publico
with (security_invoker = false) as
  select id, nick_endstep, discord_nome, avatar_url from public.jogadores;

-- =====================================================================
-- Ligas e eventos
-- =====================================================================
create table public.ligas (
  id serial primary key,
  slug text not null unique,
  nome text not null,
  descricao text
);

insert into public.ligas (slug, nome, descricao) values
  ('pauper', 'Liga Pauper', 'Só cartas comuns, decks acessíveis e jogo competitivo toda semana.'),
  ('limited', 'Liga Limited', 'Draft, selado e cubo em pods de até 8 jogadores.');

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  liga_id int not null references public.ligas (id),
  slug text not null unique,
  titulo text not null,
  formato text not null check (formato in ('pauper', 'draft', 'selado', 'cubo')),
  colecao text,
  inicio timestamptz not null,
  modalidade text not null default 'online' check (modalidade in ('online', 'presencial')),
  local text,
  valor_centavos int not null default 1500 check (valor_centavos >= 0),
  vagas int check (vagas is null or vagas > 0),
  minimo int not null default 8,
  inscricoes_ate timestamptz not null,
  percentual_premio int not null default 80 check (percentual_premio between 0 and 100),
  detalhes text,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'aberto', 'fechado', 'em_andamento', 'encerrado', 'resultados', 'cancelado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Link privado do Endstep fica separado para só chegar a quem pagou
create table public.evento_links (
  evento_id uuid primary key references public.eventos (id) on delete cascade,
  link_endstep text not null,
  atualizado_em timestamptz not null default now()
);

-- =====================================================================
-- Inscrições e pagamentos
-- =====================================================================
create table public.inscricoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'confirmada', 'expirada', 'cancelada', 'reembolsada')),
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  cancelado_em timestamptz,
  unique (evento_id, jogador_id)
);

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  inscricao_id uuid not null references public.inscricoes (id) on delete cascade,
  provedor text not null default 'mercadopago',
  id_externo text unique,
  valor_centavos int not null,
  tarifa_centavos int,
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'expirado', 'cancelado', 'reembolsado')),
  pix_copia_cola text,
  pix_qr_base64 text,
  expira_em timestamptz,
  pago_em timestamptz,
  criado_em timestamptz not null default now()
);

-- Contagem e nicks de inscritos confirmados (público)
create view public.inscritos_publico
with (security_invoker = false) as
  select i.evento_id, j.nick_endstep, j.discord_nome, i.confirmado_em
  from public.inscricoes i
  join public.jogadores j on j.id = i.jogador_id
  where i.status = 'confirmada';

-- =====================================================================
-- Resultados, prêmios, créditos e ocorrências
-- =====================================================================
create table public.resultados (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  jogador_id uuid references public.jogadores (id),
  nick_endstep text not null,
  posicao int not null,
  pontos int not null default 0,
  vitorias int not null default 0,
  empates int not null default 0,
  derrotas int not null default 0,
  unique (evento_id, posicao)
);

create table public.premios (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  jogador_id uuid not null references public.jogadores (id),
  valor_centavos int not null check (valor_centavos >= 0),
  status text not null default 'a_pagar' check (status in ('a_pagar', 'pago')),
  pago_em timestamptz,
  comprovante_url text,
  criado_em timestamptz not null default now()
);

create table public.creditos_reembolsos (
  id uuid primary key default gen_random_uuid(),
  jogador_id uuid not null references public.jogadores (id),
  inscricao_id uuid references public.inscricoes (id),
  tipo text not null check (tipo in ('credito', 'reembolso')),
  valor_centavos int not null,
  status text not null default 'pendente' check (status in ('pendente', 'concluido', 'usado')),
  usado_em_inscricao_id uuid references public.inscricoes (id),
  criado_em timestamptz not null default now()
);

create table public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.eventos (id) on delete cascade,
  jogador_id uuid references public.jogadores (id),
  tipo text not null,
  descricao text,
  registrado_por uuid references public.jogadores (id),
  criado_em timestamptz not null default now()
);

-- =====================================================================
-- Conteúdo, configurações e histórico
-- =====================================================================
create table public.paginas (
  slug text primary key,
  titulo text not null,
  conteudo text not null default '',
  atualizado_em timestamptz not null default now()
);

create table public.configuracoes (
  chave text primary key,
  valor jsonb not null
);

create table public.registro_atividades (
  id bigserial primary key,
  ator_id uuid references public.jogadores (id),
  acao text not null,
  entidade text,
  entidade_id text,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);

-- =====================================================================
-- Regras de acesso (Row Level Security)
-- Gravações sensíveis (pagamentos, confirmações, prêmios) são feitas pelo
-- servidor com a chave de serviço, que ignora estas regras.
-- =====================================================================
alter table public.jogadores enable row level security;
alter table public.ligas enable row level security;
alter table public.eventos enable row level security;
alter table public.evento_links enable row level security;
alter table public.inscricoes enable row level security;
alter table public.pagamentos enable row level security;
alter table public.resultados enable row level security;
alter table public.premios enable row level security;
alter table public.creditos_reembolsos enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.paginas enable row level security;
alter table public.configuracoes enable row level security;
alter table public.registro_atividades enable row level security;

-- Jogadores: cada um vê e edita o próprio cadastro; organizador vê todos
create policy "jogador ve o proprio cadastro" on public.jogadores
  for select using (id = auth.uid() or public.eh_organizador());
create policy "jogador edita o proprio cadastro" on public.jogadores
  for update using (id = auth.uid()) with check (id = auth.uid() and papel = public.papel_atual());
create policy "organizador edita cadastros" on public.jogadores
  for update using (public.eh_organizador());

-- Ligas e páginas: leitura pública
create policy "ligas publicas" on public.ligas for select using (true);
create policy "paginas publicas" on public.paginas for select using (true);
create policy "organizador edita paginas" on public.paginas for all
  using (public.eh_organizador()) with check (public.eh_organizador());

-- Eventos: públicos fora do rascunho; equipe gerencia
create policy "eventos publicos" on public.eventos
  for select using (status <> 'rascunho' or public.eh_equipe());
create policy "equipe gerencia eventos" on public.eventos for all
  using (public.eh_equipe()) with check (public.eh_equipe());

-- Link do Endstep: só equipe ou inscrito confirmado
create policy "link para confirmados" on public.evento_links
  for select using (
    public.eh_equipe() or exists (
      select 1 from public.inscricoes i
      where i.evento_id = evento_links.evento_id
        and i.jogador_id = auth.uid()
        and i.status = 'confirmada'
    )
  );
create policy "equipe gerencia links" on public.evento_links for all
  using (public.eh_equipe()) with check (public.eh_equipe());

-- Inscrições e pagamentos: o próprio jogador e a equipe veem
create policy "inscricoes do jogador" on public.inscricoes
  for select using (jogador_id = auth.uid() or public.eh_equipe());
create policy "pagamentos do jogador" on public.pagamentos
  for select using (
    public.eh_organizador() or exists (
      select 1 from public.inscricoes i where i.id = pagamentos.inscricao_id and i.jogador_id = auth.uid()
    )
  );

-- Resultados e prêmios: públicos quando o evento publica resultados
create policy "resultados publicos" on public.resultados
  for select using (
    public.eh_equipe() or exists (
      select 1 from public.eventos e where e.id = resultados.evento_id and e.status = 'resultados'
    )
  );
create policy "equipe gerencia resultados" on public.resultados for all
  using (public.eh_equipe()) with check (public.eh_equipe());
create policy "premios visiveis" on public.premios
  for select using (
    jogador_id = auth.uid() or public.eh_organizador() or exists (
      select 1 from public.eventos e where e.id = premios.evento_id and e.status = 'resultados'
    )
  );

-- Créditos: o próprio jogador e o organizador
create policy "creditos do jogador" on public.creditos_reembolsos
  for select using (jogador_id = auth.uid() or public.eh_organizador());

-- Ocorrências: só equipe
create policy "equipe ve ocorrencias" on public.ocorrencias for all
  using (public.eh_equipe()) with check (public.eh_equipe());

-- Configurações e histórico: só organizador
create policy "organizador ve configuracoes" on public.configuracoes for all
  using (public.eh_organizador()) with check (public.eh_organizador());
create policy "organizador ve historico" on public.registro_atividades
  for select using (public.eh_organizador());

-- Visões públicas
grant select on public.jogadores_publico to anon, authenticated;
grant select on public.inscritos_publico to anon, authenticated;

-- Páginas de texto iniciais (editáveis depois no painel)
insert into public.paginas (slug, titulo, conteudo) values
  ('sobre', 'Sobre a liga', ''),
  ('como-jogar', 'Como jogar', ''),
  ('regras', 'Regras e políticas', ''),
  ('perguntas-frequentes', 'Perguntas frequentes', ''),
  ('termos', 'Termos de uso', ''),
  ('privacidade', 'Política de privacidade', '');

-- =====================================================================
-- Permissões das tabelas (o projeto não expõe tabelas novas
-- automaticamente; as regras de RLS acima continuam valendo)
-- =====================================================================
grant select on public.ligas, public.eventos, public.paginas, public.resultados, public.premios
  to anon, authenticated;
grant select, update on public.jogadores to authenticated;
grant select on public.evento_links, public.inscricoes, public.pagamentos,
  public.creditos_reembolsos, public.registro_atividades to authenticated;
grant insert, update, delete on public.eventos, public.evento_links, public.resultados,
  public.ocorrencias, public.paginas, public.configuracoes to authenticated;
grant select on public.ocorrencias, public.configuracoes to authenticated;
grant usage, select on all sequences in schema public to authenticated;
