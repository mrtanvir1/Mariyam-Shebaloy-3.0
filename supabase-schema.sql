-- Mariyam Shebaloy V8
-- Run once in Supabase SQL Editor.

create table if not exists public.clinic_workspaces (
  id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  patients jsonb not null default '[]'::jsonb,
  templates jsonb not null default '[]'::jsonb,
  custom_medicines jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clinic_workspaces enable row level security;

drop policy if exists "workspace_select_own" on public.clinic_workspaces;
drop policy if exists "workspace_insert_own" on public.clinic_workspaces;
drop policy if exists "workspace_update_own" on public.clinic_workspaces;
drop policy if exists "workspace_delete_own" on public.clinic_workspaces;

create policy "workspace_select_own" on public.clinic_workspaces
for select to authenticated using (id = auth.uid());

create policy "workspace_insert_own" on public.clinic_workspaces
for insert to authenticated with check (id = auth.uid());

create policy "workspace_update_own" on public.clinic_workspaces
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "workspace_delete_own" on public.clinic_workspaces
for delete to authenticated using (id = auth.uid());

create or replace function public.touch_clinic_workspace()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_clinic_workspace on public.clinic_workspaces;
create trigger trg_touch_clinic_workspace
before update on public.clinic_workspaces
for each row execute function public.touch_clinic_workspace();
