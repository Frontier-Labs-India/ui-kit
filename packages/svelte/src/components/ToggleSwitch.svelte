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

  /* React semantics, which a plain bind:checked would break: a switch is
   * controlled only when the caller passes `checked`. Then aria-checked mirrors
   * it and changes are written back (so bind:checked works). Uncontrolled, the
   * native checkbox keeps its own state from defaultChecked, nothing is written
   * back, and aria-checked is absent — exactly as React renders it. */
  function handleChange(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    if (checked !== undefined) checked = e.currentTarget.checked
    ;(onchange as ((e: Event) => void) | undefined)?.(e)
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
      checked={checked ?? defaultChecked}
      aria-checked={checked !== undefined ? checked : undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
      onchange={handleChange}
      {...rest}
    />
    <span class="ui-toggle-switch__track" aria-hidden="true"><span class="ui-toggle-switch__thumb"></span></span>
    {#if label}<span class="ui-toggle-switch__label"><Content value={label} /></span>{/if}
  </label>
  {#if error}<span id={errorId} class="ui-toggle-switch__error" role="alert">{error}</span>{/if}
</div>
