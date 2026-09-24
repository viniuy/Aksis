import { useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CommandMenu } from '@/components/command-menu'
import { CalendarView } from '@/components/calendar-view'
import { ActiveFilters, FilterMenu } from '@/components/filters'
import { Header, Stats } from '@/components/header'
import { Login } from '@/components/login'
import { ManageClasses } from '@/components/manage-classes'
import { QuickAdd } from '@/components/quick-add'
import { SetupDialog } from '@/components/setup-dialog'
import { TaskList } from '@/components/task-list'
import { TaskSheet } from '@/components/task-sheet'
import { Tour } from '@/components/tour'
import { ViewToggle } from '@/components/view-toggle'
import { cn } from 'cn'
import { useActiveSemester, useStore } from '@/lib/store'
import { useOnline } from '@/lib/pwa'
import { useApplyTheme } from '@/lib/theme'
import { useUI } from '@/lib/ui'

export default function App() {
  useApplyTheme()
  const status = useStore((s) => s.status)
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={400}>
        <AnimatePresence mode="wait">
          {status === 'ready' ? <Tracker key="app" /> : status === 'signedOut' && <Login key="login" />}
        </AnimatePresence>
        <OfflineBanner />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </MotionConfig>
  )
}

function Tracker() {
  const semester = useActiveSemester()
  const view = useStore((s) => s.view)
  useHotkeys()
  useDayRollover()
  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
        className={cn(
          'mx-auto px-4 pt-[clamp(28px,7vh,72px)] pb-32 transition-[max-width] duration-500 ease-out sm:px-5',
          view === 'calendar' ? 'max-w-5xl' : 'max-w-[680px]',
        )}
      >
        <Header />
        <div className="flex items-center justify-between gap-3">
          <Stats />
          <div className="flex items-center gap-2">
            {semester && <ViewToggle />}
            <FilterMenu />
          </div>
        </div>
        {semester && (
          <>
            <QuickAdd key={`qa-${semester.id}`} semester={semester} />
            <ActiveFilters />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
              >
                {/* keyed by semester so switching replays the entrance */}
                {view === 'calendar' ? (
                  <CalendarView key={semester.id} semester={semester} />
                ) : (
                  <TaskList key={semester.id} semester={semester} />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </motion.main>
      <TaskSheet />
      <CommandMenu />
      <SetupDialog />
      <ManageClasses />
      <Tour />
    </>
  )
}

function OfflineBanner() {
  const online = useOnline()
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed inset-x-0 top-3 z-50 mx-auto w-fit rounded-full bg-foreground px-3.5 py-1.5 text-[13px] text-background shadow-lg"
        >
          You’re offline. Changes need a connection.
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** N jumps to the add-task field. */
function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, [contenteditable], [role="dialog"], [role="menu"]')
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      const ui = useUI.getState()
      if (ui.openTaskId || ui.commandOpen || ui.tourOpen) return
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        document.getElementById('quick-add-title')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** Re-render when the tab comes back or every minute, so "Today" and "2d late" stay right past midnight. */
function useDayRollover() {
  const [, tick] = useState(0)
  useEffect(() => {
    const bump = () => tick((n) => n + 1)
    const id = setInterval(bump, 60_000)
    document.addEventListener('visibilitychange', bump)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', bump)
    }
  }, [])
}
