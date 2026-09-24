// apply the saved theme before first paint so it never flashes
try {
  var t = localStorage.getItem('hwt-theme')
  if (['aksis', 'aksis_light', 'aksis_dark', 'light', 'dark'].indexOf(t) < 0) t = 'aksis'
  var c = document.documentElement.classList
  if (t === 'dark' || t === 'aksis_dark' || (t === 'aksis' && matchMedia('(prefers-color-scheme: dark)').matches)) c.add('dark')
  if (t.indexOf('aksis') === 0) c.add('aksis')
} catch (e) {}
