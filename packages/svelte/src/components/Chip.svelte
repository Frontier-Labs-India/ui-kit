<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLLabelAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLLabelAttributes, 'onchange'> {
    /** Bindable. Omit it for an uncontrolled chip that starts from defaultChecked. */
    checked?: boolean
    defaultChecked?: boolean
    onChange?: (checked: boolean) => void
    variant?: 'outline' | 'filled' | 'light'
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    icon?: string | Snippet
    name?: string
    disabled?: boolean
    children?: Snippet
    motion?: MotionLevel
    class?: string
  }

  let {
    checked = $bindable(), defaultChecked = false, onChange, variant = 'outline', color = 'default', size = 'md', icon, name,
    disabled = false, children, motion, class: className, ...rest
  }: Props = $props()

  const cls = makeCls('chip')
  const motionLevel = getMotionLevel(() => motion)
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultChecked)
  const isChecked = $derived(checked !== undefined ? checked : internal)

  /* Same rule as Checkbox and ToggleSwitch: `checked` is bindable, so
   * bind:checked is two-way and an uncontrolled chip keeps its own state. React
   * instead snaps a controlled input back to its prop; Svelte cannot tell a bound
   * prop from a one-way one, so that model is not reproduced — it would make
   * bind:checked impossible. onChange fires either way. */
  function set(v: boolean) {
    if (disabled) return
    if (checked !== undefined) checked = v
    else internal = v
    onChange?.(v)
  }
</script>

<label
  class={cn(cls('root'), className)}
  data-variant={variant}
  data-color={color}
  data-size={size}
  data-checked={isChecked || undefined}
  data-disabled={disabled || undefined}
  data-motion={motionLevel()}
  {...rest}
>
  <input type="checkbox" class="ui-chip__input" {name} bind:checked={() => isChecked, set} {disabled} />
  <span class="ui-chip__check" aria-hidden="true">
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </span>
  {#if icon && !isChecked}<span class="ui-chip__icon"><Content value={icon} /></span>{/if}
  {#if children}{@render children()}{/if}
</label>
