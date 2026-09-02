-- VOLARE JOURNEY MAP · CONFIGURACIÓN ÚNICA DE SUPABASE
-- Copiar todo este archivo en Supabase > SQL Editor > New query y presionar Run.

create table if not exists public.volare_boards (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_volare_board_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_volare_board_updated_at on public.volare_boards;
create trigger set_volare_board_updated_at
before update on public.volare_boards
for each row execute function public.set_volare_board_updated_at();

alter table public.volare_boards enable row level security;
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.volare_boards to anon, authenticated;

drop policy if exists "Volare leer tablero compartido" on public.volare_boards;
create policy "Volare leer tablero compartido"
on public.volare_boards for select
to anon, authenticated
using (id = 'volare-main');

drop policy if exists "Volare crear tablero compartido" on public.volare_boards;
create policy "Volare crear tablero compartido"
on public.volare_boards for insert
to anon, authenticated
with check (id = 'volare-main');

drop policy if exists "Volare actualizar tablero compartido" on public.volare_boards;
create policy "Volare actualizar tablero compartido"
on public.volare_boards for update
to anon, authenticated
using (id = 'volare-main')
with check (id = 'volare-main');

insert into storage.buckets (id, name, public, file_size_limit)
values ('volare-journey-files', 'volare-journey-files', true, 26214400)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Volare ver archivos" on storage.objects;
create policy "Volare ver archivos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'volare-journey-files');

drop policy if exists "Volare subir archivos" on storage.objects;
create policy "Volare subir archivos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'volare-journey-files');

drop policy if exists "Volare reemplazar archivos" on storage.objects;
create policy "Volare reemplazar archivos"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'volare-journey-files')
with check (bucket_id = 'volare-journey-files');

drop policy if exists "Volare borrar archivos" on storage.objects;
create policy "Volare borrar archivos"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'volare-journey-files');

