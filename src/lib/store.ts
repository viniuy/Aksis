import { QueryClient, QueryObserver } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { create } from 'zustand'
import { PALETTE } from './constants'
import {
  klassToRow,
  taskPatchToRow,
  taskToRow,
  toProfile,
  toKlass,
  toSemester,
  toTask,
  type ClassRow,
  type ProfileRow,
  type SpaceRow,
  type TaskRow,
} from './mappers'
import type { TablesUpdate } from './database.types'
import { supabase } from './supabase'
import type { ClassColor, Profile, Semester, Task, Theme } from './types'

// Server data lives in the React Query cache as rows. This store is the app-shaped copy components
// select from, so the actions kept their local-only names and signatures.

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

const THEME_KEY = 'hwt-theme'
const SHOW_DONE_KEY = 'hwt-show-done'
const THEMES: Theme[] = ['aksis', 'aksis_light', 'aksis_dark', 'light', 'dark']
const readTheme = () => THEMES.find((t) => t === readLocal(THEME_KEY)) ?? 'aksis'

const readLocal = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const writeLocal = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

interface AppData {
  profile: ProfileRow
  spaces: SpaceRow[]
}

interface State {
  status: 'loading' | 'signedOut' | 'ready'
  profile: Profile | null
  semesters: Semester[]
  activeId: string | null
  theme: Theme
  onboarded: boolean
  showDone: boolean
  view: 'list' | 'calendar'
}

interface Actions {
  signIn: () => Promise<void>
  signOut: () => void
  setTheme: (theme: Theme) => void
  setActive: (id: string) => void
  addSemester: (name: string, classNames: string[]) => void
  /** adds a class to the active semester and returns its id */
  addClass: (name: string) => string
  renameClass: (id: string, name: string) => void
  recolorClass: (id: string, color: ClassColor) => void
  /**
   * Removes a class from the active semester. With `withTasks` its tasks (completed ones too) go with it;
   * otherwise they stay and lose their class. Returns an undo function.
   */
  removeClass: (id: string, withTasks: boolean) => (() => void) | undefined
  addTask: (task: Omit<Task, 'id' | 'notes' | 'status'>) => string
  updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void
  deleteTask: (id: string) => (() => void) | undefined
  setOnboarded: (v: boolean) => void
  toggleShowDone: () => void
  setView: (view: State['view']) => void
}

const signedOut: Partial<State> = { status: 'signedOut', profile: null, semesters: [], activeId: null, onboarded: false }

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
})

let session: Session | null = null
let stopObserver: (() => void) | null = null
let mirrored: AppData | undefined
// writes run one at a time so a class exists before its task, and undo lands after the delete
let writes: Promise<void> = Promise.resolve()
let version = 0

const appKey = (userId = session?.user.id) => ['app', userId] as const
const cached = () => queryClient.getQueryData<AppData>(appKey())

async function load(userId: string): Promise<AppData> {
  flushEdits()
  await writes
  const started = version
  const [profile, spaces] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('spaces')
      .select('*, classes!classes_space_id_fkey(*), tasks!tasks_space_id_fkey(*)')
      .eq('kind', 'semester')
      .eq('archived', false)
      .order('sort_order')
      .order('created_at', { ascending: false })
      .order('sort_order', { referencedTable: 'classes' })
      .order('created_at', { referencedTable: 'tasks' }),
  ])
  if (profile.error) throw profile.error
  if (spaces.error) throw spaces.error
  // a change landed while this was in flight: keep it rather than flashing the older copy
  if (started !== version) {
    const current = queryClient.getQueryData<AppData>(appKey(userId))
    if (current) return current
  }
  return { profile: profile.data, spaces: spaces.data }
}

function mirror(d: AppData) {
  mirrored = d
  const semesters = d.spaces.map(toSemester)
  const active = d.profile.active_space_id
  writeLocal(THEME_KEY, d.profile.theme)
  useStore.setState({
    status: 'ready',
    profile: toProfile(d.profile, session?.user.user_metadata.full_name ?? session?.user.email ?? 'You'),
    semesters,
    activeId: semesters.some((s) => s.id === active) ? active : (semesters[0]?.id ?? null),
    theme: d.profile.theme,
    view: d.profile.view,
    onboarded: !!d.profile.onboarded_at,
  })
}

