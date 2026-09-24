import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { CheckCircle } from '@/components/check-circle'
import { celebrate } from '@/lib/celebrate'
import { CLASS_COLORS, PRIORITY_RANK } from '@/lib/constants'
import { daysFromToday, fromISO, toISO } from '@/lib/dates'
import { useStore } from '@/lib/store'
import type { Klass, Semester, Task } from '@/lib/types'
import { matchesFilters, useUI } from '@/lib/ui'
import { useMediaQuery } from '@/lib/use-media-query'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_CHIPS = 2
const spring = { type: 'spring', bounce: 0.18, duration: 0.5 } as const

/** Month grid on laptops, a day-by-day agenda on phones. Shares filters, the task sheet and check-offs with the list. */
export function CalendarView({ semester }: { semester: Semester }) {
  const phone = useMediaQuery('(max-width: 640px)')
  const filters = useUI((s) => s.filters)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [direction, setDirection] = useState(0)

  const tasks = semester.tasks.filter((t) => matchesFilters(t, filters))
  const byDay = new Map<string, Task[]>()
  for (const t of tasks) if (t.due) byDay.set(t.due, [...(byDay.get(t.due) ?? []), t])
  // open work first, then by priority, so the chips that show are the ones that matter
  for (const list of byDay.values())
    list.sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed') || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
  const classes = new Map(semester.classes.map((c) => [c.id, c]))

  const go = (delta: number) => {
    setDirection(delta)
    setMonth((m) => addMonths(m, delta))
  }
  const goToday = () => {
    const now = startOfMonth(new Date())
    setDirection(now > month ? 1 : -1)
    setMonth(now)
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="relative h-7 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.h2
              key={month.toISOString()}
              custom={direction}
              variants={{
                enter: (d: number) => ({ y: d * 16, opacity: 0 }),
                center: { y: 0, opacity: 1 },
                exit: (d: number) => ({ y: d * -16, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={spring}
              className="text-lg font-semibold tracking-tight"
            >
              {format(month, 'MMMM yyyy')}
            </motion.h2>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" onClick={goToday} className="text-[13px] font-normal text-muted-foreground">
            Today
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => go(-1)} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => go(1)} aria-label="Next month">
            <ChevronRight />
          </Button>
        </div>
      </div>

      <LayoutGroup id="calendar">
        {phone ? (
          <Agenda month={month} byDay={byDay} classes={classes} />
        ) : (
          <MonthGrid month={month} direction={direction} byDay={byDay} classes={classes} />
        )}
        <Unscheduled tasks={tasks.filter((t) => !t.due && t.status !== 'completed')} classes={classes} />
      </LayoutGroup>
    </div>
  )
}

/* ---------- drag to reschedule ---------- */

function useReschedule() {
  const updateTask = useStore((s) => s.updateTask)
  return (task: Task, due: string | null) => {
    if (task.due === due) return
    const before = task.due
    updateTask(task.id, { due })
    toast(due ? `Moved to ${format(fromISO(due), 'EEE, MMM d')}` : 'Removed the due date', {
      description: task.title,
      action: { label: 'Undo', onClick: () => updateTask(task.id, { due: before }) },
    })
  }
}

let dragging: Task | null = null

/* ---------- month grid ---------- */

function MonthGrid({
  month,
  direction,
  byDay,
  classes,
}: {
  month: Date
  direction: number
  byDay: Map<string, Task[]>
  classes: Map<string, Klass>
}) {
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) })
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const reschedule = useReschedule()

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-[11.5px] text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={month.toISOString()}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d * 40, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d * -40, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={spring}
          className="grid grid-cols-7"
        >
          {days.map((day, i) => {
            const iso = toISO(day)
            const list = byDay.get(iso) ?? []
            const extra = list.length - MAX_CHIPS
            return (
              <Popover key={iso} open={openDay === iso} onOpenChange={(o) => setOpenDay(o ? iso : null)}>
                <PopoverAnchor asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`${format(day, 'EEEE, MMMM d')}: ${list.length} ${list.length === 1 ? 'task' : 'tasks'}`}
                    onClick={() => setOpenDay(iso)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpenDay(iso))}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setOver(iso)
                    }}
                    onDragLeave={() => setOver((o) => (o === iso ? null : o))}
                    onDrop={(e) => {
                      e.preventDefault()
                      setOver(null)
                      if (dragging) reschedule(dragging, iso)
                    }}
                    className={cn(
                      'group/day relative flex min-h-24 cursor-pointer flex-col gap-0.5 p-1.5 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/60',
                      i % 7 !== 0 && 'border-l',
                      i >= 7 && 'border-t',
                      !isSameMonth(day, month) && 'bg-muted/20 text-muted-foreground/50',
                      over === iso && 'bg-primary/10 hover:bg-primary/10',
                    )}
                  >
                    <span
                      className={cn(
                        'mb-0.5 grid size-6 place-items-center rounded-full font-mono text-xs',
                        isToday(day) && 'bg-primary font-medium text-primary-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {list.slice(0, MAX_CHIPS).map((t) => (
                      <Chip key={t.id} task={t} klass={classes.get(t.classId ?? '')} />
                    ))}
                    {extra > 0 && <span className="px-1.5 text-[11.5px] text-muted-foreground">+{extra} more</span>}
                  </div>
                </PopoverAnchor>
                <PopoverContent align="start" className="w-72 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <DayPanel iso={iso} tasks={list} classes={classes} />
                </PopoverContent>
              </Popover>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** A task in a day cell: class color bar, title, draggable onto another day. */
