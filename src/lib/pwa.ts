import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let installEvent: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  installEvent = e as InstallPromptEvent
  notify()
})
window.addEventListener('appinstalled', () => {
  installEvent = null
  notify()
})
window.addEventListener('online', notify)
window.addEventListener('offline', notify)

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** The browser's install prompt, when it's on offer. */
export function useInstall() {
  const canInstall = useSyncExternalStore(subscribe, () => !!installEvent)
  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    if ((await installEvent.userChoice).outcome === 'accepted') installEvent = null
    notify()
  }
  return { canInstall, install }
}

export const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine)
