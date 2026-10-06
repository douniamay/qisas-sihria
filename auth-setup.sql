-- نفّذه مرة واحدة في Supabase ← SQL Editor
alter table public.profiles
  add column if not exists username text,
  add column if not exists phone text;

create unique index if not exists profiles_username_key
  on public.profiles (lower(username)) where username is not null;

create or replace function public.username_available(uname text)
returns boolean language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(uname));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username, phone, email, email_verified)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    lower(new.raw_user_meta_data->>'username'),
    new.raw_user_meta_data->>'phone',
    new.email,
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end $$;
