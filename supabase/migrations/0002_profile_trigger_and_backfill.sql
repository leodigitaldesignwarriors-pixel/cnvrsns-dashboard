-- Fixes a gap in 0001_init.sql: no profiles row was ever created for a new
-- Supabase Auth user. Run this once on a project that already ran
-- 0001_init.sql before this fix existed.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'employee')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any auth users created before this trigger existed,
-- and set the two partner accounts.
insert into public.profiles (id, role)
select id, 'partner'
from auth.users
where email in ('hammad.webdev1@gmail.com', 'ashywork907@gmail.com')
on conflict (id) do update set role = 'partner';
