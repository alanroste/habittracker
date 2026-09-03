-- Habit tracker MVP schema. All access goes through the RPC functions below;
-- tables have RLS enabled with no policies, so the anon key cannot touch them directly.

create type habit_category  as enum ('health','mind','business','avoid');
create type habit_frequency as enum ('daily','per_week','limit_week');
create type log_status      as enum ('done','missed');

create table users (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  login_token    text not null unique default replace(gen_random_uuid()::text, '-', ''),
  timezone       text not null default 'UTC',
  started_on     date not null default current_date,
  challenge_days int  not null default 70,
  onboarded      boolean not null default false,
  created_at     timestamptz not null default now()
);

create table habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  category     habit_category not null,
  title        text not null,
  frequency    habit_frequency not null default 'daily',
  target_count int  not null default 1 check (target_count >= 1),
  sort_order   int  not null default 0,
  starts_on    date not null default current_date,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index habits_user_idx on habits(user_id) where is_active;

create table habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references habits(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  log_date   date not null,
  status     log_status not null,
  count      int  not null default 1 check (count >= 0),
  reason     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, log_date),
  check (status <> 'missed' or (reason is not null and length(trim(reason)) > 0))
);
create index habit_logs_user_date_idx on habit_logs(user_id, log_date);

alter table users      enable row level security;
alter table habits     enable row level security;
alter table habit_logs enable row level security;
revoke all on users, habits, habit_logs from anon, authenticated;

------------------------------------------------------------------------------
-- helpers (not callable by anon)
------------------------------------------------------------------------------

create or replace function _auth(p_token text) returns users
language plpgsql stable security definer set search_path = public as $$
declare u users;
begin
  if p_token is null or length(p_token) < 16 then
    raise exception 'invalid token' using errcode = '28000';
  end if;
  select * into u from users where login_token = p_token;
  if not found then
    raise exception 'invalid token' using errcode = '28000';
  end if;
  return u;
end $$;

create or replace function _today(p_user_id uuid) returns date
language sql stable security definer set search_path = public as $$
  select (now() at time zone u.timezone)::date from users u where u.id = p_user_id
$$;

-- last day of the challenge, and "today" clamped to it
create or replace function _end_date(p_user_id uuid) returns date
language sql stable security definer set search_path = public as $$
  select u.started_on + u.challenge_days - 1 from users u where u.id = p_user_id
$$;

create or replace function _week_start(d date) returns date
language sql immutable as $$
  select d - (extract(isodow from d)::int - 1)
$$;

-- One row per scorable item: a (daily habit, day) or a (weekly habit, week).
-- outcome: hit | miss | unlogged | pending
create or replace function _score_items(p_user_id uuid)
returns table (
  habit_id uuid, category habit_category, frequency habit_frequency,
  period_start date, period_end date, outcome text, cnt int
)
language sql stable security definer set search_path = public as $$
  with p as (
    select u.id, u.started_on,
           least(_today(u.id), _end_date(u.id)) as today,
           _end_date(u.id) as end_date
    from users u where u.id = p_user_id
  ),
  h as (
    select * from habits where user_id = p_user_id and is_active
  ),
  daily as (
    select h.id, h.category, h.frequency, d::date as ps, d::date as pe,
           case
             when l.status = 'done'   then 'hit'
             when l.status = 'missed' then 'miss'
             when d::date < p.today   then 'unlogged'
             else 'pending'
           end as outcome,
           coalesce(l.count, 0) as cnt
    from h cross join p
    cross join lateral generate_series(greatest(p.started_on, h.starts_on), p.today, interval '1 day') d
    left join habit_logs l on l.habit_id = h.id and l.log_date = d::date
    where h.frequency = 'daily'
  ),
  weekly as (
    select h.id, h.category, h.frequency, ws::date as ps, (ws::date + 6) as pe,
           coalesce((select sum(l.count) from habit_logs l
                     where l.habit_id = h.id and l.status = 'done'
                       and l.log_date between ws::date and ws::date + 6), 0)::int as cnt,
           h.target_count, p.today, p.end_date
    from h cross join p
    cross join lateral generate_series(_week_start(greatest(p.started_on, h.starts_on)), _week_start(p.today), interval '7 days') ws
    where h.frequency in ('per_week','limit_week')
  ),
  weekly_scored as (
    select id, category, frequency, ps, pe,
      case
        when frequency = 'per_week' then
          case
            when cnt >= target_count then 'hit'
            when pe < today then 'miss'
            when cnt + (least(pe, end_date) - today + 1) >= target_count then 'pending'
            else 'miss'
          end
        else -- limit_week
          case
            when cnt > target_count then 'miss'
            when pe < today then 'hit'
            else 'pending'
          end
      end as outcome,
      cnt
    from weekly
  )
  select id, category, frequency, ps, pe, outcome, cnt from daily
  union all
  select id, category, frequency, ps, pe, outcome, cnt from weekly_scored
