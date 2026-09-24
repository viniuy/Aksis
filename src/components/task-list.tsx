import { useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { ChevronDown } from 'lucide-react'
import { cn } from 'cn'
import { CheckCircle } from '@/components/check-circle'
import { Dot } from '@/components/pickers'
import { celebrate } from '@/lib/celebrate'
import { CLASS_COLORS, PRIORITY_RANK } from '@/lib/constants'
import { bucketOf, dueLabel, type Bucket } from '@/lib/dates'
import { useStore } from '@/lib/store'
import type { Klass, Semester, Task } from '@/lib/types'
import { filterCount, matchesFilters, useUI } from '@/lib/ui'

const GROUPS: [Exclude<Bucket, 'done'>, string][] = [
  ['overdue', 'Overdue'],
  ['today', 'Today'],
  ['week', 'Next 7 days'],
  ['later', 'Later'],
  ['nodate', 'No date'],
]

const spring = { type: 'spring', bounce: 0.15, duration: 0.5 } as const

export function TaskList({ semester }: { semester: Semester }) {
  const filters = useUI((s) => s.filters)
  const filtered = filterCount(filters) > 0
  const settling = useUI((s) => s.settling)
  const showDone = useStore((s) => s.showDone)
  const toggleShowDone = useStore((s) => s.toggleShowDone)

  // stagger rows in on first paint only; later additions appear without delay
  const [firstPaint, setFirstPaint] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setFirstPaint(false), 600)
    return () => clearTimeout(t)
  }, [])

  const classes = new Map(semester.classes.map((c) => [c.id, c]))
  const shown = semester.tasks.filter((t) => matchesFilters(t, filters))
  const by: Record<Bucket, Task[]> = { overdue: [], today: [], week: [], later: [], nodate: [], done: [] }
  for (const t of shown) by[settling[t.id] ?? bucketOf(t)].push(t)
  for (const [k, list] of Object.entries(by))
    list.sort((a, b) =>
      k === 'done'
        ? (b.due ?? '').localeCompare(a.due ?? '')
        : (a.due ?? '9').localeCompare(b.due ?? '9') || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
    )

  const active = shown.length - by.done.length
  let i = 0
  const delay = () => (firstPaint ? Math.min(i++, 14) * 0.03 : 0)

  return (
    <LayoutGroup>
      <div className="mt-4">
        <AnimatePresence initial={false}>
          {!shown.length && <Calm key="empty" title={filtered ? 'Nothing matches these filters' : 'No tasks yet'} body={filtered ? 'Clear the filters to see everything.' : 'Type your first task above and press Enter.'} />}
          {shown.length > 0 && !active && (
            <Calm key="calm" check title="All caught up" body={filtered ? 'Nothing left to do that matches these filters.' : 'Nothing left to do this semester.'} />
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {GROUPS.filter(([k]) => by[k].length).map(([k, label]) => (
            <motion.section
              key={k}
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={spring}
              data-tour={k === GROUPS.find(([g]) => by[g].length)?.[0] ? 'first-group' : undefined}
            >
              <h2
                className={cn(
                  'mt-7 mb-1 flex items-baseline gap-2 pl-10 text-[12.5px] font-medium text-muted-foreground max-sm:pl-0',
                  k === 'overdue' && 'text-destructive',
                )}
              >
                {label}
                <NumberFlow value={by[k].length} className="font-mono text-xs opacity-60" />
              </h2>
              <ul>
                <AnimatePresence mode="popLayout" initial={true}>
                  {by[k].map((t) => (
                    <TaskRow key={t.id} task={t} klass={classes.get(t.classId ?? '')} delay={delay()} />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          ))}
        </AnimatePresence>

        {by.done.length > 0 && (
          <motion.div layout="position" transition={spring}>
            <button
              onClick={toggleShowDone}
              aria-expanded={showDone}
              className="mt-8 mb-1 ml-10 inline-flex items-center gap-1.5 rounded-md px-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground max-sm:ml-0"
            >
              {showDone ? 'Hide' : 'Show'} <NumberFlow value={by.done.length} /> completed
              <motion.span animate={{ rotate: showDone ? 180 : 0 }} transition={spring}>
                <ChevronDown className="size-3.5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {showDone && (
                <motion.ul
                  key="done"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <AnimatePresence mode="popLayout">
                    {by.done.map((t) => (
                      <TaskRow key={t.id} task={t} klass={classes.get(t.classId ?? '')} delay={0} />
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </LayoutGroup>
  )
}

function TaskRow({ task, klass, delay }: { task: Task; klass?: Klass; delay: number }) {
  const updateTask = useStore((s) => s.updateTask)
  const set = useUI((s) => s.set)
  const onlyClass = useUI((s) => s.onlyClass)
  const done = task.status === 'completed'
  const due = dueLabel(task)
  const high = task.priority === 'high' && !done

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (done) return updateTask(task.id, { status: 'not_started' })
    // keep the row in its current group while the check plays, then let it move
    const from = bucketOf(task)
    set({ settling: { ...useUI.getState().settling, [task.id]: from } })
    updateTask(task.id, { status: 'completed' })
    celebrate(e.currentTarget)
    setTimeout(() => {
      const { [task.id]: _, ...rest } = useUI.getState().settling
      set({ settling: rest })
    }, 750)
  }

  return (
    <motion.li
      layout="position"
      layoutId={task.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 16, transition: { duration: 0.18 } }}
      transition={{ ...spring, delay }}
      className="group/row relative -mx-2 flex items-start rounded-xl px-2 transition-colors hover:bg-muted/60"
    >
      <button
        onClick={toggle}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        data-tour="check"
        className="group/check grid h-10 w-8 shrink-0 place-items-center rounded-lg active:scale-90 transition-transform"
      >
        <CheckCircle status={task.status} />
      </button>
      <button
        onClick={() => set({ openTaskId: task.id })}
        data-tour="row"
        className="flex min-w-0 flex-1 items-start gap-4 py-2.5 pr-1 text-left max-sm:flex-col max-sm:gap-0.5"
      >
        <span className="min-w-0 flex-1 wrap-anywhere">
          <span className={cn('relative text-[15px] transition-colors duration-300', done && 'text-muted-foreground')}>
            {task.title}
            <motion.span
              aria-hidden
              className="absolute top-1/2 left-0 h-px w-full origin-left bg-muted-foreground/60"
              initial={false}
              animate={{ scaleX: done ? 1 : 0 }}
              transition={{ duration: 0.35, delay: done ? 0.1 : 0, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </span>
          {(klass || task.status === 'in_progress') && (
            <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-3 text-[12.5px] text-muted-foreground">
              {klass && (
                <span
                  role="link"
                  tabIndex={-1}
                  title={`Show only ${klass.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onlyClass(klass.id)
                  }}
                  className="inline-flex max-w-full min-w-0 items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <Dot color={CLASS_COLORS[klass.color]} className="size-1.5 shrink-0" />
                  <span className="truncate">{klass.name}</span>
                </span>
              )}
              {task.status === 'in_progress' && <span className="text-warn">In progress</span>}
            </span>
          )}
        </span>
        {(due.text || high) && (
          <span
            className={cn(
              'shrink-0 pt-0.5 font-mono text-[12.5px] whitespace-nowrap text-muted-foreground',
              due.tone === 'late' && 'text-destructive',
              due.tone === 'soon' && 'text-warn',
              done && 'text-muted-foreground/50',
            )}
          >
            {high && (
              <span className="mr-1.5 text-destructive" title="High priority">
                !
              </span>
            )}
            {due.text}
          </span>
        )}
      </button>
    </motion.li>
  )
}

function Calm({ title, body, check }: { title: string; body: string; check?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-14 mb-2 text-center text-sm text-muted-foreground"
    >
      {check && (
        <svg viewBox="0 0 24 24" className="mx-auto mb-3 size-7 text-primary" fill="none">
          <motion.path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </svg>
      )}
      <p className="text-base font-medium text-foreground">{title}</p>
      <p>{body}</p>
    </motion.div>
  )
}
