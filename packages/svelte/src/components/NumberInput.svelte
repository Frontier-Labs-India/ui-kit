<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { getFormContextOptional } from '../runes/form-context.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'prefix'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLInputElement | null
    /** Bindable. Omit it for an uncontrolled input that starts from defaultValue. */
    value?: number | null
    defaultValue?: number
    onChange?: (value: number | null) => void
    min?: number
    max?: number
    step?: number
    precision?: number
    label?: string
    description?: string
    error?: string
    placeholder?: string
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    disabled?: boolean
    readOnly?: boolean
    hideControls?: boolean
    clampBehavior?: 'strict' | 'blur'
    prefix?: string
    suffix?: string
    thousandSeparator?: boolean
    allowNegative?: boolean
    allowDecimal?: boolean
    required?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    value = $bindable(), defaultValue, onChange, min, max, step = 1, precision, label, description, error: errorProp,
    placeholder, name, size = 'md', disabled, readOnly, hideControls, clampBehavior = 'blur', prefix, suffix,
    thousandSeparator, allowNegative = true, allowDecimal = true, required, motion, class: className, id: idProp, ref = $bindable(null), ...rest
  }: Props = $props()

  const clamp = (val: number) => {
    let r = val
    if (min !== undefined && r < min) r = min
    if (max !== undefined && r > max) r = max
    return r
  }
  const round = (val: number) => {
    if (precision === undefined) return val
    const factor = Math.pow(10, precision)
    return Math.round(val * factor) / factor
  }
  function formatDisplay(val: number | null | undefined): string {
    if (val === null || val === undefined) return ''
    let str = precision !== undefined ? val.toFixed(precision) : String(val)
    if (thousandSeparator) {
      const [intPart, decPart] = str.split('.')
      const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      str = decPart !== undefined ? `${formatted}.${decPart}` : formatted
    }
    if (prefix) str = `${prefix}${str}`
    if (suffix) str = `${str}${suffix}`
    return str
  }
  function stripFormatting(str: string): string {
    let result = str
    if (prefix && result.startsWith(prefix)) result = result.slice(prefix.length)
    if (suffix && result.endsWith(suffix)) result = result.slice(0, -suffix.length)
    return result.replace(/,/g, '')
  }

  const motionLevel = getMotionLevel(() => motion)
  const cls = makeCls('number-input')
  const uid = $props.id()
  const inputId = $derived(idProp || `number-input-${uid}`)

  const form = getFormContextOptional()
  const field = $derived(form && name ? form.getFieldProps(name) : null)
  // svelte-ignore state_referenced_locally
  let internal = $state<number | null>(defaultValue !== undefined ? defaultValue : null)
  const numericValue = $derived(
    value !== undefined ? value : field ? ((field.value as number | null) ?? null) : internal,
  )
  const error = $derived(errorProp !== undefined ? errorProp : field && field.touched ? field.error : undefined)
  const errorId = $derived(error ? `${inputId}-error` : undefined)
  const descriptionId = $derived(description ? `${inputId}-description` : undefined)
  const describedBy = $derived([descriptionId, errorId].filter(Boolean).join(' ') || undefined)

  let focused = $state(false)
  let rawText = $state('')
  const input = $derived(ref)
  let holdTimer: ReturnType<typeof setTimeout> | null = null
  let holdInterval: ReturnType<typeof setInterval> | null = null

  /* `value` is bindable: a bound or passed value is written, an uncontrolled
   * one is kept internally; a form-managed field also writes to the form.
   * onChange fires either way, as in React. */
  function setValue(val: number | null) {
    const next = val !== null ? round(val) : null
    if (value !== undefined) value = next
    else internal = next
    onChange?.(next)
    if (field && value === undefined) field.onChange(next)
  }

  function stepBy(direction: 1 | -1, multiplier = 1) {
    let next = (numericValue ?? 0) + direction * step * multiplier
    next = clamp(round(next))
    if (!allowNegative && next < 0) next = 0
    setValue(next)
  }

  function stopHold() {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null }
    if (holdInterval) { clearInterval(holdInterval); holdInterval = null }
  }
  function startHold(direction: 1 | -1) {
    holdTimer = setTimeout(() => {
      holdInterval = setInterval(() => stepBy(direction), 60)
    }, 400)
  }
  $effect(() => stopHold)

  const displayValue = $derived(focused ? rawText : formatDisplay(numericValue))

  function handleInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const raw = e.currentTarget.value
    rawText = raw
    const stripped = stripFormatting(raw)
    if (stripped === '' || stripped === '-') { setValue(null); return }
    const parsed = parseFloat(stripped)
    if (isNaN(parsed)) return
    if (!allowNegative && parsed < 0) return
    if (!allowDecimal && stripped.includes('.')) return
    setValue(clampBehavior === 'strict' ? clamp(parsed) : parsed)
  }

  function handleFocus() {
    focused = true
    rawText = numericValue !== null && numericValue !== undefined
      ? precision !== undefined ? numericValue.toFixed(precision) : String(numericValue)
      : ''
  }

  function handleBlur() {
    focused = false
    stopHold()
    if (numericValue !== null && numericValue !== undefined && clampBehavior === 'blur') {
      const clamped = clamp(numericValue)
      if (clamped !== numericValue) setValue(clamped)
    }
    field?.onBlur()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (readOnly) return
    const multiplier = e.shiftKey ? 10 : 1
    if (e.key === 'ArrowUp') { e.preventDefault(); stepBy(1, multiplier) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepBy(-1, multiplier) }
  }

  function handleWheel(e: WheelEvent) {
    if (readOnly || disabled) return
    if (document.activeElement !== input) return
    e.preventDefault()
    stepBy(e.deltaY < 0 ? 1 : -1)
  }

  const isAtMax = $derived(max !== undefined && numericValue !== null && numericValue !== undefined && numericValue >= max)
  const isAtMin = $derived(min !== undefined && numericValue !== null && numericValue !== undefined && numericValue <= min)