function Chip({ task, klass }: { task: Task; klass?: Klass }) {
  const set = useUI((s) => s.set)
  const done = task.status === 'completed'
  const late = !done && !!task.due && daysFromToday(task.due) < 0
  return (
    <div
      draggable
      onDragStart={(e) => {
        dragging = task
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', task.id)
      }}
      onDragEnd={() => (dragging = null)}
      onClick={(e) => {
        e.stopPropagation()
        set({ openTaskId: task.id })
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        layoutId={`chip-${task.id}`}
        transition={spring}
        title={task.title}
        className={cn(
          'flex items-center gap-1.5 truncate rounded-md bg-muted/70 px-1.5 py-0.5 text-[12px] leading-snug transition-colors hover:bg-muted',
          done && 'text-muted-foreground line-through decoration-muted-foreground/50',
          late && 'text-destructive',
        )}
      >
        <span className="h-3 w-0.5 shrink-0 rounded-full" style={{ background: klass ? CLASS_COLORS[klass.color] : 'var(--border)' }} />
        <span className="truncate">{task.title}</span>
      </motion.div>
    </div>
  )
}

/* ---------- day popover: the day's tasks, check-offs, and a quick add ---------- */

function DayPanel({ iso, tasks, classes }: { iso: string; tasks: Task[]; classes: Map<string, Klass> }) {
  const addTask = useStore((s) => s.addTask)
  const [title, setTitle] = useState('')
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    addTask({ title: t, classId: null, type: 'activity_task', due: iso, priority: 'medium' })
    setTitle('')
  }
  return (
    <div>
      <div className="border-b px-3 py-2 text-[13px] font-medium">{format(fromISO(iso), 'EEEE, MMMM d')}</div>
      <ul className="max-h-64 overflow-y-auto p-1 [scrollbar-width:thin]">
        <AnimatePresence initial={false}>
          {tasks.map((t) => (
            <DayRow key={t.id} task={t} klass={classes.get(t.classId ?? '')} />
          ))}
        </AnimatePresence>
        {!tasks.length && <li className="px-2 py-2 text-[13px] text-muted-foreground">Nothing due.</li>}
      </ul>
      <form onSubmit={add} className="flex items-center gap-2 border-t px-3 py-2">
        <label htmlFor={`day-add-${iso}`} className="sr-only">
          Add a task on this day
        </label>
        <input
          id={`day-add-${iso}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task on this day"
          maxLength={300}
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
        {title.trim() && (
          <button type="submit" aria-label="Add" className="text-muted-foreground hover:text-foreground">
            <CornerDownLeft className="size-3.5" />
          </button>
        )}
      </form>
    </div>
  )
}

function DayRow({ task, klass }: { task: Task; klass?: Klass }) {
  const updateTask = useStore((s) => s.updateTask)
  const set = useUI((s) => s.set)
  const done = task.status === 'completed'
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center rounded-md hover:bg-muted/60"
    >
      <button
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        onClick={(e) => {
          updateTask(task.id, { status: done ? 'not_started' : 'completed' })
          if (!done) celebrate(e.currentTarget)
        }}
        className="group/check grid size-8 shrink-0 place-items-center"
      >
        <CheckCircle status={task.status} />
      </button>
      <button onClick={() => set({ openTaskId: task.id })} className="min-w-0 flex-1 py-1.5 pr-2 text-left">
        <span className={cn('block truncate text-[13px]', done && 'text-muted-foreground line-through')}>{task.title}</span>
        {klass && (
          <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <span className="size-1.5 rounded-full" style={{ background: CLASS_COLORS[klass.color] }} />
            <span className="truncate">{klass.name}</span>
          </span>
        )}
      </button>
    </motion.li>
  )
}

/* ---------- tasks without a date: drag them onto a day ---------- */

function Unscheduled({ tasks, classes }: { tasks: Task[]; classes: Map<string, Klass> }) {
  const reschedule = useReschedule()
  const [over, setOver] = useState(false)
  if (!tasks.length) return null
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        if (dragging) reschedule(dragging, null)
      }}
      className={cn('mt-4 rounded-2xl border border-dashed p-3 transition-colors', over && 'border-primary/50 bg-primary/5')}
    >
      <p className="mb-2 text-[12.5px] text-muted-foreground">
        No date <span className="font-mono opacity-70">{tasks.length}</span>
        <span className="max-sm:hidden"> · drag onto a day to schedule</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tasks.map((t) => (
          <div key={t.id} className="max-w-56">
            <Chip task={t} klass={classes.get(t.classId ?? '')} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- phones: the month as a list of days ---------- */

function Agenda({ month, byDay, classes }: { month: Date; byDay: Map<string, Task[]>; classes: Map<string, Klass> }) {
  const [showEarlier, setShowEarlier] = useState(false)
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).filter((d) =>
    byDay.has(toISO(d)),
  )
  if (!days.length)
    return <p className="py-10 text-center text-sm text-muted-foreground">Nothing due in {format(month, 'MMMM')}.</p>

  // past days where everything is done fold away, so the agenda opens near today
  const settled = (d: Date) =>
    daysFromToday(toISO(d)) < 0 && byDay.get(toISO(d))!.every((t) => t.status === 'completed')
  const hidden = showEarlier ? [] : days.filter(settled)
  const shown = days.filter((d) => !hidden.includes(d))

  return (
    <div className="flex flex-col gap-4">
      {hidden.length > 0 && (
        <button
          onClick={() => setShowEarlier(true)}
          className="self-start text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Show {hidden.length} earlier {hidden.length === 1 ? 'day' : 'days'}, all done
        </button>
      )}
      <AnimatePresence initial={false}>
        {shown.map((d) => (
          <motion.section
            key={toISO(d)}
            layout="position"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
          >
            <h3 className={cn('mb-1 text-[12.5px] text-muted-foreground', isToday(d) && 'font-medium text-primary')}>
              {isToday(d) ? 'Today · ' : ''}
              {format(d, 'EEE, MMM d')}
            </h3>
            <ul>
              {byDay.get(toISO(d))!.map((t) => (
                <DayRow key={t.id} task={t} klass={classes.get(t.classId ?? '')} />
              ))}
            </ul>
          </motion.section>
        ))}
      </AnimatePresence>
      {!shown.length && <p className="py-6 text-center text-sm text-muted-foreground">All caught up for {format(month, 'MMMM')}.</p>}
    </div>
  )
}
