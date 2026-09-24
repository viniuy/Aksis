import type { ClassColor, Priority, Status, TaskType } from './types'

export const TYPE_LABELS: Record<TaskType, string> = {
  reading: 'Reading',
  memorization: 'Memorization',
  essay: 'Essay',
  performance_task: 'Performance task',
  group_project: 'Group project',
  quiz_exam: 'Quiz / Exam',
  requirement: 'Requirement',
  drawing: 'Drawing',
  activity_task: 'Activity / Task',
}
export const TYPES = Object.keys(TYPE_LABELS) as TaskType[]

export const STATUS_LABELS: Record<Status, string> = {
  not_started: 'To do',
  in_progress: 'In progress',
  completed: 'Done',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}
export const PRIORITY_TONE: Record<Priority, string> = {
  high: 'text-destructive',
  medium: 'text-warn',
  low: 'text-muted-foreground',
}
export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export const CLASS_COLORS: Record<ClassColor, string> = {
  violet: '#8B5CF6',
  blue: '#3B82F6',
  teal: '#14B8A6',
  rose: '#F43F5E',
  green: '#22C55E',
  orange: '#F97316',
  pink: '#EC4899',
  amber: '#EAB308',
  slate: '#64748B',
}
export const PALETTE = Object.keys(CLASS_COLORS) as ClassColor[]
