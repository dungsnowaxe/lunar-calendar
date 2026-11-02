-- Stable memorial identity color. Assigned once (creation order) and never reshuffled.
alter table public.memorial_events
  add column if not exists color_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'memorial_events_color_id_check'
  ) then
    alter table public.memorial_events
      add constraint memorial_events_color_id_check
      check (
        color_id is null
        or color_id in (
          'persimmon',
          'marigold',
          'olive',
          'jade',
          'indigo',
          'plum',
          'rose',
          'moss'
        )
      );
  end if;
end
$$;

with ordered as (
  select
    id,
    row_number() over (order by created_at asc, id asc) - 1 as n
  from public.memorial_events
  where color_id is null
)
update public.memorial_events as event
set color_id = (array[
  'persimmon',
  'marigold',
  'olive',
  'jade',
  'indigo',
  'plum',
  'rose',
  'moss'
])[1 + (ordered.n % 8)]
from ordered
where event.id = ordered.id;
