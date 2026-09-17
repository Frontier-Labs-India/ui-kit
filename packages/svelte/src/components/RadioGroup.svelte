<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface RadioOption {
    value: string
    label: string | Snippet
    disabled?: boolean
  }
</script>

<script lang="ts">
  import type { HTMLFieldsetAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLFieldsetAttributes, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLFieldSetElement | null
    name: string
    options: RadioOption[]
    /** Bindable. Omit it for an uncontrolled group that starts from defaultValue. */
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    orientation?: 'horizontal' | 'vertical'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    label?: string
    error?: string
    motion?: MotionLevel
    class?: string
  }

  let {
    name, options, value = $bindable(), defaultValue, onChange, orientation = 'vertical', size = 'md', label, error, motion,
    class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('radio-group')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const groupId = `radio-${uid}`
  let optionsEl = $state<HTMLDivElement | null>(null)
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue)
  const current = $derived(value !== undefined ? value : internal)

  /* Roving tabindex (WAI-ARIA APG): arrows along the orientation, Home and End
   * move focus among enabled radios, wrapping, and select the one focused. */
  $effect(() => {
    const container = optionsEl
    const horizontal = orientation === 'horizontal'
    if (!container) return
    const onKeyDown = (e: KeyboardEvent) => {
      const items = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'))
      if (items.length === 0) return
      const at = items.indexOf(document.activeElement as HTMLInputElement)
      if (at === -1) return
      let next: number
      if (e.key === (horizontal ? 'ArrowRight' : 'ArrowDown')) next = at + 1 >= items.length ? 0 : at + 1
      else if (e.key === (horizontal ? 'ArrowLeft' : 'ArrowUp')) next = at - 1 < 0 ? items.length - 1 : at - 1
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = items.length - 1
      else return
      e.preventDefault()
      items[at].setAttribute('tabindex', '-1')
      items[next].setAttribute('tabindex', '0')
      items[next].focus()
      items[next].click()
    }
    container.addEventListener('keydown', onKeyDown)
    return () => container.removeEventListener('keydown', onKeyDown)
  })

  function select(v: string) {
    if (value !== undefined) value = v
    else internal = v
    onChange?.(v)
  }
</script>

<fieldset class={cn(cls('root'), className)} data-size={size} data-orientation={orientation} data-motion={motionLevel()} data-error={error ? '' : undefined} bind:this={ref} {...rest}>
  {#if label}<legend class="ui-radio-group__legend">{label}</legend>{/if}
  <div class="ui-radio-group__options" bind:this={optionsEl}>
    {#each options as option (option.value)}
      {@const optionId = `${groupId}-${option.value}`}
      {@const isChecked = current === option.value}
      <label class="ui-radio-group__option" for={optionId} data-disabled={option.disabled ? '' : undefined}>
        <input type="radio" id={optionId} {name} value={option.value} checked={isChecked} disabled={option.disabled} class="ui-radio-group__input" onchange={() => select(option.value)} tabindex={isChecked ? 0 : -1} />
        <span class="ui-radio-group__circle"><span class="ui-radio-group__dot"></span></span>
        <span class="ui-radio-group__label"><Content value={option.label} /></span>
      </label>
    {/each}
  </div>
  {#if error}<span class="ui-radio-group__error" role="alert">{error}</span>{/if}
</fieldset>
