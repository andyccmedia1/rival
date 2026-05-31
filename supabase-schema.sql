-- Run this in your Supabase SQL editor

create table challenges (
  id uuid default gen_random_uuid() primary key,
  invite_code text unique not null,
  duration_days int not null default 14,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending', -- pending | active | complete
  created_at timestamptz default now()
);

create table players (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references challenges(id) on delete cascade,
  display_name text not null,
  avatar_emoji text not null,
  slot int not null, -- 1 = creator, 2 = joiner
  goal_ids uuid[] default '{}',
  created_at timestamptz default now()
);

create table goals (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references challenges(id) on delete cascade,
  player_slot int not null,
  label text not null,
  emoji text not null,
  color text not null default '#7B68EE',
  created_at timestamptz default now()
);

create table check_ins (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references players(id) on delete cascade,
  goal_id uuid references goals(id) on delete cascade,
  date date not null,
  completed_at timestamptz default now(),
  unique(player_id, goal_id, date)
);

-- Enable Row Level Security with public read/write (simplest for MVP)
alter table challenges enable row level security;
alter table players enable row level security;
alter table goals enable row level security;
alter table check_ins enable row level security;

create policy "public read challenges" on challenges for select using (true);
create policy "public insert challenges" on challenges for insert with check (true);
create policy "public update challenges" on challenges for update using (true);

create policy "public read players" on players for select using (true);
create policy "public insert players" on players for insert with check (true);

create policy "public read goals" on goals for select using (true);
create policy "public insert goals" on goals for insert with check (true);

create policy "public read check_ins" on check_ins for select using (true);
create policy "public insert check_ins" on check_ins for insert with check (true);
create policy "public delete check_ins" on check_ins for delete using (true);

-- Enable realtime for live scoreboard updates
alter publication supabase_realtime add table check_ins;
alter publication supabase_realtime add table players;
