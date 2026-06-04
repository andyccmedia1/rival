-- Add user_id to players table to link players to auth accounts
alter table players
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Index for fast lookup of a user's challenges
create index if not exists players_user_id_idx on players(user_id);
