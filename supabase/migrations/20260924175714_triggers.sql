create function private.add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.space_members (space_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return null;
end
$$;

create trigger spaces_add_owner
  after insert on public.spaces
  for each row execute function private.add_owner_membership();

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger spaces_touch
  before update on public.spaces
  for each row execute function private.touch_updated_at();

create function private.stamp_task()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := new.created_by;
    new.completed_at := case when new.status = 'completed' then coalesce(new.completed_at, now()) end;
  else
    new.created_by := old.created_by;
    new.updated_by := auth.uid();
    new.updated_at := now();
    if new.status is distinct from old.status then
      new.completed_at := case when new.status = 'completed' then now() end;
    end if;
  end if;
  return new;
end
$$;

create trigger tasks_stamp
  before insert or update on public.tasks
  for each row execute function private.stamp_task();

create function public.remove_class(class_id uuid, with_tasks boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if with_tasks then
    delete from public.tasks t where t.class_id = remove_class.class_id;
  end if;
  delete from public.classes c where c.id = remove_class.class_id;
  if not found then
    raise exception 'class not found' using errcode = 'P0002';
  end if;
end
$$;

revoke execute on function public.remove_class(uuid, boolean) from public, anon;
grant execute on function public.remove_class(uuid, boolean) to authenticated;
