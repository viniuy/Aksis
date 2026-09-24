import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/lib/store'
import { NO_FILTERS, useUI } from '@/lib/ui'

const SUGGESTIONS = ['1st Year, 1st Sem', '2nd Year, 2nd Sem', '3rd Year, 2nd Sem']

/** New-semester form. For a brand-new account it can't be dismissed: they need one semester to start. */
export function SetupDialog() {
  const open = useUI((s) => s.setupOpen)
  const set = useUI((s) => s.set)
  const first = useStore((s) => s.semesters.length === 0)
  const addSemester = useStore((s) => s.addSemester)
  const onboarded = useStore((s) => s.onboarded)
  const [name, setName] = useState('')
  const [classes, setClasses] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addSemester(
      name.trim(),
      classes.split('\n').map((c) => c.trim()).filter(Boolean),
    )
    setName('')
    setClasses('')
    set({ setupOpen: false, filters: NO_FILTERS })
    if (!onboarded) setTimeout(() => set({ tourOpen: true }), 700)
  }

  return (
    <Dialog open={open || first} onOpenChange={(o) => !first && set({ setupOpen: o })}>
      <DialogContent showCloseButton={!first} className="sm:max-w-md" onInteractOutside={(e) => first && e.preventDefault()}>
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="text-xl tracking-tight">{first ? 'Set up your semester' : 'New semester'}</DialogTitle>
            <DialogDescription>You can rename it and edit classes later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label htmlFor="sem-name" className="text-[13px] text-muted-foreground">
              Semester
            </label>
            <Input id="sem-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="1st Year, 1st Sem" maxLength={80} autoFocus required />
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setName(s)}
                  className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="sem-classes" className="text-[13px] text-muted-foreground">
              Classes, one per line
            </label>
            <Textarea
              id="sem-classes"
              value={classes}
              onChange={(e) => setClasses(e.target.value)}
              placeholder={'Business Research\nCapital Market\nBank Operations, Management & Marketing'}
              className="min-h-28"
            />
          </div>
          <DialogFooter>
            {!first && (
              <Button type="button" variant="ghost" onClick={() => set({ setupOpen: false })}>
                Cancel
              </Button>
            )}
            <Button type="submit">Create semester</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
