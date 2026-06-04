-- Add weekly frequency target to goals
alter table goals
  add column if not exists times_per_week int not null default 7;
