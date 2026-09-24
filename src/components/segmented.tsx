import { motion } from 'motion/react'
import { cn } from 'cn'

/** Segmented control whose highlight slides between options. */
export function Segmented<T extends string>({
  id,
  options,
  value,
  onChange,
  tone,
}: {
  /** unique per control, so highlights in two controls don't swap places */
  id: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  tone?: Partial<Record<T, string>>
}) {
  return (
    <div role="radiogroup" className="-ml-1 flex flex-wrap gap-0.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative rounded-full px-3 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground',
              on && 'text-foreground',
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
              />
            )}
            <span className={cn('relative', on && tone?.[o.value])}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
