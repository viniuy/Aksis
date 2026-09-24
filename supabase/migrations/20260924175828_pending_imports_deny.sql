create policy "pending_imports_no_access" on private.pending_imports
  for all to anon, authenticated using (false) with check (false);
