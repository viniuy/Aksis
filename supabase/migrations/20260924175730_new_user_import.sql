-- payload: [{ name, classes: [name], tasks: [{ title, class, type, status, priority, due }] }], newest first
create function private.import_payload(owner uuid, payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  sem record;
  sid uuid;
  first_sid uuid;
  palette public.class_color[] := enum_range(null::public.class_color);
begin
  for sem in
    select s.value as s, s.ord - 1 as ord
    from jsonb_array_elements(coalesce(payload -> 'semesters', payload)) with ordinality as s(value, ord)
  loop
    insert into public.spaces (owner_id, name, sort_order)
    values (owner, sem.s ->> 'name', sem.ord)
    returning id into sid;
    first_sid := coalesce(first_sid, sid);

    insert into public.classes (space_id, name, color, sort_order)
    select sid, c.value #>> '{}', palette[((c.ord - 1 + sem.ord * 3) % array_length(palette, 1)) + 1], c.ord - 1
    from jsonb_array_elements(sem.s -> 'classes') with ordinality as c(value, ord);

    insert into public.tasks (space_id, class_id, title, type, status, priority, due, created_by)
    select sid, cl.id, t ->> 'title',
      (t ->> 'type')::public.task_type, (t ->> 'status')::public.task_status, (t ->> 'priority')::public.task_priority,
      nullif(t ->> 'due', '')::date, owner
    from jsonb_array_elements(sem.s -> 'tasks') t
    left join public.classes cl on cl.space_id = sid and lower(cl.name) = lower(t ->> 'class');
  end loop;

  update public.profiles set active_space_id = first_sid, imported_at = now() where id = owner;
end
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending private.pending_imports;
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  begin
    select * into pending from private.pending_imports p
    where p.email = lower(new.email) and p.claimed_at is null
    for update;
    if found then
      perform private.import_payload(new.id, pending.payload);
      update private.pending_imports set claimed_at = now() where email = pending.email;
    end if;
  exception when others then
    raise warning 'import for user % failed: %', new.id, sqlerrm;
  end;

  return new;
end
$$;

revoke execute on function private.import_payload(uuid, jsonb), private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
