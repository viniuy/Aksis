import type { Tables, TablesInsert, TablesUpdate } from './database.types'
import type { Klass, Profile, Semester, Task } from './types'

export type ProfileRow = Tables<'profiles'>
export type ClassRow = Tables<'classes'>
export type TaskRow = Tables<'tasks'>
export type SpaceRow = Tables<'spaces'> & { classes: ClassRow[]; tasks: TaskRow[] }

export const toProfile = (r: ProfileRow, fallbackName: string): Profile => ({
  id: r.id,
  name: r.display_name || fallbackName,
  avatarUrl: r.avatar_url,
  importedAt: r.imported_at,
})

export const toKlass = (r: ClassRow): Klass => ({ id: r.id, name: r.name, color: r.color })

export const toTask = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  classId: r.class_id,
  type: r.type,
  status: r.status,
  priority: r.priority,
  due: r.due,
  notes: r.notes,
})

export const toSemester = (r: SpaceRow): Semester => ({
  id: r.id,
  name: r.name,
  classes: r.classes.map(toKlass),
  tasks: r.tasks.map(toTask),
})

export const taskToRow = (t: Task, spaceId: string): TablesInsert<'tasks'> => ({
  id: t.id,
  space_id: spaceId,
  title: t.title,
  class_id: t.classId,
  type: t.type,
  status: t.status,
  priority: t.priority,
  due: t.due,
  notes: t.notes,
})

export function taskPatchToRow(p: Partial<Omit<Task, 'id'>>): TablesUpdate<'tasks'> {
  const row: TablesUpdate<'tasks'> = {}
  if (p.title !== undefined) row.title = p.title
  if (p.classId !== undefined) row.class_id = p.classId
  if (p.type !== undefined) row.type = p.type
  if (p.status !== undefined) row.status = p.status
  if (p.priority !== undefined) row.priority = p.priority
  if (p.due !== undefined) row.due = p.due
  if (p.notes !== undefined) row.notes = p.notes
  return row
}

export const klassToRow = (k: Klass, spaceId: string, sortOrder: number): TablesInsert<'classes'> => ({
  id: k.id,
  space_id: spaceId,
  name: k.name,
  color: k.color,
  sort_order: sortOrder,
})
