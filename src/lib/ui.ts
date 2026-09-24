import { create } from 'zustand'
import type { Bucket } from './dates'
import type { Priority, Task, TaskType } from './types'

export interface Filters {
  classes: string[]
  types: TaskType[]
  priorities: Priority[]
}
type FilterKey = keyof Filters

export const NO_FILTERS: Filters = { classes: [], types: [], priorities: [] }

/** Within a group (e.g. two classes) any match counts; across groups all must match. */
export const matchesFilters = (t: Task, f: Filters) =>
  (!f.classes.length || f.classes.includes(t.classId ?? '')) &&
  (!f.types.length || f.types.includes(t.type)) &&
  (!f.priorities.length || f.priorities.includes(t.priority))

export const filterCount = (f: Filters) => f.classes.length + f.types.length + f.priorities.length

// Screen state that shouldn't survive a reload.
interface UI {
  openTaskId: string | null
  commandOpen: boolean
  setupOpen: boolean
  classesOpen: boolean
  tourOpen: boolean
  filters: Filters
  /** tasks just checked off stay in their old group briefly so the check animation can play */
  settling: Record<string, Bucket>
  set: (patch: Partial<Omit<UI, 'set' | 'toggleFilter' | 'onlyClass'>>) => void
  toggleFilter: <K extends FilterKey>(key: K, value: Filters[K][number]) => void
  /** clicking a class name on a task: show just that class */
  onlyClass: (id: string) => void
}

export const useUI = create<UI>((set) => ({
  openTaskId: null,
  commandOpen: false,
  setupOpen: false,
  classesOpen: false,
  tourOpen: false,
  filters: NO_FILTERS,
  settling: {},
  set: (patch) => set(patch),
  toggleFilter: (key, value) =>
    set((s) => {
      const list = s.filters[key] as string[]
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { filters: { ...s.filters, [key]: next } }
    }),
  onlyClass: (id) => set({ filters: { ...NO_FILTERS, classes: [id] } }),
}))
