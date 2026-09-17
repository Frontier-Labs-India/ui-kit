<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface SegmentedControlOption {
    value: string
    label: string | Snippet
    icon?: string | Snippet
    disabled?: boolean
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'style'> {
    data: SegmentedControlOption[] | string[]
    /** Bindable. Omit it for an uncontrolled control that starts from defaultValue. */
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    fullWidth?: boolean
    orientation?: 'horizontal' | 'vertical'
    color?: string
    disabled?: boolean
    readOnly?: boolean
    motion?: MotionLevel
    class?: string
    style?: StyleInput
  }

  let {
    data, value = $bindable(), defaultValue, onChange, size = 'md', fullWidth = false, orientation = 'horizontal', color,
    disabled = false, readOnly = false, motion, class: className, style, ...rest
  }: Props = $props()

  const cls = makeCls('segmented')
  const motionLevel = getMotionLevel(() => motion)
  const options = $derived(
    (data as (SegmentedControlOption | string)[]).map(item => (typeof item === 'string' ? { value: item, label: item } : item)),
  )
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue ?? options[0]?.value ?? '')
  const activeValue = $derived(value !== undefined ? value : internal)

  let container = $state<HTMLDivElement | null>(null)
  let indicator = $state<HTMLDivElement | null>(null)
  const items = new Map<string, HTMLButtonElement>()
  const itemRef = (node: HTMLButtonElement, key: string) => {
    items.set(key, node)
    return { destroy: () => { if (items.get(key) === node) items.delete(key) } }
  }

  /* Slides the indicator under the active item. React measures in a layout
   * effect and writes style properties (CSP-safe); a Svelte $effect runs after
   * the DOM update and before paint, which serves the same purpose. */
  function updateIndicator() {
    const active = items.get(activeValue)
    if (!container || !indicator || !active) return
    const containerRect = container.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    if (orientation === 'horizontal') {
      indicator.style.transform = `translateX(${activeRect.left - containerRect.left - 3}px)`
      indicator.style.inlineSize = `${activeRect.width}px`
      indicator.style.blockSize = ''
    } else {
      indicator.style.transform = `translateY(${activeRect.top - containerRect.top - 3}px)`
      indicator.style.blockSize = `${activeRect.height}px`
      indicator.style.inlineSize = 'calc(100% - 6px)'
    }
  }

  $effect(() => {
    void activeValue
    void orientation
    void options
    updateIndicator()
  })

  $effect(() => {
    if (!container) return
    const observer = new ResizeObserver(() => updateIndicator())
    observer.observe(container)
    return () => observer.disconnect()
  })

  function handleSelect(val: string) {
    if (disabled || readOnly) return
    if (options.find(o => o.value === val)?.disabled) return
    if (value !== undefined) value = val
    else internal = val
    onChange?.(val)
  }

  function handleKeyDown(e: KeyboardEvent) {
    const vertical = orientation === 'vertical'
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight'
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft'
    if (![nextKey, prevKey, 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const enabled = options.filter(o => !o.disabled)
    const current = enabled.findIndex(o => o.value === activeValue)
    const target = enabled[
      e.key === 'Home' ? 0
        : e.key === 'End' ? enabled.length - 1
        : e.key === nextKey ? (current + 1 >= enabled.length ? 0 : current + 1)
        : current - 1 < 0 ? enabled.length - 1 : current - 1
    ]
    if (target) {
      handleSelect(target.value)
      items.get(target.value)?.focus()
    }
  }

  // React: color ? { ...style, '--segmented-color': color } : style
  const styles = $derived(mergeStyles(style, color ? { '--segmented-color': color } : null))
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  bind:this={container}
  role="radiogroup"
  class={cn(cls('root'), className)}
  data-size={size}
  data-orientation={orientation}
  data-motion={motionLevel()}
  data-full-width={fullWidth || undefined}
  data-disabled={disabled || undefined}
  data-has-color={color ? 'true' : undefined}
  use:cssProps={styles}
  onkeydown={handleKeyDown}
  {...rest}
>
  <div bind:this={indicator} class="ui-segmented__indicator" aria-hidden="true"></div>
  {#each options as option (option.value)}
    {@const isActive = option.value === activeValue}
    {@const isDisabled = disabled || option.disabled}
    <button
      use:itemRef={option.value}
      type="button"
      role="radio"
      aria-checked={isActive}
      aria-disabled={isDisabled || undefined}
      data-active={isActive || undefined}
      data-disabled={isDisabled || undefined}
      class="ui-segmented__item"
      tabindex={isActive ? 0 : -1}
      onclick={() => handleSelect(option.value)}
    >
      <span class="ui-segmented__item-label">{#if option.icon}<Content value={option.icon} />{/if}<Content value={option.label} /></span>
    </button>
  {/each}
</div>