$$;

create or replace function _pct(hits bigint, misses bigint, unlogged bigint) returns numeric
language sql immutable as $$
  select case when hits + misses + unlogged = 0 then 100
         else round(100.0 * hits / (hits + misses + unlogged), 1) end
$$;

create or replace function _user_json(u users) returns jsonb
language sql immutable as $$
  select jsonb_build_object(
    'id', u.id, 'name', u.name, 'timezone', u.timezone, 'started_on', u.started_on,
    'challenge_days', u.challenge_days, 'onboarded', u.onboarded)
$$;

create or replace function _habit_json(h habits) returns jsonb
language sql immutable as $$
  select jsonb_build_object(
    'id', h.id, 'category', h.category, 'title', h.title, 'frequency', h.frequency,
    'target_count', h.target_count, 'sort_order', h.sort_order, 'starts_on', h.starts_on)
$$;

------------------------------------------------------------------------------
-- public RPC (called by the app with the user's token)
------------------------------------------------------------------------------

create or replace function me(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare u users := _auth(p_token);
begin
  return _user_json(u) || jsonb_build_object('today', _today(u.id), 'login_token', u.login_token);
end $$;

create or replace function update_profile(p_token text, p_name text, p_timezone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u users := _auth(p_token);
begin
  if p_name is null or length(trim(p_name)) = 0 then raise exception 'name required'; end if;
  perform now() at time zone p_timezone; -- validates timezone
  update users set name = trim(p_name), timezone = p_timezone where id = u.id returning * into u;
  return _user_json(u) || jsonb_build_object('today', _today(u.id), 'login_token', u.login_token);
end $$;

-- Marks onboarding done; the 70-day clock starts today (user's timezone).
create or replace function complete_onboarding(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u users := _auth(p_token);
begin
  if not u.onboarded then
    update users set onboarded = true, started_on = _today(u.id) where id = u.id returning * into u;
    update habits set starts_on = u.started_on where user_id = u.id;
  end if;
  return _user_json(u) || jsonb_build_object('today', _today(u.id), 'login_token', u.login_token);
end $$;

create or replace function my_habits(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare u users := _auth(p_token);
begin
  return coalesce((select jsonb_agg(_habit_json(h) order by h.category, h.sort_order, h.created_at)
                   from habits h where h.user_id = u.id and h.is_active), '[]'::jsonb);
end $$;

create or replace function upsert_habit(
  p_token text, p_id uuid, p_category habit_category, p_title text,
  p_frequency habit_frequency, p_target_count int, p_sort_order int default 0
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u users := _auth(p_token); h habits;
begin
  if p_title is null or length(trim(p_title)) = 0 then raise exception 'title required'; end if;
  if p_id is null then
    insert into habits (user_id, category, title, frequency, target_count, sort_order, starts_on)
    values (u.id, p_category, trim(p_title), p_frequency, greatest(coalesce(p_target_count,1),1), coalesce(p_sort_order,0),
            greatest(_today(u.id), u.started_on))
    returning * into h;
  else
    update habits set category = p_category, title = trim(p_title), frequency = p_frequency,
                      target_count = greatest(coalesce(p_target_count,1),1), sort_order = coalesce(p_sort_order, sort_order)
    where id = p_id and user_id = u.id returning * into h;
    if not found then raise exception 'habit not found'; end if;
  end if;
  return _habit_json(h);
end $$;

create or replace function delete_habit(p_token text, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare u users := _auth(p_token);
begin
  update habits set is_active = false where id = p_id and user_id = u.id;
end $$;

create or replace function log_habit(
  p_token text, p_habit_id uuid, p_date date, p_status log_status,
  p_reason text default null, p_count int default 1
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u users := _auth(p_token); h habits; l habit_logs;
begin
  select * into h from habits where id = p_habit_id and user_id = u.id and is_active;
  if not found then raise exception 'habit not found'; end if;
  if p_date > _today(u.id) then raise exception 'cannot log the future'; end if;
  if p_date < u.started_on then raise exception 'before challenge start'; end if;
  if p_status = 'missed' and (p_reason is null or length(trim(p_reason)) = 0) then
    raise exception 'reason required';
  end if;
  insert into habit_logs (habit_id, user_id, log_date, status, count, reason)
  values (h.id, u.id, p_date, p_status, case when p_status = 'done' then greatest(coalesce(p_count,1),1) else 0 end,
          case when p_status = 'missed' then trim(p_reason) else null end)
  on conflict (habit_id, log_date) do update
    set status = excluded.status, count = excluded.count, reason = excluded.reason, updated_at = now()
  returning * into l;
  return to_jsonb(l);
end $$;

create or replace function clear_log(p_token text, p_habit_id uuid, p_date date) returns void
language plpgsql security definer set search_path = public as $$
declare u users := _auth(p_token);
begin
  delete from habit_logs where habit_id = p_habit_id and user_id = u.id and log_date = p_date;
end $$;

-- Habits + that day's log (+ this week's count for weekly habits). Own or a friend's.
create or replace function day_view(p_token text, p_date date, p_user_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare u users := _auth(p_token); target uuid := coalesce(p_user_id, u.id); ws date := _week_start(p_date);
begin
  return coalesce((
    select jsonb_agg(
      _habit_json(h) || jsonb_build_object(
        'log', case when l.id is null then null else jsonb_build_object(
                 'status', l.status, 'count', l.count, 'reason', l.reason) end,
        'week_count', coalesce((select sum(x.count) from habit_logs x
                                where x.habit_id = h.id and x.status = 'done'
                                  and x.log_date between ws and ws + 6), 0)
      ) order by h.category, h.sort_order, h.created_at)
    from habits h
    left join habit_logs l on l.habit_id = h.id and l.log_date = p_date
    where h.user_id = target and h.is_active
  ), '[]'::jsonb);
end $$;

-- Full metrics for a user (own by default, or a friend's).
create or replace function stats(p_token text, p_user_id uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u users := _auth(p_token);
  t users;
  today date; end_date date; day_number int; days_logged int;
  cur_streak int := 0; best_streak int := 0; run int := 0; r record;
  result jsonb;
begin
  select * into t from users where id = coalesce(p_user_id, u.id);
  if not found then raise exception 'user not found'; end if;
  end_date := _end_date(t.id);
  today := least(_today(t.id), end_date);
  day_number := greatest(today - t.started_on + 1, 0);

  create temp table if not exists _si on commit drop as select * from _score_items(t.id) where false;
  truncate _si;
  insert into _si select * from _score_items(t.id);

  -- per-day completeness for daily habits (a day is "logged" when every daily habit has a log)
  create temp table if not exists _days on commit drop as
    select null::date as d, 0::bigint as hits, 0::bigint as misses, 0::bigint as unlogged, 0::bigint as pending where false;
  truncate _days;
  insert into _days
    select period_start,
           count(*) filter (where outcome = 'hit'),
           count(*) filter (where outcome = 'miss'),
           count(*) filter (where outcome = 'unlogged'),
           count(*) filter (where outcome = 'pending')
    from _si where frequency = 'daily' group by period_start;

  select count(*) into days_logged from _days where unlogged = 0 and pending = 0;

  -- streaks of perfect days (all daily habits done), ending today or yesterday
  for r in select d, hits, misses, unlogged, pending from _days order by d loop
    if r.misses = 0 and r.unlogged = 0 and r.pending = 0 and r.hits > 0 then
      run := run + 1;
    elsif r.d = today and r.pending > 0 and r.misses = 0 and r.unlogged = 0 then
      null; -- today still open: keep the run alive
    else
      run := 0;
    end if;
    best_streak := greatest(best_streak, run);
  end loop;
  cur_streak := run;

  select jsonb_build_object(
    'user', _user_json(t),
    'today', today,
    'day_number', least(day_number, t.challenge_days),
    'days_total', t.challenge_days,
    'days_left', greatest(t.challenge_days - day_number, 0),
    'end_date', end_date,
    'days_logged', days_logged,
    'days_elapsed', day_number,
    'missed_days', coalesce((select jsonb_agg(jsonb_build_object('date', d, 'unlogged', unlogged) order by d)
                             from _days where unlogged > 0), '[]'::jsonb),
    'overall', (select jsonb_build_object(
                  'hits', count(*) filter (where outcome = 'hit'),
                  'misses', count(*) filter (where outcome = 'miss'),
                  'unlogged', count(*) filter (where outcome = 'unlogged'),
                  'pending', count(*) filter (where outcome = 'pending'),
                  'pct', _pct(count(*) filter (where outcome = 'hit'),
                              count(*) filter (where outcome = 'miss'),
                              count(*) filter (where outcome = 'unlogged')))
                from _si),
    'categories', coalesce((select jsonb_agg(jsonb_build_object(
                  'category', category,
                  'hits', hits, 'misses', misses, 'unlogged', unlogged, 'pending', pending,
                  'pct', _pct(hits, misses, unlogged)) order by category)
                from (select category,
                             count(*) filter (where outcome = 'hit') hits,
                             count(*) filter (where outcome = 'miss') misses,
                             count(*) filter (where outcome = 'unlogged') unlogged,
                             count(*) filter (where outcome = 'pending') pending
                      from _si group by category) c), '[]'::jsonb),
    'habits', coalesce((select jsonb_agg(_habit_json(h) || jsonb_build_object(
                  'hits', coalesce(s.hits,0), 'misses', coalesce(s.misses,0), 'unlogged', coalesce(s.unlogged,0), 'pending', coalesce(s.pending,0),
                  'pct', _pct(coalesce(s.hits,0), coalesce(s.misses,0), coalesce(s.unlogged,0)),
                  'week_count', coalesce((select sum(x.count) from habit_logs x
                                          where x.habit_id = h.id and x.status = 'done'
                                            and x.log_date between _week_start(today) and _week_start(today) + 6), 0))
                  order by h.category, h.sort_order, h.created_at)
                from habits h
                left join (select habit_id,
                             count(*) filter (where outcome = 'hit') hits,
                             count(*) filter (where outcome = 'miss') misses,
                             count(*) filter (where outcome = 'unlogged') unlogged,
                             count(*) filter (where outcome = 'pending') pending
                           from _si group by habit_id) s on s.habit_id = h.id
                where h.user_id = t.id and h.is_active), '[]'::jsonb),
    'daily_history', coalesce((select jsonb_agg(jsonb_build_object(
                  'date', d, 'hits', hits, 'misses', misses, 'unlogged', unlogged, 'pending', pending) order by d)
                from _days), '[]'::jsonb),
    'weekly_history', coalesce((select jsonb_agg(jsonb_build_object(
                  'week_start', period_start, 'hits', hits, 'misses', misses, 'pending', pending) order by period_start)
                from (select period_start,
                             count(*) filter (where outcome = 'hit') hits,
                             count(*) filter (where outcome = 'miss') misses,
                             count(*) filter (where outcome = 'pending') pending
                      from _si where frequency <> 'daily' group by period_start) w), '[]'::jsonb),
    'streak', jsonb_build_object('current', cur_streak, 'best', best_streak),
    'reasons', coalesce((select jsonb_agg(jsonb_build_object(
                  'date', l.log_date, 'habit', h.title, 'category', h.category, 'reason', l.reason)
                  order by l.log_date desc, l.updated_at desc)
                from habit_logs l join habits h on h.id = l.habit_id
                where l.user_id = t.id and l.status = 'missed'), '[]'::jsonb)
  ) into result;
  return result;
end $$;

-- Everyone else in the group with their on-track %.
create or replace function friends(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare u users := _auth(p_token);
begin
  return coalesce((
    select jsonb_agg(j order by (j->>'pct')::numeric desc, j->>'name')
    from (
      select _user_json(o) || jsonb_build_object(
               'pct', _pct(s.hits, s.misses, s.unlogged),
               'hits', s.hits, 'misses', s.misses, 'unlogged', s.unlogged,
               'day_number', least(greatest(least(_today(o.id), _end_date(o.id)) - o.started_on + 1, 0), o.challenge_days),
               'habit_count', (select count(*) from habits h where h.user_id = o.id and h.is_active)
             ) as j
      from users o
      cross join lateral (
        select count(*) filter (where outcome = 'hit') hits,
               count(*) filter (where outcome = 'miss') misses,
               count(*) filter (where outcome = 'unlogged') unlogged
        from _score_items(o.id)) s
      where o.id <> u.id
    ) x
  ), '[]'::jsonb);
end $$;

-- lock down helpers; expose only the RPC surface
revoke execute on function _auth(text), _today(uuid), _end_date(uuid), _week_start(date), _score_items(uuid),
  _pct(bigint,bigint,bigint), _user_json(users), _habit_json(habits) from public, anon, authenticated;
grant execute on function
  me(text), update_profile(text,text,text), complete_onboarding(text), my_habits(text),
  upsert_habit(text,uuid,habit_category,text,habit_frequency,int,int), delete_habit(text,uuid),
  log_habit(text,uuid,date,log_status,text,int), clear_log(text,uuid,date),
  day_view(text,date,uuid), stats(text,uuid), friends(text)
to anon;
