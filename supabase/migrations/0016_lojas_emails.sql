-- Lojas e parceiros num cadastro só (sede de eventos, crédito, patrocínio, venda de cartas),
-- evento presencial ligado à loja, resgate de prêmio em loja e registro de e-mails enviados

alter table public.parceiros
  alter column site_url drop not null,
  add column slug text unique,
  add column sede_eventos boolean not null default false,
  add column mostrar_logo boolean not null default true,
  add column foto_url text,
  add column cep text,
  add column logradouro text,
  add column numero text,
  add column complemento text,
  add column bairro text,
  add column cidade text,
  add column uf text,
  add column mapa_url text,
  add column instagram text,
  add column whatsapp text,
  add column horario text,
  add column mesas int check (mesas is null or mesas > 0),
  add column observacoes_local text;

-- Endereço curto das páginas: nome-da-loja (com sufixo quando repetir)
with base as (
  select id,
    nullif(trim(both '-' from lower(regexp_replace(
      translate(nome, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
      '[^a-zA-Z0-9]+', '-', 'g'))), '') as s,
    row_number() over (partition by lower(nome) order by criado_em) as n
  from public.parceiros
)
update public.parceiros p
set slug = coalesce(b.s, 'loja') || case when b.n > 1 then '-' || b.n else '' end
from base b where b.id = p.id;

-- Dados para repassar crédito à loja (só a organização vê)
create table public.lojas_credito (
  parceiro_id uuid primary key references public.parceiros (id) on delete cascade,
  razao_social text,
  cnpj text,
  pix_tipo text check (pix_tipo in ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  pix_chave text,
  pix_titular text,
  email_pedidos text,                       -- recebe os pedidos de crédito
  url_cadastro text,                        -- onde o jogador cria a conta na loja
  identificacao text not null default 'email' check (identificacao in ('email', 'cpf', 'usuario')),
  atualizado_em timestamptz not null default now()
);
alter table public.lojas_credito enable row level security;
create policy "organizador ve dados de credito" on public.lojas_credito for select using (public.eh_organizador());
grant select on public.lojas_credito to authenticated;

-- Evento presencial acontece numa loja cadastrada (local vira observação: sala, mesa etc.)
alter table public.eventos add column loja_id uuid references public.parceiros (id);
update public.eventos set local = null where modalidade = 'online';

-- Resgate em loja: crédito com bônus e a conta do jogador na loja
alter table public.carteira_movimentos
  add column credito_centavos int,
  add column conta_loja text;

-- E-mails enviados pelo portal
create table public.emails (
  id uuid primary key default gen_random_uuid(),
  para text not null,
  assunto text not null,
  tipo text not null,
  status text not null check (status in ('enviado', 'falhou', 'simulado')),
  erro text,
  id_externo text,
  jogador_id uuid references public.jogadores (id) on delete set null,
  referencia text,
  criado_em timestamptz not null default now()
);
create index emails_criado_idx on public.emails (criado_em desc);
alter table public.emails enable row level security;
create policy "organizador ve emails" on public.emails for select using (public.eh_organizador());
grant select on public.emails to authenticated;
