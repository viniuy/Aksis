export type TaskType =
  | 'reading'
  | 'memorization'
  | 'essay'
  | 'performance_task'
  | 'group_project'
  | 'quiz_exam'
  | 'requirement'
  | 'drawing'
  | 'activity_task'

export type Status = 'not_started' | 'in_progress' | 'completed'
export type Priority = 'high' | 'medium' | 'low'
/** `aksis` follows the device between Aksis Light and Aksis Dark */
export type Theme = 'aksis' | 'aksis_light' | 'aksis_dark' | 'light' | 'dark'
export type ClassColor = 'violet' | 'blue' | 'teal' | 'rose' | 'green' | 'orange' | 'pink' | 'amber' | 'slate'

export interface Klass {
  id: string
  name: string
  color: ClassColor
}

export interface Task {
  id: string
  title: string
  classId: string | null
  type: TaskType
  status: Status
  priority: Priority
  /** ISO date (yyyy-MM-dd), no time: due dates are calendar days */
  due: string | null
  notes: string
}

/** A space with `kind = 'semester'`. */
export interface Semester {
  id: string
  name: string
  classes: Klass[]
  tasks: Task[]
}

export interface Profile {
  id: string
  name: string
  avatarUrl: string | null
  /** set when the account came with an imported spreadsheet */
  importedAt: string | null
}
