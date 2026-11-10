-- RockED Hyperdrive schema. Only a display name, an opaque credential hash and scores are stored.
create extension if not exists pgcrypto;

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 24),
  credential_hash text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists run_sessions (
  id uuid primary key,
  player_id uuid not null references players(id) on delete cascade,
  seed bigint not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
create index if not exists run_sessions_player_issued on run_sessions (player_id, issued_at desc);

create table if not exists runs (
  id uuid primary key,                                   -- same id as the session: one stored score per run
  player_id uuid not null references players(id) on delete cascade,
  score integer not null check (score >= 0),
  game_version text not null,
  wave_seed_id bigint not null,
  completed_at timestamptz not null default now(),
  week_key date not null                                 -- Monday of the Asia/Kolkata week the run started in
);
create index if not exists runs_week_score on runs (week_key, score desc, completed_at);
create index if not exists runs_player_score on runs (player_id, score desc);

-- Defence in depth: RLS on with no policies, and no grants to the public API roles.
alter table players enable row level security;
alter table run_sessions enable row level security;
alter table runs enable row level security;
revoke all on players, run_sessions, runs from anon, authenticated;

-- Consume the session and insert the score in one transaction. A repeat returns the stored row.
create or replace function hd_finish_run(p_run uuid, p_player uuid, p_score integer, p_version text, p_seed bigint, p_week date)
returns table (score integer, duplicate boolean)
language plpgsql security definer set search_path = public as $$
declare existing integer;
begin
  select r.score into existing from runs r where r.id = p_run;
  if found then return query select existing, true; return; end if;
  update run_sessions set used_at = now() where id = p_run and player_id = p_player and used_at is null;
  if not found then raise exception 'used_or_missing'; end if;
  insert into runs (id, player_id, score, game_version, wave_seed_id, week_key) values (p_run, p_player, p_score, p_version, p_seed, p_week);
  return query select p_score, false;
end $$;

-- Top 10 plus the viewer's own row. p_week null means all-time. Seasons split on the major game version.
-- Ties break on earliest completed_at, then player id, so ranks are deterministic.
create or replace function hd_leaderboard(p_week date, p_season text, p_viewer uuid)
returns json language sql stable security definer set search_path = public as $$
  with best as (
    select distinct on (player_id) player_id, score, completed_at
    from runs
    where (p_week is null or week_key = p_week) and split_part(game_version, '.', 1) = p_season
    order by player_id, score desc, completed_at asc
  ), ranked as (
    select b.player_id, b.score, p.display_name,
           row_number() over (order by b.score desc, b.completed_at asc, b.player_id) as rank
    from best b join players p on p.id = b.player_id
  )
  select json_build_object(
    'rows', (select coalesce(json_agg(json_build_object('rank', rank, 'display_name', display_name, 'score', score, 'you', player_id = p_viewer) order by rank), '[]'::json) from ranked where rank <= 10),
    'you', (select json_build_object('rank', rank, 'score', score) from ranked where player_id = p_viewer),
    'total', (select count(*) from ranked)
  );
$$;

-- Retention: sessions cleared within 24h, scores kept 90 days (owner decision, section 15 of the spec).
create or replace function hd_cleanup() returns void language sql security definer set search_path = public as $$
  delete from run_sessions where issued_at < now() - interval '24 hours';
  delete from runs where completed_at < now() - interval '90 days';
  delete from players p where p.created_at < now() - interval '90 days' and not exists (select 1 from runs r where r.player_id = p.id);
$$;

revoke all on function hd_finish_run(uuid, uuid, integer, text, bigint, date) from public, anon, authenticated;
revoke all on function hd_leaderboard(date, text, uuid) from public, anon, authenticated;
revoke all on function hd_cleanup() from public, anon, authenticated;

-- Optional, if pg_cron is enabled on the project:
-- select cron.schedule('hyperdrive-cleanup', '15 3 * * *', 'select hd_cleanup()');
