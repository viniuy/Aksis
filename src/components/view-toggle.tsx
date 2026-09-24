import { motion } from 'motion/react'
import { CalendarDays, List } from 'lucide-react'
import { cn } from 'cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useStore } from '@/lib/store'

const VIEWS = [
  { value: 'list', label: 'List', icon: List },
  { value: 'calendar', label: 'Calendar', icon: CalendarDays },
] as const

/** List | Calendar switch; the highlight slides between the two. */
export function ViewToggle() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  return (
    <div role="radiogroup" aria-label="View" data-tour="view" className="flex rounded-lg bg-muted/60 p-0.5">
      {VIEWS.map(({ value, label, icon: Icon }) => {
        const on = view === value
        return (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <button
                role="radio"
                aria-checked={on}
                aria-label={label}
                onClick={() => setView(value)}
                className={cn(
                  'relative grid h-6 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground',
                  on && 'text-foreground',
                )}
              >
                {on && (
                  <motion.span
                    layoutId="view-toggle"
                    className="absolute inset-0 rounded-md bg-background shadow-sm"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                  />
                )}
                <Icon className="relative size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
