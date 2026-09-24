import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from 'cn'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CLASS_COLORS, PALETTE } from '@/lib/constants'
import { useActiveSemester, useStore } from '@/lib/store'
import type { Klass } from '@/lib/types'
import { useUI } from '@/lib/ui'

/** Rename, recolor, add and remove the active semester's classes. */
export function ManageClasses() {
  const open = useUI((s) => s.classesOpen)
  const set = useUI((s) => s.set)
  const semester = useActiveSemester()
  const addClass = useStore((s) => s.addClass)
  const [draft, setDraft] = useState('')
  const [removing, setRemoving] = useState<Klass | null>(null)
  if (!semester) return null

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const name = draft.trim()
    if (!name || semester.classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) return
    addClass(name)
    setDraft('')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => set({ classesOpen: o })}>
        <DialogContent className="gap-4 sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl tracking-tight">Classes</DialogTitle>
            <DialogDescription className="wrap-anywhere">{semester.name}. Click a dot to change its color.</DialogDescription>
          </DialogHeader>

          <ul className="-mx-2 max-h-[min(380px,55vh)] overflow-y-auto [scrollbar-width:thin]">
            <AnimatePresence initial={false}>
              {semester.classes.map((c) => (
                <ClassRow key={c.id} klass={c} taskCount={semester.tasks.filter((t) => t.classId === c.id).length} onRemove={() => setRemoving(c)} />
              ))}
            </AnimatePresence>
            {!semester.classes.length && <li className="px-2 py-3 text-sm text-muted-foreground">No classes yet.</li>}
          </ul>

          <form onSubmit={add} className="flex items-center gap-2 border-t pt-4">
            <Plus className="size-4 text-muted-foreground" />
            <label htmlFor="new-class" className="sr-only">
              New class
            </label>
            <input
              id="new-class"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a class"
              maxLength={80}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {draft.trim() && (
              <Button type="submit" size="sm">
                Add
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <RemoveClassPrompt klass={removing} onClose={() => setRemoving(null)} />
    </>
  )
}

function ClassRow({ klass, taskCount, onRemove }: { klass: Klass; taskCount: number; onRemove: () => void }) {
  const renameClass = useStore((s) => s.renameClass)
  const recolorClass = useStore((s) => s.recolorClass)
  const [name, setName] = useState(klass.name)
  const nextColor = PALETTE[(PALETTE.indexOf(klass.color) + 1) % PALETTE.length]

  const commit = () => {
    const v = name.trim()
    if (v && v !== klass.name) renameClass(klass.id, v)
    else setName(klass.name)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
      className="group overflow-hidden"
    >
      <div className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted/60">
        <button
          onClick={() => recolorClass(klass.id, nextColor)}
          aria-label={`Change color of ${klass.name}`}
          className="grid size-6 shrink-0 place-items-center rounded-md transition-transform hover:scale-110 active:scale-90"
        >
          <motion.span
            className="size-2.5 rounded-full"
            animate={{ backgroundColor: CLASS_COLORS[klass.color] }}
            transition={{ duration: 0.25 }}
          />
        </button>
        <label htmlFor={`class-${klass.id}`} className="sr-only">
          Class name
        </label>
        <input
          id={`class-${klass.id}`}
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-1 text-sm outline-none focus:bg-background focus:ring-1 focus:ring-ring/40"
        />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRemove}
              aria-label={`Remove ${klass.name}`}
              className="text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
            >
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove class</TooltipContent>
        </Tooltip>
      </div>
    </motion.li>
  )
}

/**
 * Asks what happens to a class's tasks. A class with no tasks just gets a plain confirm.
 */
function RemoveClassPrompt({ klass, onClose }: { klass: Klass | null; onClose: () => void }) {
  const semester = useActiveSemester()
  const removeClass = useStore((s) => s.removeClass)
  const filters = useUI((s) => s.filters)
  const set = useUI((s) => s.set)

  // snapshot the class and its counts when the prompt opens, so the text holds still while it fades out
  const [shown, setShown] = useState(klass)
  const [counts, setCounts] = useState({ n: 0, done: 0 })
  const [openFor, setOpenFor] = useState<Klass | null>(null)
  if (klass !== openFor) {
    setOpenFor(klass)
    if (klass) {
      const tasks = semester?.tasks.filter((t) => t.classId === klass.id) ?? []
      setShown(klass)
      setCounts({ n: tasks.length, done: tasks.filter((t) => t.status === 'completed').length })
    }
  }
  const { n, done } = counts

  const remove = (withTasks: boolean) => {
    if (!shown) return
    const undo = removeClass(shown.id, withTasks)
    if (filters.classes.includes(shown.id))
      set({ filters: { ...filters, classes: filters.classes.filter((id) => id !== shown.id) } })
    onClose()
    const what = withTasks && n ? `${shown.name} and ${n} ${n === 1 ? 'task' : 'tasks'}` : shown.name
    toast(`Removed ${what}`, { action: undo && { label: 'Undo', onClick: undo } })
  }

  const plural = (k: number) => (k === 1 ? 'task' : 'tasks')
  const doneNote = !done ? '' : done === n ? (n === 1 ? ', already completed' : n === 2 ? ', both completed' : ', all completed') : `, ${done} completed`

  return (
    <AlertDialog open={!!klass} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-anywhere">Remove {shown?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {n === 0 ? 'This class has no tasks.' : `It has ${n} ${plural(n)}${doneNote}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col sm:justify-stretch">
          {n > 0 ? (
            <>
              <Choice onClick={() => remove(false)} title="Remove class only" note={`Keep ${n === 1 ? 'its task' : `the ${n} tasks`}, without a class`} />
              <Choice
                destructive
                onClick={() => remove(true)}
                title={`Remove class and ${n === 1 ? 'its task' : `all ${n} tasks`}`}
                note={done ? 'Completed tasks are removed too' : 'The tasks are deleted'}
              />
            </>
          ) : (
            <Button variant="destructive" onClick={() => remove(false)}>
              Remove class
            </Button>
          )}
          <AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function Choice({ title, note, destructive, onClick }: { title: string; note: string; destructive?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-start rounded-lg border bg-background px-3 py-2 text-left transition-[background,border-color,transform] hover:bg-muted active:scale-[.99]',
        destructive && 'border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10',
      )}
    >
      <span className={cn('text-sm font-medium', destructive && 'text-destructive')}>{title}</span>
      <span className="text-xs text-muted-foreground">{note}</span>
    </button>
  )
}
