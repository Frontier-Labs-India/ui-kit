<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'size'> {
    label?: string | Snippet
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    error?: string
    motion?: MotionLevel
    /** Controlled when passed (bindable); omit it for an uncontrolled switch. */
    checked?: boolean
    /** Initial state for an uncontrolled switch, as React's defaultChecked. */
    defaultChecked?: boolean
    class?: string
  }

  let {
    label, size = 'md', error, motion, class: className, disabled, checked = $bindable(),
    defaultChecked, id: idProp, onchange, ...rest
  }: Props = $props()

  const cls = makeCls('toggle-switch')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const inputId = $derived(idProp || `toggle-switch-${uid}`)
  const errorId = $derived(error ? `${inputId}-error` : undefined)

  /* Same rule as Checkbox and Chip: `checked` is bindable; an uncontrolled
   * switch keeps its own state from defaultChecked. aria-checked is set only
   * when `checked` is provided (bound or passed), as React sets it only when
   * controlled. */
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultChecked ?? false)
  function set(v: boolean) {
    if (checked !== undefined) checked = v
    else internal = v
  }
</script>

<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-disabled={disabled ? '' : undefined}
  data-error={error ? '' : undefined}
>
  <label for={inputId} class="ui-toggle-switch__row">
    <input
      type="checkbox"
      role="switch"
      id={inputId}
      class="ui-toggle-switch__input"
      {disabled}
      bind:checked={() => checked ?? internal, set}
      aria-checked={checked !== undefined ? checked : undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
      {onchange}
      {...rest}
    />
    <span class="ui-toggle-switch__track" aria-hidden="true"><span class="ui-toggle-switch__thumb"></span></span>
    {#if label}<span class="ui-toggle-switch__label"><Content value={label} /></span>{/if}
  </label>
  {#if error}<span id={errorId} class="ui-toggle-switch__error" role="alert">{error}</span>{/if}
</div>
