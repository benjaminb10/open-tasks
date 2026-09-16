-- Lock down any leftover public tables without RLS (e.g. the old hermes-crm
-- initial schema) to clear Supabase's "Table publicly accessible" alert.
-- Our tasks_* tables already have RLS + policies, so this is a no-op for them.
-- Enabling RLS with no policy denies all access (safe default) for unused tables.
do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end $$;
