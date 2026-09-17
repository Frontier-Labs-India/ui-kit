/* State Tabs shares with its parts (COMPONENT-API.md rules 2-3), the twin of
 * React's TabsContext, plus the panel registry the array API needs: React
 * reads TabPanel children with Children.forEach; here each TabPanel registers
 * its tabId and content, and Tabs renders the panels itself. */
import { getContext, setContext, type Snippet } from 'svelte'

export interface TabsContext {
  readonly activeId: string
  readonly baseId: string
  readonly orientation: 'horizontal' | 'vertical'
  onSelect(id: string): void
}

export interface PanelEntry {
  readonly tabId: string
  readonly content: Snippet | string | undefined
}

export interface PanelRegistry {
  register(entry: PanelEntry): () => void
}

const CONTEXT = Symbol('ui-kit.tabs')
const REGISTRY = Symbol('ui-kit.tabs.panels')

export function setTabsContext(ctx: TabsContext): void {
  setContext(CONTEXT, ctx)
}

/** The composed-API Tabs around a part, or null (React's parts render without one). */
export function getTabsContext(): TabsContext | null {
  return getContext<TabsContext | undefined>(CONTEXT) ?? null
}

export function setPanelRegistry(registry: PanelRegistry): void {
  setContext(REGISTRY, registry)
}

/** The array-API Tabs a TabPanel belongs to, or null. */
export function getPanelRegistry(): PanelRegistry | null {
  return getContext<PanelRegistry | undefined>(REGISTRY) ?? null
}
