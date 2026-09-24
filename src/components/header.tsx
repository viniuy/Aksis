import { AnimatePresence, motion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { ChevronDown, Download, LogOut, Plus, Search, Shapes, SunMoon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { bucketOf } from '@/lib/dates'
import { useInstall } from '@/lib/pwa'
import { useActiveSemester, useStore } from '@/lib/store'
import { switchTheme } from '@/lib/theme'
import type { Theme } from '@/lib/types'
import { NO_FILTERS, useUI } from '@/lib/ui'

export const THEMES: { value: Theme; label: string; swatch: string }[] = [
  { value: 'aksis', label: 'Aksis (auto)', swatch: 'linear-gradient(135deg,#EDE4FF 50%,#1E1433 50%)' },
  { value: 'aksis_light', label: 'Aksis Light', swatch: 'linear-gradient(135deg,#C4B5FD,#7C3AED)' },
  { value: 'aksis_dark', label: 'Aksis Dark', swatch: 'linear-gradient(135deg,#7C3AED,#1E1433)' },
  { value: 'light', label: 'Light', swatch: '#fff' },
  { value: 'dark', label: 'Dark', swatch: '#111114' },
]

export function Header() {
  const semester = useActiveSemester()
  const semesters = useStore((s) => s.semesters)
  const setActive = useStore((s) => s.setActive)
  const set = useUI((s) => s.set)

  return (
    <header className="flex items-center justify-between gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            data-tour="semester"
            className="group -ml-2 flex min-w-0 items-center gap-1.5 rounded-xl px-2 py-0.5 text-left transition-colors hover:bg-muted/70"
          >
            <span className="relative overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={semester?.id ?? 'none'}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -24, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="block truncate text-[clamp(24px,4.4vw,30px)] leading-tight font-semibold tracking-[-0.035em]"
                >
                  {semester?.name ?? 'Homework'}
                </motion.span>
              </AnimatePresence>
            </span>
            <ChevronDown className="size-5 shrink-0 text-muted-foreground/60 transition-transform duration-300 group-aria-expanded:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {semesters.length > 0 && (
            <DropdownMenuRadioGroup
              value={semester?.id}
              onValueChange={(id) => {
                setActive(id)
                set({ filters: NO_FILTERS })
              }}
            >
              {semesters.map((s) => (
                <DropdownMenuRadioItem key={s.id} value={s.id}>
                  <span className="truncate">{s.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
          {semesters.length > 0 && <DropdownMenuSeparator />}
          {semester && (
            <DropdownMenuItem onSelect={() => set({ classesOpen: true })}>
              <Shapes /> Manage classes
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => set({ setupOpen: true })}>
            <Plus /> New semester
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex shrink-0 items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Search" data-tour="search" onClick={() => set({ commandOpen: true })}>
              <Search />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Search <kbd className="ml-1 font-mono">/</kbd>
          </TooltipContent>
        </Tooltip>
        <ThemeMenu />
        <AccountMenu />
      </div>
    </header>
  )
}

function ThemeMenu() {
  const theme = useStore((s) => s.theme)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme" data-tour="theme">
          <SunMoon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => switchTheme(v as Theme)}>
          {THEMES.map((t) => [
            t.value === 'light' && <DropdownMenuSeparator key="sep" />,
            <DropdownMenuRadioItem key={t.value} value={t.value}>
              <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: t.swatch }} />
              {t.label}
            </DropdownMenuRadioItem>,
          ])}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AccountMenu() {
  const profile = useStore((s) => s.profile)
  const signOut = useStore((s) => s.signOut)
  const set = useUI((s) => s.set)
  const { canInstall, install } = useInstall()
  if (!profile) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account"
          className="ml-1.5 grid size-7 place-items-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        >
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
          ) : (
            profile.name[0]
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-medium text-foreground">{profile.name}</div>
          <div className="text-xs text-muted-foreground">Signed in with Google</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => set({ tourOpen: true })}>
          <Sparkles /> Replay tutorial
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => set({ commandOpen: true })}>
          <Search /> Search <DropdownMenuShortcut>/</DropdownMenuShortcut>
        </DropdownMenuItem>
        {canInstall && (
          <DropdownMenuItem onSelect={install}>
            <Download /> Install app
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "2 to do · 1 overdue · 17 done", with numbers that roll when they change. */
export function Stats() {
  const semester = useActiveSemester()
  if (!semester) return <div className="h-5" />
  const open = semester.tasks.filter((t) => t.status !== 'completed')
  const late = open.filter((t) => bucketOf(t) === 'overdue').length
  return (
    <p className="mt-1.5 flex flex-wrap gap-x-4 font-mono text-[13px] text-muted-foreground">
      <span>
        <NumberFlow value={open.length} /> to do
      </span>
      <AnimatePresence initial={false}>
        {late > 0 && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            className="text-destructive"
          >
            <NumberFlow value={late} /> overdue
          </motion.span>
        )}
      </AnimatePresence>
      <span>
        <NumberFlow value={semester.tasks.length - open.length} /> done
      </span>
    </p>
  )
}
