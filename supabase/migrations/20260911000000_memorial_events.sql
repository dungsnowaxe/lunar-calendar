-- Memorial events (ngày giỗ) anchored on the Vietnamese lunar calendar.
-- The lunar date is the canonical representation; the solar occurrence is
-- always computed, never stored.
--
-- The app has no login: this is one shared list, so the RLS policy grants
-- full access to the anon role (all requests arrive without a user). Anyone
-- with the project URL and publishable key can read and modify these rows.
create table if not exists public.memorial_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  lunar_day smallint not null check (lunar_day between 1 and 30),
  lunar_month smallint not null check (lunar_month between 1 and 12),
  -- Occurrences always follow the regular month (tháng thường), the
  -- traditional convention for ngày giỗ; leap months (tháng nhuận) are
  -- ignored. The solar date is computed, never stored.
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memorial_events_lunar_date_idx
  on public.memorial_events (lunar_month, lunar_day);

alter table public.memorial_events enable row level security;

create policy "Shared family list — anon manages memorial events"
  on public.memorial_events
  for all
  to anon
  using (true)
  with check (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger memorial_events_set_updated_at
  before update on public.memorial_events
  for each row
  execute function public.set_updated_at();
