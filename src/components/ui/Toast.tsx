let container: HTMLDivElement | null = null

function getContainer() {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div')
    container.className = 'ui-toast-container'
    document.body.appendChild(container)
  }
  return container
}

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' } as const
type ToastType = keyof typeof ICONS

function show(message: string, type: ToastType, duration = 3500) {
  const c = getContainer()
  const el = document.createElement('div')
  el.className = `ui-toast ui-toast-${type}`
  el.innerHTML = `<span class="ui-toast-icon" aria-hidden="true">${ICONS[type]}</span><span>${message}</span>`
  el.setAttribute('role', 'alert')
  c.appendChild(el)
  const remove = () => {
    el.classList.add('ui-toast-out')
    el.addEventListener('animationend', () => el.remove(), { once: true })
  }
  const t = setTimeout(remove, duration)
  el.addEventListener('click', () => { clearTimeout(t); remove() })
}

export const toast = {
  success: (msg: string, ms?: number) => show(msg, 'success', ms),
  error:   (msg: string, ms?: number) => show(msg, 'error',   ms),
  warning: (msg: string, ms?: number) => show(msg, 'warning', ms),
  info:    (msg: string, ms?: number) => show(msg, 'info',    ms),
}
