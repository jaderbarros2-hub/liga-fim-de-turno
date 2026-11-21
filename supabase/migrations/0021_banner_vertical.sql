-- Banner vertical (coluna lateral da página do evento e dos artigos): 600×800, proporção 3:4.
alter table public.banners add column if not exists imagem_vertical_url text;
select count(*) as banners from public.banners;
