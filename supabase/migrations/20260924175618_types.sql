create extension if not exists citext with schema extensions;

create type public.task_type as enum (
  'reading', 'memorization', 'essay', 'performance_task', 'group_project',
  'quiz_exam', 'requirement', 'drawing', 'activity_task'
);
create type public.task_status as enum ('not_started', 'in_progress', 'completed');
create type public.task_priority as enum ('high', 'medium', 'low');
create type public.class_color as enum ('violet', 'blue', 'teal', 'rose', 'green', 'orange', 'pink', 'amber', 'slate');
create type public.app_theme as enum ('system', 'light', 'dark', 'siska');
create type public.app_view as enum ('list', 'calendar');
create type public.space_kind as enum ('semester', 'custom');
create type public.member_role as enum ('owner', 'editor', 'viewer');
