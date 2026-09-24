import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui'

interface Step {
  target: string
  title: string
  body: string
}

const ALL_STEPS: (Step & { importedOnly?: boolean })[] = [
  {
    target: 'semester',
    importedOnly: true,
    title: 'Your spreadsheet is already here',
    body: 'All 3 semesters came over from your Google Sheet. Click the name to switch between them.',
  },
  {
    target: 'first-group',
    title: 'Sorted by due date',
    body: 'Overdue tasks sit at the top, then today, then the next 7 days. You don’t have to sort rows by hand anymore.',
  },
  {
    target: 'check',
    title: 'Click the circle when you’re done',
    body: 'The task moves to Completed. To mark something In progress, open it.',
  },
  {
    target: 'quick-add',
    title: 'Add a task',
    body: 'Type the assignment and press Enter. Class, type, date and priority appear once you click in. Press N to jump here.',
  },
  {
    target: 'row',
    title: 'Open a task for details',
    body: 'Change its date, class or status, or add notes like pages to read or group members.',
  },
  {
    target: 'view',
    title: 'List or calendar',
    body: 'The calendar shows the whole month. Drag a task to another day to reschedule it.',
  },
  {
    target: 'filter',
    title: 'Narrow it down',
    body: 'Filter by class, type or priority. Clicking a class name on any task shows just that class.',
  },
  { target: 'search', title: 'Find anything', body: 'Press / to search tasks and classes, switch semesters, or change the theme.' },
  { target: 'theme', title: 'Pick a theme', body: 'Aksis Light, Aksis Dark, or plain Light and Dark.' },
]

const find = (target: string) => document.querySelector<HTMLElement>(`[data-tour="${target}"]`)

/** First-run walkthrough: a spotlight glides between parts of the screen. */
export function Tour() {
  const open = useUI((s) => s.tourOpen)
  const set = useUI((s) => s.set)
  const importedAt = useStore((s) => s.profile?.importedAt)
  const onboarded = useStore((s) => s.onboarded)
  const hasSemester = useStore((s) => s.semesters.length > 0)
  const setOnboarded = useStore((s) => s.setOnboarded)
  const [steps, setSteps] = useState<Step[]>([])
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  // start automatically the first time someone lands with a semester
  useEffect(() => {
    if (onboarded || !hasSemester) return
    const t = setTimeout(() => set({ tourOpen: true }), 1100)
    return () => clearTimeout(t)
  }, [onboarded, hasSemester, set])

  useEffect(() => {
    if (!open) return
    setSteps(ALL_STEPS.filter((s) => (!s.importedOnly || importedAt) && find(s.target)))
    setI(0)
  }, [open, importedAt])

  const step = open ? steps[i] : undefined

  useLayoutEffect(() => {
    if (!step) return
    const el = find(step.target)
    if (!el) return
    el.scrollIntoView({ block: 'center', behavior: 'instant' })
    const measure = () => setRect(el.getBoundingClientRect())
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  const finish = () => {
    set({ tourOpen: false })
    setOnboarded(true)
    setRect(null)
  }
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pad = 6
  const last = i === steps.length - 1
  const cardW = Math.min(300, innerWidth - 32)
  let top = 0
  let left = 16
  if (rect) {
    top = rect.bottom + pad + 12
    if (top + 170 > innerHeight) top = Math.max(16, rect.top - pad - 12 - 170)
    left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), innerWidth - cardW - 16)
  }

  return createPortal(
    <AnimatePresence>
      {step && rect && (
        <motion.div key="tour" className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="pointer-events-none fixed rounded-xl shadow-[0_0_0_9999px_rgb(0_0_0/0.35),0_0_0_2px_var(--primary)]"
            initial={false}
            animate={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
            transition={{ type: 'spring', bounce: 0.18, duration: 0.55 }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              role="dialog"
              aria-label="Tutorial"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
              className="fixed rounded-2xl bg-popover p-4 text-popover-foreground shadow-2xl ring-1 ring-border"
              style={{ top, left, width: cardW }}
            >
              <h3 className="text-[15px] font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1 mb-4 text-[13.5px] text-muted-foreground">{step.body}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {steps.map((_, j) => (
                    <motion.span
                      key={j}
                      className="h-1.5 rounded-full bg-primary"
                      animate={{ width: j === i ? 16 : 6, opacity: j === i ? 1 : 0.25 }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  {!last && (
                    <Button variant="ghost" size="sm" onClick={finish}>
                      Skip
                    </Button>
                  )}
                  <Button size="sm" autoFocus onClick={() => (last ? finish() : setI(i + 1))}>
                    {last ? 'Done' : 'Next'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