</script>

<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-invalid={error ? '' : undefined}
  data-disabled={disabled ? '' : undefined}
  data-hide-controls={hideControls ? '' : undefined}
  {...rest}
>
  {#if label}
    <label for={inputId} class="ui-number-input__label">{label}{#if required}<span class="ui-number-input__required" aria-hidden="true">*</span>{/if}</label>
  {/if}
  <div class="ui-number-input__field-wrapper">
    <input
      bind:this={ref}
      id={inputId}
      {name}
      type="text"
      inputmode="decimal"
      role="spinbutton"
      class="ui-number-input__field"
      {disabled}
      readonly={readOnly}
      {placeholder}
      value={displayValue}
      oninput={(e) => { handleInput(e); if (e.currentTarget.value !== displayValue) e.currentTarget.value = displayValue }}
      onfocus={handleFocus}
      onblur={handleBlur}
      onkeydown={handleKeyDown}
      onwheel={handleWheel}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={numericValue ?? undefined}
      {required}
    />
    {#if !hideControls}
      <div class="ui-number-input__controls" aria-hidden="true">
        <button type="button" class="ui-number-input__stepper" tabindex={-1} disabled={disabled || readOnly || isAtMax}
          onmousedown={() => { stepBy(1); startHold(1) }} onmouseup={stopHold} onmouseleave={stopHold} aria-label="Increment">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 6.5L5 3.5L8 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button type="button" class="ui-number-input__stepper" tabindex={-1} disabled={disabled || readOnly || isAtMin}
          onmousedown={() => { stepBy(-1); startHold(-1) }} onmouseup={stopHold} onmouseleave={stopHold} aria-label="Decrement">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
  {#if description}<span id={descriptionId} class="ui-number-input__description">{description}</span>{/if}
  {#if error}<span id={errorId} class="ui-number-input__error" role="alert">{error}</span>{/if}
</div>
