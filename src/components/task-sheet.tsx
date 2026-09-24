import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { ClassPicker, DuePicker, TypePicker } from '@/components/pickers'
import { Segmented } from '@/components/segmented'
import { PRIORITY_LABELS, PRIORITY_TONE, STATUS_LABELS } from '@/lib/constants'
import { useActiveSemester, useStore } from '@/lib/store'
import { useMediaQuery } from '@/lib/use-media-query'
import type { Priority, Status } from '@/lib/types'
import { useUI } from '@/lib/ui'

const statusOptions = (Object.keys(STATUS_LABELS) as Status[]).map((v) => ({ value: v, label: STATUS_LABELS[v] }))
const priorityOptions = (Object.keys(PRIORITY_LABELS) as Priority[]).map((v) => ({ value: v, label: PRIORITY_LABELS[v] }))

export function TaskSheet() {
  const openTaskId = useUI((s) => s.openTaskId)
  const set = useUI((s) => s.set)
  const semester = useActiveSemester()
  const task = semester?.tasks.find((t) => t.id === openTaskId)
  const phone = useMediaQuery('(max-width: 640px)')

  // keep showing the last task while the sheet animates closed
  const [shownId, setShownId] = useState(openTaskId)
  if (openTaskId && openTaskId !== shownId) setShownId(openTaskId)

  return (
    <Sheet open={!!task} onOpenChange={(o) => !o && set({ openTaskId: null })}>
      <SheetContent
        side={phone ? 'bottom' : 'right'}
        className="gap-0 border-0 p-0 sm:m-2.5 sm:h-[calc(100%-20px)] sm:max-w-md sm:rounded-2xl max-sm:max-h-[88dvh] max-sm:rounded-t-2xl"
      >
        {shownId && semester && <Body key={shownId} taskId={shownId} semesterName={semester.name} />}
      </SheetContent>
    </Sheet>
  )
}

function Body({ taskId, semesterName }: { taskId: string; semesterName: string }) {
  const semester = useActiveSemester()!
  const task = semester.tasks.find((t) => t.id === taskId)
  const updateTask = useStore((s) => s.updateTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const set = useUI((s) => s.set)
  const [title, setTitle] = useState(task?.title ?? '')
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [title])

  if (!task) return null
  const patch = (p: Parameters<typeof updateTask>[1]) => updateTask(task.id, p)

  const remove = () => {
    const undo = deleteTask(task.id)
    set({ openTaskId: null })
    toast(`Deleted “${task.title}”`, { action: undo && { label: 'Undo', onClick: undo } })
  }

  return (
    <>
      <div className="truncate px-6 pt-5 pr-12 text-[13px] text-muted-foreground">{semesterName}</div>
      <SheetTitle className="sr-only">Task details</SheetTitle>
      <SheetDescription className="sr-only">Edit the task. Changes save automatically.</SheetDescription>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <label htmlFor="task-title" className="sr-only">
          Title
        </label>
        <textarea
          id="task-title"
          ref={titleRef}
          rows={1}
          value={title}
          maxLength={300}
          onChange={(e) => {
            const v = e.target.value.replace(/\n/g, ' ')
            setTitle(v)
            if (v.trim()) patch({ title: v })
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
          className="w-full resize-none overflow-hidden bg-transparent pt-2 pb-4 text-[22px] leading-snug font-semibold tracking-[-0.025em] outline-none"
        />

        <div className="grid grid-cols-[84px_1fr] items-center gap-y-1.5 border-y py-3 text-sm">
          <span className="text-[13px] text-muted-foreground">Status</span>
          <Segmented
            id="status"
            options={statusOptions}
            value={task.status}
            onChange={(status) => patch({ status })}
            tone={{ in_progress: 'text-warn', completed: 'text-primary' }}
          />
          <span className="text-[13px] text-muted-foreground">Due</span>
          <div>
            <DuePicker look="field" value={task.due} onChange={(due) => patch({ due })} />
          </div>
          <span className="text-[13px] text-muted-foreground">Class</span>
          <div className="min-w-0">
            <ClassPicker look="field" classes={semester.classes} value={task.classId} onChange={(classId) => patch({ classId })} />
          </div>
          <span className="text-[13px] text-muted-foreground">Type</span>
          <div>
            <TypePicker look="field" value={task.type} onChange={(type) => patch({ type })} />
          </div>
          <span className="text-[13px] text-muted-foreground">Priority</span>
          <Segmented
            id="priority"
            options={priorityOptions}
            value={task.priority}
            onChange={(priority) => patch({ priority })}
            tone={PRIORITY_TONE}
          />
        </div>

        <label htmlFor="task-notes" className="sr-only">
          Notes
        </label>
        <textarea
          id="task-notes"
          value={task.notes}
          maxLength={5000}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Notes: pages to read, group members, links…"
          className="min-h-40 w-full resize-y bg-transparent py-4 text-sm text-foreground/85 outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="flex items-center justify-between border-t px-6 py-3">
        <span className="font-mono text-xs text-muted-foreground/70">Saves automatically</span>
        <Button variant="ghost" size="sm" onClick={remove} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 /> Delete
        </Button>
      </div>
    </>
  )
}
