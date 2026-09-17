/* ToastProvider's API through Svelte context (COMPONENT-API.md rule 3): the
 * twin of React's ToastContext, with React's useToast() as getToast(). */
import { getContext, setContext, type Snippet } from 'svelte'

export interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  duration?: number
  action?: { label: string; onClick: () => void }
  dismissible?: boolean
  icon?: string | Snippet
  id?: string
}

export interface ToastApi {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

const KEY = Symbol('ui-kit.toast')

export function setToastContext(api: ToastApi): void {
  setContext(KEY, api)
}

/** The nearest ToastProvider's API. Call during component initialisation; throws outside a provider, as React's useToast does. */
export function getToast(): ToastApi {
  const api = getContext<ToastApi | undefined>(KEY)
  if (!api) throw new Error('getToast must be used within a <ToastProvider>')
  return api
}
