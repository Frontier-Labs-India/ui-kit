import type { Snippet } from 'svelte'

export interface DashboardGroup {
  id: string
  title: string | Snippet
  description?: string
  summary?: string | Snippet
  items: (string | Snippet)[]
  collapsed?: boolean
}
