<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'size' | 'value' | 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLInputElement | null
    /** Bindable. Omit it for an uncontrolled field that starts from defaultValue. */
    value?: string
    defaultValue?: string
    /** Called `debounce` ms after typing stops, and at once with '' on clear. */
    onChange?: (value: string) => void
    onSearch?: (value: string) => void
    onClear?: () => void
    debounce?: number
    loading?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    clearable?: boolean
    motion?: MotionLevel
    disabled?: boolean
    class?: string
  }

  let {
    value = $bindable(), defaultValue, onChange, onSearch, onClear, debounce = 300, loading = false, size = 'md',
    clearable = true, motion, class: className, disabled, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('search-input')
  const motionLevel = getMotionLevel(() => motion)
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue || '')
  const current = $derived(value !== undefined ? value : internal)
  let timer: ReturnType<typeof setTimeout> | null = null
  $effect(() => () => { if (timer) clearTimeout(timer) })

  function set(next: string) {
    if (value !== undefined) value = next
    else internal = next
  }

  function handleInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const next = e.currentTarget.value
    set(next)
    if (onChange) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => onChange(next), debounce)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && onSearch) {
      if (timer) clearTimeout(timer)
      onSearch(current)
    }
  }

  function handleClear() {
    set('')
    if (timer) clearTimeout(timer)
    onChange?.('')
    onClear?.()
  }

  const hasValue = $derived(current.length > 0)
</script>

<div class={cn(cls('root'), className)} data-size={size} data-motion={motionLevel()} data-loading={loading || undefined} data-has-value={hasValue ? '' : undefined}>
  {#if loading}
    <span class="ui-search-input__spinner" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></span>
  {:else}
    <span class="ui-search-input__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
  {/if}
  <!-- Caller attributes spread last, as in React: a caller onkeydown replaces the Enter handler. -->
  <input type="search" class="ui-search-input__field" value={current} {disabled} aria-label="Search" oninput={handleInput} onkeydown={handleKeyDown} bind:this={ref} {...rest} />
  {#if clearable && hasValue && !disabled}
    <button type="button" class="ui-search-input__clear" onclick={handleClear} aria-label="Clear search" tabindex={-1}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    </button>
  {/if}
</div>
