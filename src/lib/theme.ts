import { useEffect, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { useStore } from './store'
import type { Theme } from './types'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

const isDark = (theme: Theme) => theme === 'dark' || theme === 'aksis_dark' || (theme === 'aksis' && darkQuery().matches)

export function applyThemeClass(theme: Theme) {
  const el = document.documentElement
  const dark = isDark(theme)
  el.classList.toggle('dark', dark)
  el.classList.toggle('aksis', theme.startsWith('aksis'))
  el.style.colorScheme = dark ? 'dark' : 'light'
}

/** Keeps <html> in sync with the saved theme, and with the OS on the auto Aksis theme. */
export function useApplyTheme() {
  const theme = useStore((s) => s.theme)
  useEffect(() => {
    applyThemeClass(theme)
    if (theme !== 'aksis') return
    const q = darkQuery()
    const onChange = () => applyThemeClass('aksis')
    q.addEventListener('change', onChange)
    return () => q.removeEventListener('change', onChange)
  }, [theme])
}

export function useResolvedTheme() {
  const theme = useStore((s) => s.theme)
  const osDark = useSyncExternalStore(
    (cb) => {
      darkQuery().addEventListener('change', cb)
      return () => darkQuery().removeEventListener('change', cb)
    },
    () => darkQuery().matches,
  )
  if (theme === 'aksis') return osDark ? 'dark' : 'light'
  return theme === 'dark' || theme === 'aksis_dark' ? 'dark' : 'light'
}

// last pointer position, so a theme change can ripple out from where the user clicked
let lastPointer = { x: window.innerWidth / 2, y: 80 }
window.addEventListener('pointerdown', (e) => (lastPointer = { x: e.clientX, y: e.clientY }), true)

/** Switches theme with a circular reveal from the last click (View Transitions API). */
export function switchTheme(theme: Theme) {
  const commit = () => {
    flushSync(() => useStore.getState().setTheme(theme))
    applyThemeClass(theme)
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduce) return commit()

  const { x, y } = lastPointer
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  document.startViewTransition(commit).ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' },
    )
  })
}
