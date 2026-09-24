import { addDays, differenceInCalendarDays, format, nextMonday, parseISO } from 'date-fns'
import type { Task } from './types'

export type Bucket = 'overdue' | 'today' | 'week' | 'later' | 'nodate' | 'done'

export const toISO = (d: Date) => format(d, 'yyyy-MM-dd')
/** parseISO reads a date-only string as local midnight, so "today" is always the user's own day */
export const fromISO = (s: string) => parseISO(s)
export const daysFromToday = (s: string) => differenceInCalendarDays(fromISO(s), new Date())

export function bucketOf(t: Task): Bucket {
  if (t.status === 'completed') return 'done'
  if (!t.due) return 'nodate'
  const d = daysFromToday(t.due)
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  if (d <= 7) return 'week'
  return 'later'
}

/** Short label for a date on its own: pickers and the task sheet */
export function dateLabel(s: string) {
  const d = daysFromToday(s)
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  if (d === -1) return 'Yesterday'
  if (d > 1 && d < 7) return format(fromISO(s), 'EEEE')
  return format(fromISO(s), d < -300 || d > 300 ? 'MMM d, yyyy' : 'MMM d')
}

/** Label shown on a task row, colored by urgency */
export function dueLabel(t: Task): { text: string; tone: 'late' | 'soon' | 'plain' } {
  if (!t.due) return { text: '', tone: 'plain' }
  if (t.status === 'completed') return { text: format(fromISO(t.due), 'MMM d'), tone: 'plain' }
  const d = daysFromToday(t.due)
  if (d < 0) return { text: `${-d}d late`, tone: 'late' }
  if (d === 0) return { text: 'Today', tone: 'soon' }
  if (d === 1) return { text: 'Tomorrow', tone: 'soon' }
  if (d < 7) return { text: format(fromISO(t.due), 'EEE'), tone: 'plain' }
  return { text: format(fromISO(t.due), 'MMM d'), tone: 'plain' }
}

export function quickDates() {
  const today = new Date()
  return [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: 'Next Monday', date: nextMonday(today) },
    { label: 'In a week', date: addDays(today, 7) },
  ].map((q) => ({ ...q, iso: toISO(q.date), hint: format(q.date, 'EEE, MMM d') }))
}
