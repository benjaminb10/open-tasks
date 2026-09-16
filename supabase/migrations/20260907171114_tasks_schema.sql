-- Tasks app — tables in public schema (prefixed) so the REST API serves them
-- with no extra "exposed schema" config. RLS scopes every row to its owner.

-- Projects -------------------------------------------------------------------
create table if not exists public.tasks_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  color       text not null default 'slate',
  sort        double precision not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Tasks ----------------------------------------------------------------------
create table if not exists public.tasks_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  project_id   uuid references public.tasks_projects (id) on delete cascade,
  title        text not null default '',
  notes        text,
  done         boolean not null default false,
  starred      boolean not null default false,
  sort         double precision not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at   timestamptz
);

create index if not exists tasks_items_user_idx on public.tasks_items (user_id);
create index if not exists tasks_items_project_idx on public.tasks_items (project_id);
create index if not exists tasks_projects_user_idx on public.tasks_projects (user_id);

-- Keep updated_at fresh on every write (drives last-write-wins sync) ----------
create or replace function public.tasks_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_touch_projects on public.tasks_projects;
create trigger tasks_touch_projects before update on public.tasks_projects
  for each row execute function public.tasks_touch_updated_at();

drop trigger if exists tasks_touch_items on public.tasks_items;
create trigger tasks_touch_items before update on public.tasks_items
  for each row execute function public.tasks_touch_updated_at();

-- Row Level Security: a user only ever sees / writes their own rows -----------
alter table public.tasks_projects enable row level security;
alter table public.tasks_items    enable row level security;

drop policy if exists "own tasks_projects" on public.tasks_projects;
create policy "own tasks_projects" on public.tasks_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own tasks_items" on public.tasks_items;
create policy "own tasks_items" on public.tasks_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime: broadcast changes so other devices update live --------------------
alter publication supabase_realtime add table public.tasks_projects;
alter publication supabase_realtime add table public.tasks_items;
