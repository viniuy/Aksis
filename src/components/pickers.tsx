import { useState, type ComponentProps, type ReactNode } from 'react'
import { CalendarDays, Check, ChevronDown, Flag, Plus, Shapes, X } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CLASS_COLORS, PRIORITY_LABELS, PRIORITY_TONE, TYPE_LABELS, TYPES } from '@/lib/constants'
import { dateLabel, fromISO, quickDates, toISO } from '@/lib/dates'
import { useStore } from '@/lib/store'
import type { Klass, Priority, TaskType } from '@/lib/types'

/*
 * Every picker renders one of two triggers:
 *  - "pill": rounded chip used in the quick-add bar
 *  - "field": borderless value used in the task sheet's property list
 */
type Look = 'pill' | 'field'

interface TriggerProps extends ComponentProps<'button'> {
  look: Look
  empty?: boolean
  icon?: ReactNode
}

function Trigger({ look, empty, icon, children, className, ...rest }: TriggerProps) {
  return (
    <Button
      variant={look === 'pill' ? 'outline' : 'ghost'}
      size="sm"
      className={cn(
        'max-w-60 gap-1.5 font-normal transition-[background,border-color,transform] active:scale-[.97]',
        look === 'pill' && 'h-7 rounded-full px-3 text-[13px] aria-expanded:border-primary/50 aria-expanded:bg-accent',
        look === 'field' && '-ml-2 h-8 justify-start px-2 text-sm',
        empty && 'text-muted-foreground',
        className,
      )}
      {...rest}
    >
      {icon}
      <span className="truncate">{children}</span>
      {look === 'field' && <ChevronDown className="size-3.5 opacity-40" />}
    </Button>
  )
}

export const Dot = ({ color, className }: { color: string; className?: string }) => (
  <span className={cn('size-2 shrink-0 rounded-full', className)} style={{ background: color }} />
)

/* ---------- class ---------- */

export function ClassPicker({
  classes,
  value,
  onChange,
  look,
  onOpenChange,
}: {
  classes: Klass[]
  value: string | null
  onChange: (id: string | null) => void
  look: Look
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const addClass = useStore((s) => s.addClass)
  const current = classes.find((c) => c.id === value)
  const change = (o: boolean) => {
    setOpen(o)
    onOpenChange?.(o)
    if (!o) setQuery('')
  }
  const name = query.trim()
  const canCreate = name.length > 0 && !classes.some((c) => c.name.toLowerCase() === name.toLowerCase())
  return (
    <Popover open={open} onOpenChange={change}>
      <PopoverTrigger asChild>
        <Trigger
          look={look}
          empty={!current}
          icon={current ? <Dot color={CLASS_COLORS[current.color]} /> : <Shapes className="opacity-60" />}
        >
          {current?.name ?? (look === 'pill' ? 'Class' : 'No class')}
        </Trigger>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command
          // substring match; the "Add …" row always ranks last so Enter picks an existing class first
          filter={(v, search, keywords) => {
            if (v.startsWith('__create')) return 0.001
            const q = search.trim().toLowerCase()
            return [v, ...(keywords ?? [])].some((k) => k.toLowerCase().includes(q)) ? 1 : 0
          }}
        >
          <CommandInput value={query} onValueChange={setQuery} placeholder="Find or add a class…" maxLength={80} />
          <CommandList>
            {!classes.length && !name && <CommandEmpty>Type a class name to add it.</CommandEmpty>}
            <CommandGroup>
              {classes.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  onSelect={() => {
                    onChange(c.id)
                    change(false)
                  }}
                >
                  <Dot color={CLASS_COLORS[c.color]} />
                  <span className="truncate">{c.name}</span>
                  {c.id === value && <Check className="ml-auto" />}
                </CommandItem>
              ))}
              {value && (
                <CommandItem
                  value="__none"
                  keywords={['none', 'no class', 'clear']}
                  onSelect={() => {
                    onChange(null)
                    change(false)
                  }}
                  className="text-muted-foreground"
                >
                  <X /> No class
                </CommandItem>
              )}
            </CommandGroup>
            {canCreate && (
              <CommandGroup forceMount>
                <CommandItem
                  forceMount
                  value={`__create ${name}`}
                  onSelect={() => {
                    onChange(addClass(name))
                    change(false)
                  }}
                >
                  <Plus />
                  <span className="truncate">
                    Add <span className="font-medium">“{name}”</span>
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* ---------- type ---------- */

export function TypePicker({
  value,
  onChange,
  look,
  onOpenChange,
}: {
  value: TaskType
  onChange: (t: TaskType) => void
  look: Look
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Trigger look={look} icon={look === 'pill' ? <Shapes className="opacity-60" /> : undefined}>
          {TYPE_LABELS[value]}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as TaskType)}>
          {TYPES.map((t) => (
            <DropdownMenuRadioItem key={t} value={t}>
              {TYPE_LABELS[t]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---------- priority ---------- */

export function PriorityPicker({
  value,
  onChange,
  onOpenChange,
}: {
  value: Priority
  onChange: (p: Priority) => void
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Trigger look="pill" empty={value === 'medium'} icon={<Flag className={PRIORITY_TONE[value]} />}>
          {value === 'medium' ? 'Priority' : PRIORITY_LABELS[value]}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as Priority)}>
          {(['high', 'medium', 'low'] as Priority[]).map((p) => (
            <DropdownMenuRadioItem key={p} value={p}>
              <Flag className={PRIORITY_TONE[p]} />
              {PRIORITY_LABELS[p]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---------- due date ---------- */

export function DuePicker({
  value,
  onChange,
  look,
  onOpenChange,
}: {
  value: string | null
  onChange: (iso: string | null) => void
  look: Look
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const change = (o: boolean) => {
    setOpen(o)
    onOpenChange?.(o)
  }
  const pick = (iso: string | null) => {
    onChange(iso)
    change(false)
  }
  return (
    <Popover open={open} onOpenChange={change}>
      <PopoverTrigger asChild>
        <Trigger look={look} empty={!value} icon={<CalendarDays className="opacity-60" />}>
          {value ? dateLabel(value) : look === 'pill' ? 'Due date' : 'No date'}
        </Trigger>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col p-1">
          {quickDates().map((q) => (
            <button
              key={q.label}
              onClick={() => pick(q.iso)}
              className="flex items-center gap-6 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            >
              {q.label}
              <span className="ml-auto font-mono text-xs text-muted-foreground">{q.hint}</span>
              {value === q.iso && <Check className="size-3.5 text-primary" />}
            </button>
          ))}
          {value && (
            <button
              onClick={() => pick(null)}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              <X className="size-3.5" /> Remove date
            </button>
          )}
        </div>
        <div className="border-t">
          <Calendar
            mode="single"
            selected={value ? fromISO(value) : undefined}
            defaultMonth={value ? fromISO(value) : undefined}
            onSelect={(d) => d && pick(toISO(d))}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
