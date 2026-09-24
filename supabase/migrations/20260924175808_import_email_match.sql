alter table private.pending_imports
  add constraint pending_imports_email_lower check (email::text = lower(email::text));
