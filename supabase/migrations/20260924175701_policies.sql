create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- the owner_id check lets insert ... returning see the row before the membership trigger runs
create policy "spaces_select" on public.spaces
  for select to authenticated using (owner_id = (select auth.uid()) or (select private.is_member(id)));
create policy "spaces_insert" on public.spaces
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "spaces_update" on public.spaces
  for update to authenticated using ((select private.can_edit(id))) with check ((select private.can_edit(id)));
create policy "spaces_delete" on public.spaces
  for delete to authenticated using ((select private.is_owner(id)));

create policy "space_members_select" on public.space_members
  for select to authenticated using ((select private.is_member(space_id)));
create policy "space_members_insert" on public.space_members
  for insert to authenticated with check ((select private.is_owner(space_id)));
create policy "space_members_update" on public.space_members
  for update to authenticated using ((select private.is_owner(space_id))) with check ((select private.is_owner(space_id)));
create policy "space_members_delete" on public.space_members
  for delete to authenticated using (user_id = (select auth.uid()) or (select private.is_owner(space_id)));

create policy "classes_select" on public.classes
  for select to authenticated using ((select private.is_member(space_id)));
create policy "classes_insert" on public.classes
  for insert to authenticated with check ((select private.can_edit(space_id)));
create policy "classes_update" on public.classes
  for update to authenticated using ((select private.can_edit(space_id))) with check ((select private.can_edit(space_id)));
create policy "classes_delete" on public.classes
  for delete to authenticated using ((select private.can_edit(space_id)));

create policy "tasks_select" on public.tasks
  for select to authenticated using ((select private.is_member(space_id)));
create policy "tasks_insert" on public.tasks
  for insert to authenticated with check ((select private.can_edit(space_id)));
create policy "tasks_update" on public.tasks
  for update to authenticated using ((select private.can_edit(space_id))) with check ((select private.can_edit(space_id)));
create policy "tasks_delete" on public.tasks
  for delete to authenticated using ((select private.can_edit(space_id)));
