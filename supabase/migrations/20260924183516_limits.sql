-- per-user write rate limit, checked by PostgREST before every API request
create table private.rate_limits (
  user_id uuid not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (user_id, window_start)
);
alter table private.rate_limits enable row level security;
create policy "rate_limits_no_access" on private.rate_limits
  for all to anon, authenticated using (false) with check (false);
revoke all on private.rate_limits from public, anon, authenticated;

create function private.check_request()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  n int;
begin
  if uid is null
    or current_setting('request.method', true) in ('GET', 'HEAD', 'OPTIONS')
    or current_setting('transaction_read_only') = 'on' then
    return;
  end if;

  insert into private.rate_limits as r (user_id, window_start, hits)
  values (uid, date_trunc('minute', now()), 1)
  on conflict (user_id, window_start) do update set hits = r.hits + 1
  returning r.hits into n;

  if n = 1 then
    delete from private.rate_limits where user_id = uid and window_start < now() - interval '5 minutes';
  end if;

  if n > 120 then
    raise sqlstate 'PGRST' using
      message = json_build_object('code', 'rate_limited', 'message', 'Too many changes. Try again in a minute.')::text,
      detail = json_build_object('status', 429, 'headers', json_build_object('Retry-After', '60'))::text;
  end if;
end
$$;

revoke execute on function private.check_request() from public;
grant execute on function private.check_request() to anon, authenticated;

alter role authenticator set pgrst.db_pre_request = 'private.check_request';
notify pgrst, 'reload config';

-- storage caps, so one account can't fill the database
create function private.enforce_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  if tg_table_name = 'spaces' then
    select count(*) into n from public.spaces where owner_id = new.owner_id;
    if n >= 50 then
      raise exception 'semester limit reached' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'classes' then
    select count(*) into n from public.classes where space_id = new.space_id;
    if n >= 100 then
      raise exception 'class limit reached' using errcode = 'P0001';
    end if;
  else
    select count(*) into n from public.tasks where space_id = new.space_id;
    if n >= 2000 then
      raise exception 'task limit reached' using errcode = 'P0001';
    end if;
  end if;
  return new;
end
$$;

create trigger spaces_quota before insert on public.spaces
  for each row execute function private.enforce_quota();
create trigger classes_quota before insert on public.classes
  for each row execute function private.enforce_quota();
create trigger tasks_quota before insert on public.tasks
  for each row execute function private.enforce_quota();

alter table public.tasks add constraint tasks_notes_length check (char_length(notes) <= 5000);
