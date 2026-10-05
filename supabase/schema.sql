-- First Desk schema (no login, open access).
-- Safe to run on a fresh project OR on top of the earlier auth-based version.

create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default '#324A5E',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects(id) on delete cascade,
  title        text not null,
  due_date     date,
  priority     smallint not null default 4 check (priority between 1 and 4), -- 1 = highest
  labels       text[] not null default '{}',
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- Migration from the earlier version: remove per-user ownership
drop policy if exists "own projects" on public.projects;
drop policy if exists "own tasks"    on public.tasks;
drop index  if exists public.tasks_user_due_idx;
drop index  if exists public.projects_user_idx;
alter table public.projects drop column if exists user_id;
alter table public.tasks    drop column if exists user_id;

create index if not exists tasks_due_idx     on public.tasks (completed, due_date);
create index if not exists tasks_project_idx on public.tasks (project_id);
create index if not exists tasks_labels_idx  on public.tasks using gin (labels);

-- Open access: anyone with the link can read and write
alter table public.projects enable row level security;
alter table public.tasks    enable row level security;

drop policy if exists "public access" on public.projects;
create policy "public access" on public.projects
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "public access" on public.tasks;
create policy "public access" on public.tasks
  for all to anon, authenticated using (true) with check (true);
