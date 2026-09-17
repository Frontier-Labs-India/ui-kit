<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'size'> {
    /** Label content rendered beside the box. */
    label?: string | Snippet
    /** Controls box and font size (default: 'md'). */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Renders the mixed state; has no HTML attribute, only a DOM property. */
    indeterminate?: boolean
    /** Error message; its presence also sets data-error and aria-invalid. */
    error?: string
    /** Animation intensity override: 0=none, 1=subtle, 2=expressive, 3=cinematic */
    motion?: MotionLevel
    /** Bindable. Omit it for an uncontrolled checkbox that starts from defaultChecked. */
    checked?: boolean
    defaultChecked?: boolean
    class?: string
  }

  let {
    label,
    size = 'md',
    indeterminate = false,
    error,
    motion,
    checked = $bindable(),
    defaultChecked = false,
    disabled = false,
    id: idProp,
    class: className,
    ...rest
  }: Props = $props()

  const cls = makeCls('checkbox')
  /* One rule for every checkbox-like component (Checkbox, ToggleSwitch, Chip):
   * `checked` is bindable. bind:checked is two-way; an uncontrolled instance
   * keeps its own state starting from defaultChecked. A `$bindable(false)`
   * default used to overwrite defaultChecked, so defaultChecked rendered
   * unchecked — that is what this replaces. */
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultChecked)
  const motionLevel = getMotionLevel(() => motion)

  const uid = $props.id()
  const inputId = $derived(idProp || `checkbox-${uid}`)
  const errorId = $derived(error ? `${inputId}-error` : undefined)

  // `indeterminate` is a DOM property with no HTML attribute, so it cannot be
  // set declaratively — this mirrors React's useEffect on the same property.
  let input = $state<HTMLInputElement | null>(null)
  $effect(() => {
    if (input) input.indeterminate = indeterminate
  })
</script>

<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-indeterminate={indeterminate ? '' : undefined}
  data-disabled={disabled ? '' : undefined}
  data-error={error ? '' : undefined}
>
  <!-- React sets this layout with style={{display:'inline-flex',…}}, which is a
       setProperty call and CSP-safe there. Transcribed into Svelte markup it
       would be a static style attribute, which style-src 'self' blocks. It is a
       class instead; the rule lives in the stylesheet. -->
  <div class="ui-checkbox__row">
    <input
      bind:this={input}
      bind:checked={() => checked ?? internal, v => { if (checked !== undefined) checked = v; else internal = v }}
      type="checkbox"
      id={inputId}
      class="ui-checkbox__input"
      {disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
      {...rest}
    />
    <span class="ui-checkbox__box">
      <svg class="ui-checkbox__check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="ui-checkbox__dash" aria-hidden="true"></span>
    </span>
    {#if label}
      <label for={inputId} class="ui-checkbox__label">
        {#if typeof label === 'function'}{@render label()}{:else}{label}{/if}
      </label>
    {/if}
  </div>
  {#if error}
    <span id={errorId} class="ui-checkbox__error" role="alert">{error}</span>
  {/if}
</div>