function watch(next: Session | null) {
  const sameUser = next?.user.id === session?.user.id
  session = next
  if (sameUser && stopObserver) return
  stopObserver?.()
  stopObserver = null
  mirrored = undefined
  if (!next) {
    queryClient.clear()
    useStore.setState(signedOut)
    return
  }
  useStore.setState({ status: 'loading' })
  const userId = next.user.id
  const observer = new QueryObserver<AppData>(queryClient, { queryKey: appKey(userId), queryFn: () => load(userId) })
  stopObserver = observer.subscribe((r) => {
    if (r.data && r.data !== mirrored) mirror(r.data)
    if (r.isError && !r.data) toast.error('Couldn’t load your tasks. Check your connection.')
  })
}

// deferred: supabase calls made inside this callback would wait on the auth lock that fired it
supabase.auth.onAuthStateChange((_event, s) => setTimeout(() => watch(s), 0))

type Result = { error: unknown; status?: number }

function failed(r: Result) {
  const message = (r.error as { message?: string } | null)?.message ?? ''
  if (r.status === 429) toast.error('You’re making changes very fast. Wait a minute, then try again.')
  else if (message.endsWith('limit reached')) toast.error(`Couldn’t save: ${message}.`)
  else toast.error('Couldn’t save. Check your connection.')
}

/** Shows a change on screen right away. */
function change(apply: (d: AppData) => AppData) {
  const key = appKey()
  const prev = queryClient.getQueryData<AppData>(key)
  if (!prev) return
  const next = apply(prev)
  version++
  queryClient.setQueryData(key, next)
  mirror(next)
  return { key, prev, next }
}

/** Queues a write. If it fails, the screen goes back to how it was (or to the server's copy). */
function enqueue(remote: () => PromiseLike<Result>, undo?: NonNullable<ReturnType<typeof change>>) {
  writes = writes.then(async () => {
    let result: Result
    try {
      result = await remote()
    } catch (error) {
      result = { error }
    }
    if (!result.error) return
    const key = undo?.key ?? appKey()
    if (undo && queryClient.getQueryData(key) === undo.next) {
      queryClient.setQueryData(key, undo.prev)
      mirror(undo.prev)
    }
    failed(result)
    void queryClient.invalidateQueries({ queryKey: key })
  })
}

function save(apply: (d: AppData) => AppData, remote: () => PromiseLike<Result>) {
  const done = change(apply)
  if (done) enqueue(remote, done)
}

// typing in a title or notes edits the task on every keystroke; the save waits for a pause
const EDIT_DELAY = 600
const pendingEdits = new Map<string, { row: TablesUpdate<'tasks'>; timer: ReturnType<typeof setTimeout> }>()

function flushEdit(id: string) {
  const edit = pendingEdits.get(id)
  if (!edit) return
  clearTimeout(edit.timer)
  pendingEdits.delete(id)
  enqueue(() => supabase.from('tasks').update(edit.row).eq('id', id))
}
const flushEdits = () => [...pendingEdits.keys()].forEach(flushEdit)
window.addEventListener('pagehide', flushEdits)

const mapSpace = (d: AppData, id: string, fn: (s: SpaceRow) => SpaceRow): AppData => ({
  ...d,
  spaces: d.spaces.map((s) => (s.id === id ? fn(s) : s)),
})

const activeSpace = () => {
  const id = useStore.getState().activeId
  return cached()?.spaces.find((s) => s.id === id)
}

const fullTask = (t: Task, spaceId: string): TaskRow => ({
  id: t.id,
  space_id: spaceId,
  title: t.title,
  class_id: t.classId,
  type: t.type,
  status: t.status,
  priority: t.priority,
  due: t.due,
  notes: t.notes,
  completed_at: t.status === 'completed' ? now() : null,
  created_at: now(),
  updated_at: now(),
  created_by: session?.user.id ?? null,
  updated_by: session?.user.id ?? null,
})

