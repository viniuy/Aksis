import confetti from 'canvas-confetti'

/** Small violet burst from the checkbox. Aksis themes only. */
export function celebrate(from: HTMLElement) {
  if (!document.documentElement.classList.contains('aksis')) return
  const r = from.getBoundingClientRect()
  confetti({
    origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight },
    particleCount: 26,
    spread: 70,
    startVelocity: 16,
    gravity: 0.9,
    ticks: 70,
    scalar: 0.6,
    colors: ['#7C5CFF', '#A78BFA', '#C4B5FD', '#E9A8F2'],
    disableForReducedMotion: true,
  })
}
