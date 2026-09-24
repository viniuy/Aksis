import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CornerDownLeft, Plus } from 'lucide-react'
import { cn } from 'cn'
import { ClassPicker, DuePicker, PriorityPicker, TypePicker } from '@/components/pickers'
import { useStore } from '@/lib/store'
import type { Priority, Semester, TaskType } from '@/lib/types'

export function QuickAdd({ semester }: { semester: Semester }) {
  const addTask = useStore((s) => s.addTask)
  const [title, setTitle] = useState('')
  const [classId, setClassId] = useState<string | null>(null)
  const [type, setType] = useState<TaskType>('activity_task')
  const [due, setDue] = useState<string | null>(null)
  const [priority, setPriority] = useState<Priority>('medium')
  const [focused, setFocused] = useState(false)
  const [pickers, setPickers] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const form = useRef<HTMLFormElement>(null)

  // the options stay open while the input has focus, a picker is open, or something is typed
  const open = focused || pickers > 0 || title.length > 0
  const track = (o: boolean) => setPickers((n) => Math.max(0, n + (o ? 1 : -1)))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    addTask({ title: t, classId, type, due, priority })
    setTitle('')
    setDue(null)
    setPriority('medium')
    input.current?.focus()
  }

  return (
    <motion.form
      ref={form}
      id="quick-add"
      data-tour="quick-add"
      onSubmit={submit}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!form.current?.contains(e.relatedTarget as Node)) setFocused(false)
      }}
      className={cn(
        'mt-7 rounded-2xl border border-transparent transition-[background,box-shadow,border-color] duration-300',
        open && 'border-border bg-card shadow-[0_12px_40px_-12px_rgb(0_0_0/0.15)]',
      )}
      autoComplete="off"
    >
      <div className="flex cursor-text items-center gap-2.5 px-3 py-2.5" onClick={() => input.current?.focus()}>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
          className={cn('grid size-5 place-items-center text-muted-foreground', open && 'text-primary')}
        >
          <Plus className="size-4" />
        </motion.span>
        <label htmlFor="quick-add-title" className="sr-only">
          New task
        </label>
        <input
          ref={input}
          id="quick-add-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (setTitle(''), input.current?.blur())}
          placeholder="Add a task"
          maxLength={300}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <AnimatePresence>
          {title.trim() && (
            <motion.button
              type="submit"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.35 }}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground"
            >
              Add <CornerDownLeft className="size-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="opts"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
              className="flex flex-wrap gap-1.5 pr-3 pb-3 pl-10 max-sm:pl-3"
            >
              {[
                <ClassPicker key="c" look="pill" classes={semester.classes} value={classId} onChange={setClassId} onOpenChange={track} />,
                <TypePicker key="t" look="pill" value={type} onChange={setType} onOpenChange={track} />,
                <DuePicker key="d" look="pill" value={due} onChange={setDue} onOpenChange={track} />,
                <PriorityPicker key="p" value={priority} onChange={setPriority} onOpenChange={track} />,
              ].map((el) => (
                <motion.div
                  key={el.key}
                  variants={{ hidden: { opacity: 0, y: -4 }, show: { opacity: 1, y: 0 } }}
                >
                  {el}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  )
}
