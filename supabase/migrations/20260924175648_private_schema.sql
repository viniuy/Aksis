create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table private.pending_imports (
  email extensions.citext primary key,
  payload jsonb not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table private.pending_imports enable row level security;
revoke all on private.pending_imports from public, anon, authenticated;

create function private.is_member(space uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members m
    where m.space_id = space and m.user_id = (select auth.uid())
  )
$$;

create function private.can_edit(space uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members m
    where m.space_id = space and m.user_id = (select auth.uid()) and m.role in ('owner', 'editor')
  )
$$;

create function private.is_owner(space uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members m
    where m.space_id = space and m.user_id = (select auth.uid()) and m.role = 'owner'
  )
$$;

revoke execute on function private.is_member(uuid), private.can_edit(uuid), private.is_owner(uuid) from public, anon;
grant execute on function private.is_member(uuid), private.can_edit(uuid), private.is_owner(uuid) to authenticated;
