-- Per-user location visits. Run this in the Supabase SQL Editor if the table
-- has not already been created in the project.
create table if not exists public.location_visits (
    user_id uuid not null references auth.users (id) on delete cascade,
    marker_id uuid not null references public.markers (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, marker_id)
);

alter table public.location_visits enable row level security;

revoke all on public.location_visits from anon;
grant select, insert, delete on public.location_visits to authenticated;

drop policy if exists "Users can read their own location visits" on public.location_visits;
create policy "Users can read their own location visits"
    on public.location_visits for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can add their own location visits" on public.location_visits;
create policy "Users can add their own location visits"
    on public.location_visits for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own location visits" on public.location_visits;
create policy "Users can remove their own location visits"
    on public.location_visits for delete to authenticated
    using (auth.uid() = user_id);
