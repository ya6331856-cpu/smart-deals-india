alter table public.deals add column if not exists source_external_id text;
create unique index if not exists deals_source_external_id_unique
on public.deals(source_external_id)
where source_external_id is not null;
