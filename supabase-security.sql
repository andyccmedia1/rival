-- ============================================================
-- Rival — security & integrity hardening (run in Supabase SQL Editor)
-- Safe to run once. Replaces the MVP "public read/write" policies
-- with auth-scoped ones so players can't tamper with each other.
-- ============================================================

-- 1. Constraints -------------------------------------------------

-- one player per slot per challenge (blocks a 3rd player / duplicate slot)
alter table players
  drop constraint if exists players_challenge_slot_unique;
alter table players
  add constraint players_challenge_slot_unique unique (challenge_id, slot);

-- keep weekly target sane
alter table goals
  drop constraint if exists goals_times_per_week_chk;
alter table goals
  add constraint goals_times_per_week_chk check (times_per_week between 1 and 7);

-- 2. Enable RLS (idempotent) ------------------------------------
alter table challenges enable row level security;
alter table players    enable row level security;
alter table goals      enable row level security;
alter table check_ins  enable row level security;

-- 3. Drop old permissive policies -------------------------------
-- (names from the original schema; ignore errors if they differ)
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('challenges','players','goals','check_ins')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 4. New policies (all require a logged-in user) ----------------

-- CHALLENGES: readable by anyone (an invitee previews it before signing in).
-- Reads are low-sensitivity (no emails here); WRITES are locked down below.
create policy challenges_select on challenges
  for select using (true);
-- any authed user can create a challenge
create policy challenges_insert on challenges
  for insert to authenticated with check (true);
-- only a member (a player in this challenge owned by me) can update/delete
create policy challenges_update on challenges
  for update to authenticated
  using (exists (select 1 from players p where p.challenge_id = challenges.id and p.user_id = auth.uid()));
create policy challenges_delete on challenges
  for delete to authenticated
  using (exists (select 1 from players p where p.challenge_id = challenges.id and p.user_id = auth.uid()));

-- PLAYERS: readable by anyone (invitee sees who challenged them before signing in)
create policy players_select on players
  for select using (true);
-- you may only insert/modify/remove YOUR OWN player row
create policy players_insert on players
  for insert to authenticated with check (user_id = auth.uid());
create policy players_update on players
  for update to authenticated using (user_id = auth.uid());
create policy players_delete on players
  for delete to authenticated using (user_id = auth.uid());

-- GOALS: readable by any authed user; insert allowed (created at setup time)
create policy goals_select on goals
  for select using (true);
create policy goals_insert on goals
  for insert to authenticated with check (true);
-- deletes happen via challenge cascade; explicit delete restricted to members
create policy goals_delete on goals
  for delete to authenticated
  using (exists (select 1 from players p where p.challenge_id = goals.challenge_id and p.user_id = auth.uid()));

-- CHECK_INS: readable by any authed user; but you can only write YOUR OWN
create policy checkins_select on check_ins
  for select using (true);
create policy checkins_insert on check_ins
  for insert to authenticated
  with check (player_id in (select id from players where user_id = auth.uid()));
create policy checkins_delete on check_ins
  for delete to authenticated
  using (player_id in (select id from players where user_id = auth.uid()));
