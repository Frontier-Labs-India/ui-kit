<script module lang="ts">
  export interface DateRangePreset {
    label: string
    range: [Date, Date]
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Icon from '../lib/Icon.svelte'
  import Calendar from './Calendar.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { portal } from '../actions/portal.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { getFormContextOptional } from '../runes/form-context.js'
  import { useAnchorPosition } from '../runes/anchor-position.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Range = [Date | null, Date | null]

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** Bindable [start, end]. */
    value?: Range
    onChange?: (range: Range) => void
    presets?: DateRangePreset[]
    minDate?: Date
    maxDate?: Date
    label?: string
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    error?: string
    disabled?: boolean
    motion?: MotionLevel
    name?: string
    class?: string
  }

  let {
    value = $bindable(), onChange, presets, minDate, maxDate, label, placeholder = 'Select date range', size = 'md',
    error: errorProp, disabled, motion, name, class: className, ...rest
  }: Props = $props()

  const formatDate = (date: Date | null) => (date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')

  const cls = makeCls('date-range-picker')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const id = `drp-${uid}`
  const labelId = `${id}-label`
  const errorId = `${id}-error`

  // As in React, the form supplies blur and the error only.
  const form = getFormContextOptional()
  const field = $derived(name && form ? form.getFieldProps(name) : null)
  const resolvedError = $derived(errorProp !== undefined ? errorProp : field && field.touched ? field.error : undefined)

  let isOpen = $state(false)
  let internal = $state<Range>([null, null])
  let hoverDate = $state<Date | null>(null)
  let selectingEnd = $state(false)
  const resolvedRange = $derived(value ?? internal)

  let trigger = $state<HTMLButtonElement | null>(null)
  let popover = $state<HTMLDivElement | null>(null)
  let root = $state<HTMLDivElement | null>(null)

  const position = useAnchorPosition(() => trigger, () => popover, () => ({ placement: 'bottom', align: 'start', offset: 4, enabled: isOpen }))

  function open() {
    if (disabled) return
    isOpen = true
    selectingEnd = false
  }
  function close() {
    isOpen = false
    hoverDate = null
    selectingEnd = false
    trigger?.focus()
    field?.onBlur()
  }

  function commit(next: Range) {
    if (value !== undefined) value = next
    else internal = next
    onChange?.(next)
  }

  function handleDayClick(date: Date) {
    if (!selectingEnd) {
      commit([date, null])
      selectingEnd = true
    } else {
      const start = resolvedRange[0]!
      commit(date >= start ? [start, date] : [date, start])
      selectingEnd = false
      close()
    }
  }

  function outOfBounds(preset: DateRangePreset) {
    const [start, end] = preset.range
    if (minDate && maxDate) return end < minDate || start > maxDate
    if (minDate) return end < minDate
    if (maxDate) return start > maxDate
    return false
  }

  function handlePresetClick(preset: DateRangePreset) {
    let [start, end] = preset.range
    if (minDate && start < minDate) start = minDate
    if (maxDate && end > maxDate) end = maxDate
    commit([start, end])
    close()
  }

  $effect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (root && !root.contains(target) && (!popover || !popover.contains(target))) close()
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', onDown), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', onDown)
    }
  })

  const hasValue = $derived(resolvedRange[0] !== null || resolvedRange[1] !== null)
  const displayText = $derived.by(() => {
    const [start, end] = resolvedRange
    if (start && end) return `${formatDate(start)} – ${formatDate(end)}`
    if (start) return formatDate(start)
    return placeholder
  })
</script>

<div
  bind:this={root}
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-open={isOpen ? '' : undefined}
  data-invalid={resolvedError ? '' : undefined}
  data-disabled={disabled ? '' : undefined}
  {...rest}
>
  <!-- React renders this label without `for`: the trigger is named by aria-labelledby. -->
  <!-- svelte-ignore a11y_label_has_associated_control -->
  {#if label}<label class="ui-date-range-picker__label" id={labelId}>{label}</label>{/if}
  <!-- aria-invalid on the trigger button is React's markup, kept for the contract. -->
  <!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
  <button
    bind:this={trigger}
    type="button"
    class="ui-date-range-picker__trigger"
    aria-expanded={isOpen}
    aria-haspopup="dialog"
    aria-labelledby={label ? labelId : undefined}
    aria-invalid={resolvedError ? true : undefined}
    aria-describedby={resolvedError ? errorId : undefined}
    {disabled}
    onclick={() => (isOpen ? close() : open())}
  >
    <Icon name="calendar" size="sm" class="ui-date-range-picker__icon" />
    <span class="ui-date-range-picker__value">{#if !hasValue}<span class="ui-date-range-picker__placeholder">{placeholder}</span>{:else}{displayText}{/if}</span>
    {#if hasValue}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <span class="ui-date-range-picker__clear" role="button" tabindex={-1} aria-label="Clear date range" onclick={e => { e.stopPropagation(); commit([null, null]) }}><Icon name="x" size="sm" /></span>
    {/if}
  </button>

  {#if isOpen}
    <div
      use:portal
      bind:this={popover}
      class="ui-date-range-picker__popover"
      role="dialog"
      aria-label="Date range picker"
      tabindex={-1}
      use:cssProps={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px` }}
      onkeydown={e => { if (e.key === 'Escape') { e.preventDefault(); close() } }}
    >
      {#if presets && presets.length > 0}
        <div class="ui-date-range-picker__presets">
          <div class="ui-date-range-picker__preset-title">Presets</div>
          {#each presets as preset}
            {@const off = outOfBounds(preset)}
            <button type="button" class="ui-date-range-picker__preset-btn" onclick={() => handlePresetClick(preset)} disabled={off} aria-disabled={off || undefined}>{preset.label}</button>
          {/each}
        </div>
      {/if}
      <div class="ui-date-range-picker__calendars">
        <Calendar
          numberOfMonths={2}
          {minDate}
          {maxDate}
          {size}
          {motion}
          _rangeStart={resolvedRange[0]}
          _rangeEnd={resolvedRange[1]}
          _hoverDate={selectingEnd ? (hoverDate ?? resolvedRange[0]) : null}
          _onDayHover={d => { hoverDate = d }}
          _onDayClick={handleDayClick}
        />
      </div>
    </div>
  {/if}

  {#if resolvedError}<div class="ui-date-range-picker__error" id={errorId} role="alert">{resolvedError}</div>{/if}
</div>
