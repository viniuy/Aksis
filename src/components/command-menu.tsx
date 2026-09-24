import { useEffect } from 'react'
import { CalendarDays, Eye, EyeOff, List, Plus, Shapes, Sparkles } from 'lucide-react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { CheckCircle } from '@/components/check-circle'
import { Dot } from '@/components/pickers'
import { THEMES } from '@/components/header'
import { CLASS_COLORS, TYPE_LABELS } from '@/lib/constants'
import { dueLabel } from '@/lib/dates'
import { useActiveSemester, useStore } from '@/lib/store'
import { switchTheme } from '@/lib/theme'
import { NO_FILTERS, useUI } from '@/lib/ui'

/** "/" or Ctrl+K: search tasks and run commands. */
export function CommandMenu() {
  const open = useUI((s) => s.commandOpen)
  const set = useUI((s) => s.set)
  const semester = useActiveSemester()
  const semesters = useStore((s) => s.semesters)
  const setActive = useStore((s) => s.setActive)
  const showDone = useStore((s) => s.showDone)
  const toggleShowDone = useStore((s) => s.toggleShowDone)
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, [contenteditable], [role="dialog"]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        set({ commandOpen: !useUI.getState().commandOpen })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [set])

  const run = (fn: () => void) => {
    set({ commandOpen: false })
    fn()
  }
  const classes = new Map(semester?.classes.map((c) => [c.id, c]))
  const tasks = [...(semester?.tasks ?? [])].sort(
    (a, b) => Number(a.status === 'completed') - Number(b.status === 'completed') || (a.due ?? '9').localeCompare(b.due ?? '9'),
  )

  return (
    <CommandDialog className="sm:max-w-lg" open={open} onOpenChange={(o) => set({ commandOpen: o })} title="Search" description="Search tasks and run commands">
      {/* plain substring match: cmdk's fuzzy scoring matched almost everything */}
      <Command
        loop
        filter={(value, search, keywords) => {
          const q = search.trim().toLowerCase()
          // ids are random, so only the human-readable keywords count
          return (keywords?.length ? keywords : [value]).some((k) => k.toLowerCase().includes(q)) ? 1 : 0
        }}
      >
        <CommandInput placeholder="Search tasks, classes, or commands…" />
        <CommandList className="max-h-[min(420px,55vh)]">
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          {tasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {tasks.map((t) => {
                const k = classes.get(t.classId ?? '')
                return (
                  <CommandItem
                    key={t.id}
                    value={t.id}
                    keywords={[t.title, k?.name ?? '', TYPE_LABELS[t.type]]}
                    onSelect={() => run(() => set({ openTaskId: t.id }))}
                  >
                    <CheckCircle status={t.status} />
                    <span className="truncate">{t.title}</span>
                    <CommandShortcut className="shrink-0 font-mono tracking-normal whitespace-nowrap">{dueLabel(t).text}</CommandShortcut>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {semester && semester.classes.length > 0 && (
            <CommandGroup heading="Classes">
              {semester.classes.map((c) => (
                <CommandItem key={c.id} value={`class-${c.id}`} keywords={[c.name, 'filter', 'show only']} onSelect={() => run(() => useUI.getState().onlyClass(c.id))}>
                  <Dot color={CLASS_COLORS[c.color]} />
                  <span className="min-w-0 truncate">Show only {c.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {semesters.length > 1 && (
            <CommandGroup heading="Semesters">
              {semesters.map((s) => (
                <CommandItem key={s.id} value={`sem-${s.id}`} keywords={[s.name, 'semester', 'switch']} onSelect={() => run(() => (setActive(s.id), set({ filters: NO_FILTERS })))}>
                  <span className="min-w-0 truncate">Switch to {s.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading="Commands">
            <CommandItem
              value="toggle-view"
              keywords={[view === 'list' ? 'calendar view' : 'list view', 'switch view', 'month']}
              onSelect={() => run(() => setView(view === 'list' ? 'calendar' : 'list'))}
            >
              {view === 'list' ? <CalendarDays /> : <List />} {view === 'list' ? 'Calendar view' : 'List view'}
            </CommandItem>
            <CommandItem value="toggle-done" keywords={['completed', 'done', 'show', 'hide']} onSelect={() => run(toggleShowDone)}>
              {showDone ? <EyeOff /> : <Eye />} {showDone ? 'Hide' : 'Show'} completed tasks
            </CommandItem>
            {semester && (
              <CommandItem value="manage-classes" keywords={['manage classes', 'add class', 'remove class', 'rename class', 'delete class']} onSelect={() => run(() => set({ classesOpen: true }))}>
                <Shapes /> Manage classes
              </CommandItem>
            )}
            <CommandItem value="new-semester" keywords={['new', 'semester', 'add']} onSelect={() => run(() => set({ setupOpen: true }))}>
              <Plus /> New semester
            </CommandItem>
            <CommandItem value="tutorial" keywords={['tutorial', 'help', 'tour']} onSelect={() => run(() => set({ tourOpen: true }))}>
              <Sparkles /> Replay tutorial
            </CommandItem>
            {THEMES.map((t) => (
              <CommandItem key={t.value} value={`theme-${t.value}`} keywords={[`${t.label} theme`, 'mode']} onSelect={() => run(() => switchTheme(t.value))}>
                <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: t.swatch }} />
                {t.label} theme
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
