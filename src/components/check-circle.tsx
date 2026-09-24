import { motion } from 'motion/react'
import type { Status } from '@/lib/types'

/** Round checkbox: empty ring, half-filled for "in progress", filled with a drawn tick when done. */
export function CheckCircle({ status }: { status: Status }) {
  const done = status === 'completed'
  const doing = status === 'in_progress'
  return (
    <svg viewBox="0 0 24 24" className="size-5 overflow-visible">
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        strokeWidth="1.5"
        className={
          doing
            ? 'stroke-warn'
            : 'stroke-muted-foreground/45 transition-colors group-hover/check:stroke-foreground/70'
        }
        animate={{ opacity: done ? 0 : 1 }}
      />
      {doing && <path d="M12 3a9 9 0 0 1 0 18z" className="fill-warn" />}
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        className="fill-primary"
        initial={false}
        animate={{ scale: done ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 22 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      {/* faint tick preview on hover, drawn tick when done */}
      {!done && (
        <path
          d="M7.8 12.3l2.9 2.9 5.5-5.7"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-muted-foreground/0 transition-colors group-hover/check:stroke-muted-foreground/60"
        />
      )}
      <motion.path
        d="M7.8 12.3l2.9 2.9 5.5-5.7"
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
        initial={false}
        animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
        transition={{ duration: 0.28, delay: done ? 0.12 : 0, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </svg>
  )
}
