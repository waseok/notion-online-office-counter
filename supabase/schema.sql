create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists private.counter_daily_views (
  view_date date not null,
  page_key text not null check (char_length(page_key) between 1 and 100),
  view_count bigint not null default 0 check (view_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (view_date, page_key)
);

create table if not exists private.counter_request_keys (
  page_key text not null check (char_length(page_key) between 1 and 100),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (page_key, request_id)
);

create index if not exists counter_request_keys_created_at_idx
  on private.counter_request_keys (created_at);

alter table private.counter_daily_views enable row level security;
alter table private.counter_request_keys enable row level security;

revoke all on table private.counter_daily_views from public, anon, authenticated;
revoke all on table private.counter_request_keys from public, anon, authenticated;
grant select, insert, update, delete on table private.counter_daily_views to service_role;
grant select, insert, update, delete on table private.counter_request_keys to service_role;

create or replace function public.get_counter_stats(p_page_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  kst_day date := (clock_timestamp() at time zone 'Asia/Seoul')::date;
  week_start date;
  month_start date;
  result jsonb;
begin
  if p_page_key is null or char_length(p_page_key) not between 1 and 100 then
    raise exception 'invalid page key';
  end if;

  week_start := date_trunc('week', kst_day::timestamp)::date;
  month_start := date_trunc('month', kst_day::timestamp)::date;

  select jsonb_build_object(
    'today', coalesce(sum(view_count) filter (where view_date = kst_day), 0),
    'week', coalesce(sum(view_count) filter (where view_date between week_start and kst_day), 0),
    'month', coalesce(sum(view_count) filter (where view_date between month_start and kst_day), 0),
    'total', coalesce(sum(view_count), 0)
  )
  into result
  from private.counter_daily_views
  where page_key = p_page_key;

  return result;
end;
$$;

create or replace function public.record_counter_view(
  p_page_key text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  kst_day date := (clock_timestamp() at time zone 'Asia/Seoul')::date;
  inserted_rows integer := 0;
begin
  if p_page_key is null or char_length(p_page_key) not between 1 and 100 then
    raise exception 'invalid page key';
  end if;

  if p_request_id is null then
    raise exception 'request id is required';
  end if;

  insert into private.counter_request_keys (page_key, request_id)
  values (p_page_key, p_request_id)
  on conflict do nothing;

  get diagnostics inserted_rows = row_count;

  if inserted_rows = 1 then
    insert into private.counter_daily_views (view_date, page_key, view_count, updated_at)
    values (kst_day, p_page_key, 1, clock_timestamp())
    on conflict (view_date, page_key)
    do update set
      view_count = private.counter_daily_views.view_count + 1,
      updated_at = clock_timestamp();
  end if;

  delete from private.counter_request_keys
  where created_at < clock_timestamp() - interval '2 days';

  return public.get_counter_stats(p_page_key);
end;
$$;

create or replace function public.get_counter_daily_stats(p_page_key text)
returns table(view_date date, view_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_page_key is null or char_length(p_page_key) not between 1 and 100 then
    raise exception 'invalid page key';
  end if;

  return query
  select daily.view_date, daily.view_count
  from private.counter_daily_views as daily
  where daily.page_key = p_page_key
  order by daily.view_date desc;
end;
$$;

revoke execute on function public.get_counter_stats(text) from public, anon, authenticated;
revoke execute on function public.record_counter_view(text, uuid) from public, anon, authenticated;
revoke execute on function public.get_counter_daily_stats(text) from public, anon, authenticated;
grant execute on function public.get_counter_stats(text) to service_role;
grant execute on function public.record_counter_view(text, uuid) to service_role;
grant execute on function public.get_counter_daily_stats(text) to service_role;
