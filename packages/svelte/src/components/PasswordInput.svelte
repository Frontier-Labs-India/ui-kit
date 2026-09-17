<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { getFormContextOptional } from '../runes/form-context.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLInputElement | null
    /** Bindable. Inside a form context, the field's value is used when this is omitted. */
    value?: string
    onChange?: (e: Event & { currentTarget: EventTarget & HTMLInputElement }) => void
    label?: string
    description?: string
    error?: string
    placeholder?: string
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    disabled?: boolean
    required?: boolean
    showStrengthMeter?: boolean
    strengthLabels?: string[]
    visibilityToggle?: boolean
    onStrengthChange?: (strength: number) => void
    motion?: MotionLevel
    class?: string
  }

  const DEFAULT_STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

  let {
    value = $bindable(), onChange, label, description, error: errorProp, placeholder, name, size = 'md', disabled, required,
    showStrengthMeter, strengthLabels = DEFAULT_STRENGTH_LABELS, visibilityToggle = true, onStrengthChange, motion,
    class: className, id: idProp, ref = $bindable(null), ...rest
  }: Props = $props()

  function calculateStrength(password: string): number {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    // Map 0-5 to 0-4
    return score === 0 ? 0 : score <= 1 ? 1 : score === 2 ? 2 : score === 3 ? 3 : 4
  }

  const motionLevel = getMotionLevel(() => motion)
  const cls = makeCls('password-input')
  const uid = $props.id()
  const inputId = $derived(idProp || `password-input-${uid}`)
  let visible = $state(false)

  const form = getFormContextOptional()
  const field = $derived(form && name ? form.getFieldProps(name) : null)
  const current = $derived(value !== undefined ? value : field ? ((field.value as string) ?? '') : undefined)
  const error = $derived(errorProp !== undefined ? errorProp : field && field.touched ? field.error : undefined)
  const strength = $derived(calculateStrength(typeof current === 'string' ? current : ''))

  // React reports on mount and whenever strength changes.
  $effect(() => { onStrengthChange?.(strength) })

  const errorId = $derived(error ? `${inputId}-error` : undefined)
  const descriptionId = $derived(description ? `${inputId}-description` : undefined)
  const strengthId = $derived(showStrengthMeter ? `${inputId}-strength` : undefined)
  const describedBy = $derived([descriptionId, strengthId, errorId].filter(Boolean).join(' ') || undefined)

  // Same rule as FormInput: form-managed fields write to the form, else `value`.
  function handleInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    onChange?.(e)
    if (field && value === undefined) field.onChange(e.currentTarget.value)
    else value = e.currentTarget.value
  }
</script>

<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-invalid={error ? '' : undefined}
  data-disabled={disabled ? '' : undefined}
  {...rest}
>
  {#if label}
    <label for={inputId} class="ui-password-input__label">{label}{#if required}<span class="ui-password-input__required" aria-hidden="true">*</span>{/if}</label>
  {/if}
  <div class="ui-password-input__field-wrapper">
    <input
      bind:this={ref}
      id={inputId}
      {name}
      type={visible ? 'text' : 'password'}
      class="ui-password-input__field"
      {disabled}
      {placeholder}
      value={current}
      oninput={handleInput}
      onblur={() => field?.onBlur()}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      {required}
    />
    {#if visibilityToggle}
      <button type="button" class="ui-password-input__toggle" onclick={() => { visible = !visible }} aria-label={visible ? 'Hide password' : 'Show password'} tabindex={-1}>
        {#if visible}
          <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 2L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M6.5 6.5C6.18 6.82 6 7.27 6 7.75C6 8.85 6.9 9.75 8 9.75C8.48 9.75 8.93 9.57 9.25 9.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M3 5C1.8 6.2 1 7.75 1 7.75S3.5 12.5 8 12.5C9.16 12.5 10.2 12.15 11.12 11.62" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M13 10.5C14.2 9.3 15 7.75 15 7.75S12.5 3 8 3C7.36 3 6.74 3.1 6.15 3.27" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        {:else}
          <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5" />
          </svg>
        {/if}
      </button>
    {/if}
  </div>
  {#if description}<span id={descriptionId} class="ui-password-input__description">{description}</span>{/if}
  {#if error}<span id={errorId} class="ui-password-input__error" role="alert">{error}</span>{/if}
  {#if showStrengthMeter}
    <div id={strengthId} class="ui-password-input__strength" aria-live="polite">
      <div class="ui-password-input__strength-bar" role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={strength}>
        {#each [1, 2, 3, 4] as level (level)}
          <div class="ui-password-input__strength-segment" data-level={strength} data-active={level <= strength ? '' : undefined}></div>
        {/each}
      </div>
      {#if strengthLabels[strength]}<span class="ui-password-input__strength-label">{strengthLabels[strength]}</span>{/if}
    </div>
  {/if}
</div>
