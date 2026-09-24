import { AnimatePresence, motion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { Flag, ListFilter, X } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dot } from '@/components/pickers'
import { CLASS_COLORS, PRIORITY_LABELS, PRIORITY_TONE, TYPE_LABELS, TYPES } from '@/lib/constants'
import { useActiveSemester } from '@/lib/store'
import type { Priority } from '@/lib/types'
import { filterCount, NO_FILTERS, useUI } from '@/lib/ui'

const PRIORITIES: Priority[] = ['high', 'medium', 'low']

/** "Filter" button with a checklist of classes, types and priorities. */
export function FilterMenu() {
  const semester = useActiveSemester()
  const filters = useUI((s) => s.filters)
  const toggle = useUI((s) => s.toggleFilter)
  const set = useUI((s) => s.set)
  if (!semester) return null

  const open = semester.tasks.filter((t) => t.status !== 'completed')
  const count = (pred: (t: (typeof open)[number]) => boolean) => open.filter(pred).length
  // only list types this semester actually uses, so the menu stays short
  const types = TYPES.filter((ty) => semester.tasks.some((t) => t.type === ty))
  const n = filterCount(filters)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-tour="filter"
          className={cn('-mr-2 gap-1.5 text-[13px] font-normal text-muted-foreground', n > 0 && 'text-foreground')}
        >
          <ListFilter />
          Filter
          <AnimatePresence initial={false}>
            {n > 0 && (
              <motion.span
                initial={{ scale: 0, width: 0 }}
                animate={{ scale: 1, width: 'auto' }}
                exit={{ scale: 0, width: 0 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }}
                className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10.5px] text-primary-foreground"
              >
                <NumberFlow value={n} />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-0 p-1">
        <div className="flex h-8 items-center justify-between px-2">
          <span className="text-[13px] font-medium">Filter</span>
          {n > 0 && (
            <button
              onClick={() => set({ filters: NO_FILTERS })}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <div className="max-h-[min(420px,60vh)] overflow-y-auto [scrollbar-width:thin]">
          {semester.classes.length > 0 && (
            <Section title="Class">
              {semester.classes.map((c) => (
                <Row
                  key={c.id}
                  checked={filters.classes.includes(c.id)}
                  onChange={() => toggle('classes', c.id)}
                  count={count((t) => t.classId === c.id)}
                >
                  <Dot color={CLASS_COLORS[c.color]} className="size-1.5" />
                  <span className="truncate">{c.name}</span>
                </Row>
              ))}
            </Section>
          )}
          <Section title="Type">
            {types.map((ty) => (
              <Row key={ty} checked={filters.types.includes(ty)} onChange={() => toggle('types', ty)} count={count((t) => t.type === ty)}>
                {TYPE_LABELS[ty]}
              </Row>
            ))}
          </Section>
          <Section title="Priority">
            {PRIORITIES.map((p) => (
              <Row
                key={p}
                checked={filters.priorities.includes(p)}
                onChange={() => toggle('priorities', p)}
                count={count((t) => t.priority === p)}
              >
                <Flag className={cn('size-3.5', PRIORITY_TONE[p])} />
                {PRIORITY_LABELS[p]}
              </Row>
            ))}
          </Section>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t py-1 first:border-t-0">
      <div className="px-2 pt-1.5 pb-1 text-[11.5px] text-muted-foreground">{title}</div>
      {children}
    </div>
  )
}

function Row({
  checked,
  onChange,
  count,
  children,
}: {
  checked: boolean
  onChange: () => void
  count: number
  children: React.ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent">
      <Checkbox checked={checked} onCheckedChange={onChange} className="transition-all data-checked:scale-105" />
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      <span className={cn('font-mono text-xs text-muted-foreground', !count && 'opacity-40')}>{count}</span>
    </label>
  )
}

/** Removable chips for whatever is filtered right now. */
export function ActiveFilters() {
  const semester = useActiveSemester()
  const filters = useUI((s) => s.filters)
  const toggle = useUI((s) => s.toggleFilter)
  const set = useUI((s) => s.set)

  const chips = [
    ...filters.classes.flatMap((id) => {
      const c = semester?.classes.find((x) => x.id === id)
      return c
        ? [{ key: `c-${id}`, label: c.name, dot: CLASS_COLORS[c.color], remove: () => toggle('classes', id) }]
        : []
    }),
    ...filters.types.map((t) => ({ key: `t-${t}`, label: TYPE_LABELS[t], dot: undefined, remove: () => toggle('types', t) })),
    ...filters.priorities.map((p) => ({
      key: `p-${p}`,
      label: `${PRIORITY_LABELS[p]} priority`,
      dot: undefined,
      remove: () => toggle('priorities', p),
    })),
  ]

  return (
    <AnimatePresence initial={false}>
      {chips.length > 0 && (
        <motion.div
          key="bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-1.5 pt-5">
            <AnimatePresence initial={false} mode="popLayout">
              {chips.map((c) => (
                <motion.span
                  key={c.key}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.35 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-0.5 pl-2.5 text-[12.5px]"
                >
                  {c.dot && <Dot color={c.dot} className="size-1.5" />}
                  {c.label}
                  <button
                    onClick={c.remove}
                    aria-label={`Remove ${c.label} filter`}
                    className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </motion.span>
              ))}
              {chips.length > 1 && (
                <motion.button
                  key="clear"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => set({ filters: NO_FILTERS })}
                  className="px-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear all
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