/** the columns needed to put a deleted task back exactly as it was */
const restoreTask = (r: TaskRow) => ({ ...taskToRow(toTask(r), r.space_id), completed_at: r.completed_at, created_at: r.created_at })

const updateProfile = (patch: Partial<Pick<ProfileRow, 'theme' | 'view' | 'active_space_id' | 'onboarded_at'>>) =>
  save(
    (d) => ({ ...d, profile: { ...d.profile, ...patch } }),
    () => supabase.from('profiles').update(patch).eq('id', session!.user.id),
  )

export const useStore = create<State & Actions>()((set, get) => ({
  status: 'loading',
  profile: null,
  semesters: [],
  activeId: null,
  theme: readTheme(),
  onboarded: false,
  showDone: readLocal(SHOW_DONE_KEY) === '1',
  view: 'list',

  signIn: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) toast.error('Couldn’t reach Google. Check your connection.')
  },
  signOut: () => {
    flushEdits()
    const pending = writes
    watch(null)
    void pending.then(() => supabase.auth.signOut())
  },

  setTheme: (theme) => {
    set({ theme })
    writeLocal(THEME_KEY, theme)
    updateProfile({ theme })
  },
  setActive: (id) => updateProfile({ active_space_id: id }),
  setView: (view) => {
    set({ view })
    updateProfile({ view })
  },
  setOnboarded: (v) => updateProfile({ onboarded_at: v ? now() : null }),
  toggleShowDone: () => {
    const showDone = !get().showDone
    set({ showDone })
    writeLocal(SHOW_DONE_KEY, showDone ? '1' : '0')
  },

  addSemester: (name, classNames) => {
    const d = cached()
    if (!d || !session) return
    const id = uid()
    name = name.slice(0, 80)
    const seen = new Set<string>()
    const classes: ClassRow[] = classNames
      .map((n) => n.slice(0, 80))
      .filter((n) => !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase()))
      .map((n, i) => ({ id: uid(), space_id: id, name: n, color: PALETTE[i % PALETTE.length], sort_order: i, created_at: now() }))
    const sortOrder = d.spaces.length ? Math.min(...d.spaces.map((s) => s.sort_order)) - 1 : 0
    const space: SpaceRow = {
      id,
      owner_id: session.user.id,
      kind: 'semester',
      name,
      sort_order: sortOrder,
      archived: false,
      created_at: now(),
      updated_at: now(),
      classes,
      tasks: [],
    }
    const userId = session.user.id
    save(
      (x) => ({ profile: { ...x.profile, active_space_id: id }, spaces: [space, ...x.spaces] }),
      async () => {
        const a = await supabase.from('spaces').insert({ id, name, sort_order: sortOrder })
        if (a.error) return a
        if (classes.length) {
          const b = await supabase.from('classes').insert(classes.map((c) => klassToRow(toKlass(c), id, c.sort_order)))
          if (b.error) return b
        }
        return supabase.from('profiles').update({ active_space_id: id }).eq('id', userId)
      },
    )
  },

  addClass: (name) => {
    const id = uid()
    const s = activeSpace()
    if (!s) return id
    const row: ClassRow = {
      id,
      space_id: s.id,
      name,
      color: PALETTE[s.classes.length % PALETTE.length],
      sort_order: Math.max(-1, ...s.classes.map((c) => c.sort_order)) + 1,
      created_at: now(),
    }
    save(
      (d) => mapSpace(d, s.id, (x) => ({ ...x, classes: [...x.classes, row] })),
      () => supabase.from('classes').insert(klassToRow(toKlass(row), s.id, row.sort_order)),
    )
    return id
  },

  renameClass: (id, name) => {
    const s = activeSpace()
    if (!s) return
    save(
      (d) => mapSpace(d, s.id, (x) => ({ ...x, classes: x.classes.map((c) => (c.id === id ? { ...c, name } : c)) })),
      () => supabase.from('classes').update({ name }).eq('id', id),
    )
  },
  recolorClass: (id, color) => {
    const s = activeSpace()
    if (!s) return
    save(
      (d) => mapSpace(d, s.id, (x) => ({ ...x, classes: x.classes.map((c) => (c.id === id ? { ...c, color } : c)) })),
      () => supabase.from('classes').update({ color }).eq('id', id),
    )
  },

  removeClass: (id, withTasks) => {
    const s = activeSpace()
    const classIndex = s?.classes.findIndex((c) => c.id === id) ?? -1
    if (!s || classIndex < 0) return
    const klass = s.classes[classIndex]
    const affected = s.tasks.filter((t) => t.class_id === id)
    const affectedIds = new Set(affected.map((t) => t.id))
    save(
      (d) =>
        mapSpace(d, s.id, (x) => ({
          ...x,
          classes: x.classes.filter((c) => c.id !== id),
          tasks: withTasks
            ? x.tasks.filter((t) => t.class_id !== id)
            : x.tasks.map((t) => (t.class_id === id ? { ...t, class_id: null } : t)),
        })),
      () => supabase.rpc('remove_class', { class_id: id, with_tasks: withTasks }),
    )
    // undo restores the class where it was, then either re-adds the tasks or re-links them
    return () =>
      save(
        (d) =>
          mapSpace(d, s.id, (x) => ({
            ...x,
            classes: [...x.classes.slice(0, classIndex), klass, ...x.classes.slice(classIndex)],
            tasks: withTasks
              ? [...x.tasks, ...affected]
              : x.tasks.map((t) => (affectedIds.has(t.id) && t.class_id === null ? { ...t, class_id: id } : t)),
          })),
        async () => {
          const a = await supabase.from('classes').insert({ ...klassToRow(toKlass(klass), s.id, klass.sort_order), created_at: klass.created_at })
          if (a.error || !affected.length) return a
          return withTasks
            ? supabase.from('tasks').insert(affected.map(restoreTask))
            : supabase.from('tasks').update({ class_id: id }).in('id', [...affectedIds]).is('class_id', null)
        },
      )
  },

  addTask: (t) => {
    const id = uid()
    const s = activeSpace()
    if (!s) return id
    const task: Task = { ...t, id, status: 'not_started', notes: '' }
    save(
      (d) => mapSpace(d, s.id, (x) => ({ ...x, tasks: [...x.tasks, fullTask(task, s.id)] })),
      () => supabase.from('tasks').insert(taskToRow(task, s.id)),
    )
    return id
  },

  updateTask: (id, patch) => {
    const s = activeSpace()
    if (!s) return
    const row = taskPatchToRow(patch)
    const done = change((d) =>
      mapSpace(d, s.id, (x) => ({
        ...x,
        tasks: x.tasks.map((t) => {
          if (t.id !== id) return t
          const completedAt =
            row.status && row.status !== t.status ? (row.status === 'completed' ? now() : null) : t.completed_at
          return { ...t, ...row, completed_at: completedAt, updated_at: now() }
        }),
      })),
    )
    if (!done) return
    const pending = pendingEdits.get(id)
    if (pending) clearTimeout(pending.timer)
    pendingEdits.set(id, { row: { ...pending?.row, ...row }, timer: setTimeout(() => flushEdit(id), EDIT_DELAY) })
  },

  deleteTask: (id) => {
    flushEdit(id)
    const s = activeSpace()
    const index = s?.tasks.findIndex((t) => t.id === id) ?? -1
    if (!s || index < 0) return
    const task = s.tasks[index]
    save(
      (d) => mapSpace(d, s.id, (x) => ({ ...x, tasks: x.tasks.filter((t) => t.id !== id) })),
      () => supabase.from('tasks').delete().eq('id', id),
    )
    // undo puts the same row back where it was
    return () =>
      save(
        (d) => mapSpace(d, s.id, (x) => ({ ...x, tasks: [...x.tasks.slice(0, index), task, ...x.tasks.slice(index)] })),
        () => supabase.from('tasks').insert(restoreTask(task)),
      )
  },
}))

export const useActiveSemester = () => useStore((s) => s.semesters.find((x) => x.id === s.activeId) ?? null)
