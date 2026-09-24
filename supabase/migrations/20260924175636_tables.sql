create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  theme public.app_theme not null default 'system',
  view public.app_view not null default 'list',
  active_space_id uuid,
  onboarded_at timestamptz,
  imported_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind public.space_kind not null default 'semester',
  name text not null check (char_length(name) between 1 and 80),
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_active_space_id_fkey foreign key (active_space_id) references public.spaces on delete set null;

create table public.space_members (
  space_id uuid not null references public.spaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color public.class_color not null default 'violet',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (id, space_id)
);
create unique index classes_space_name_key on public.classes (space_id, lower(name));

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces on delete cascade,
  class_id uuid,
  title text not null check (char_length(title) between 1 and 300),
  type public.task_type not null default 'activity_task',
  status public.task_status not null default 'not_started',
  priority public.task_priority not null default 'medium',
  due date,
  notes text not null default '',
  completed_at timestamptz,
  created_by uuid references auth.users on delete set null,
  updated_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_class_fkey foreign key (class_id, space_id)
    references public.classes (id, space_id) on delete set null (class_id)
);

create index profiles_active_space_id_idx on public.profiles (active_space_id);
create index spaces_owner_id_idx on public.spaces (owner_id);
create index space_members_user_id_idx on public.space_members (user_id);
create index classes_space_id_idx on public.classes (space_id);
create index tasks_space_id_due_idx on public.tasks (space_id, due);
create index tasks_class_id_space_id_idx on public.tasks (class_id, space_id);
create index tasks_created_by_idx on public.tasks (created_by);
create index tasks_updated_by_idx on public.tasks (updated_by);

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.classes enable row level security;
alter table public.tasks enable row level security;

revoke all on public.profiles, public.spaces, public.space_members, public.classes, public.tasks from anon;

revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, theme, view, active_space_id, onboarded_at) on public.profiles to authenticated;
revoke update on public.spaces from authenticated;
grant update (kind, name, sort_order, archived) on public.spaces to authenticated;
