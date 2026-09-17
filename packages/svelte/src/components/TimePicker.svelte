<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Icon from '../lib/Icon.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { portal } from '../actions/portal.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { getFormContextOptional } from '../runes/form-context.js'
  import { useAnchorPosition } from '../runes/anchor-position.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** Bindable: "2:30 PM" (12h) or "14:30" (24h). */
    value?: string
    onChange?: (time: string) => void
    format?: '12h' | '24h'
    minuteStep?: number
    minTime?: string
    maxTime?: string
    label?: string
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    error?: string
    disabled?: boolean
    clearable?: boolean
    motion?: MotionLevel
    name?: string
    class?: string
  }

  let {
    value = $bindable(), onChange, format = '12h', minuteStep = 1, minTime, maxTime, label, placeholder = 'Select time',
    size = 'md', error: errorProp, disabled, clearable = false, motion, name, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  function parseTime(time: string): { hours: number; minutes: number } | null {
    const ampm = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (ampm) {
      let hours = parseInt(ampm[1], 10)
      const minutes = parseInt(ampm[2], 10)
      const period = ampm[3].toUpperCase()
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      return { hours, minutes }
    }
    const h24 = time.match(/^(\d{1,2}):(\d{2})$/)
    return h24 ? { hours: parseInt(h24[1], 10), minutes: parseInt(h24[2], 10) } : null
  }
  function formatTime(hours: number, minutes: number): string {
    if (format === '24h') return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    const period = hours >= 12 ? 'PM' : 'AM'
    const display = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${display}:${String(minutes).padStart(2, '0')} ${period}`
  }
  const toMinutes = (h: number, m: number) => h * 60 + m

  const cls = makeCls('time-picker')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const id = `tp-${uid}`
  const labelId = `${id}-label`
  const errorId = `${id}-error`

  // As in React, the form supplies change, blur and error — not the value.
  const form = getFormContextOptional()
  const field = $derived(name && form ? form.getFieldProps(name) : null)
  const resolvedError = $derived(errorProp !== undefined ? errorProp : field && field.touched ? field.error : undefined)

  let isOpen = $state(false)
  let internal = $state('')
  const resolvedValue = $derived(value !== undefined ? value : internal)
  const parsed = $derived(resolvedValue ? parseTime(resolvedValue) : null)

  let trigger = $state<HTMLButtonElement | null>(null)
  let dropdown = $state<HTMLDivElement | null>(null)
  const root = $derived(ref)
  let hourCol = $state<HTMLDivElement | null>(null)
  let minuteCol = $state<HTMLDivElement | null>(null)

  const position = useAnchorPosition(() => trigger, () => dropdown, () => ({ placement: 'bottom', align: 'start', offset: 4, enabled: isOpen }))

  const minMinutes = $derived.by(() => { const p = minTime ? parseTime(minTime) : null; return p ? toMinutes(p.hours, p.minutes) : 0 })
  const maxMinutes = $derived.by(() => { const p = maxTime ? parseTime(maxTime) : null; return p ? toMinutes(p.hours, p.minutes) : 24 * 60 - 1 })
  const isTimeDisabled = (h: number, m: number) => toMinutes(h, m) < minMinutes || toMinutes(h, m) > maxMinutes

  function open() {
    if (!disabled) isOpen = true
  }
  function close() {
    isOpen = false
    trigger?.focus()
    field?.onBlur()
  }

  function commit(next: string) {
    if (value !== undefined) value = next
    else internal = next
    onChange?.(next)
    field?.onChange(next)
  }

  function selectTime(h: number, m: number) {
    if (isTimeDisabled(h, m)) return
    commit(formatTime(h, m))
  }

  function handleHourClick(hour: number) {
    let h24 = hour
    if (format === '12h') {
      const period = parsed ? (parsed.hours >= 12 ? 'PM' : 'AM') : 'AM'
      if (period === 'PM' && hour !== 12) h24 = hour + 12
      else if (period === 'AM' && hour === 12) h24 = 0
    }
    selectTime(h24, parsed?.minutes ?? 0)
  }

  function handleMinuteClick(minute: number) {
    selectTime(parsed?.hours ?? (format === '12h' ? 12 : 0), minute)
  }

  function handlePeriodClick(period: 'AM' | 'PM') {
    if (!parsed) { selectTime(period === 'PM' ? 12 : 0, 0); return }
    let hours = parsed.hours
    if (period === 'AM' && hours >= 12) hours -= 12
    if (period === 'PM' && hours < 12) hours += 12
    selectTime(hours, parsed.minutes)
  }

  $effect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (root && !root.contains(target) && (!dropdown || !dropdown.contains(target))) close()
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', onDown), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', onDown)
    }
  })

  // Scroll the selected hour and minute into view once opened.
  $effect(() => {
    if (!isOpen) return
    requestAnimationFrame(() => {
      hourCol?.querySelector('[data-selected]')?.scrollIntoView?.({ block: 'nearest' })
      minuteCol?.querySelector('[data-selected]')?.scrollIntoView?.({ block: 'nearest' })
    })
  })

  const hours = $derived(format === '24h' ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)))
  const minutes = $derived.by(() => {
    const out: number[] = []
    for (let i = 0; i < 60; i += minuteStep) out.push(i)
    return out
  })
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const selectedHour = $derived(parsed ? (format === '12h' ? (parsed.hours === 0 ? 12 : parsed.hours > 12 ? parsed.hours - 12 : parsed.hours) : parsed.hours) : null)
  const selectedMinute = $derived(parsed?.minutes ?? null)
  const selectedPeriod = $derived(parsed ? (parsed.hours >= 12 ? 'PM' : 'AM') : null)
  const currentDisplayHour = $derived(format === '12h' ? (currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour) : currentHour)
</script>

<div
  bind:this={ref}
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
  {#if label}<label class="ui-time-picker__label" id={labelId}>{label}</label>{/if}
  <!-- aria-invalid on the trigger button is React's markup, kept for the contract. -->
  <!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
  <button
    bind:this={trigger}
    type="button"
    class="ui-time-picker__trigger"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    aria-labelledby={label ? labelId : undefined}
    aria-invalid={resolvedError ? true : undefined}
    aria-describedby={resolvedError ? errorId : undefined}
    {disabled}
    onclick={() => (isOpen ? close() : open())}
    onkeydown={e => {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') && !isOpen) {
        e.preventDefault()
        open()
      }
    }}
  >
    <Icon name="clock" size="sm" class="ui-time-picker__icon" />
    <span class="ui-time-picker__value">{#if resolvedValue}{resolvedValue}{:else}<span class="ui-time-picker__placeholder">{placeholder}</span>{/if}</span>
    {#if clearable && resolvedValue}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <span class="ui-time-picker__clear" role="button" tabindex={-1} aria-label="Clear time" onclick={e => { e.stopPropagation(); commit('') }}><Icon name="x" size="sm" /></span>
    {/if}
  </button>

  {#if isOpen}
    <div
      use:portal
      bind:this={dropdown}
      class="ui-time-picker__dropdown"
      role="listbox"
      aria-label="Select time"
      tabindex={-1}
      onkeydown={e => { if (e.key === 'Escape') { e.preventDefault(); close() } }}
      use:cssProps={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div class="ui-time-picker__column" bind:this={hourCol}>
        <div class="ui-time-picker__column-header">Hr</div>
        {#each hours as h (h)}
          <button type="button" role="option" class="ui-time-picker__option" aria-selected={selectedHour === h || undefined}
            data-selected={selectedHour === h ? '' : undefined} data-current={currentDisplayHour === h ? '' : undefined}
            onclick={() => handleHourClick(h)}>{format === '24h' ? String(h).padStart(2, '0') : h}</button>
        {/each}
      </div>
      <div class="ui-time-picker__column" bind:this={minuteCol}>
        <div class="ui-time-picker__column-header">Min</div>
        {#each minutes as m (m)}
          <button type="button" role="option" class="ui-time-picker__option" aria-selected={selectedMinute === m || undefined}
            data-selected={selectedMinute === m ? '' : undefined} data-current={currentMinute === m ? '' : undefined}
            onclick={() => handleMinuteClick(m)}>{String(m).padStart(2, '0')}</button>
        {/each}
      </div>
      {#if format === '12h'}
        <div class="ui-time-picker__column">
          <div class="ui-time-picker__column-header"></div>
          {#each ['AM', 'PM'] as const as period (period)}
            <button type="button" role="option" class="ui-time-picker__option ui-time-picker__period-option" aria-selected={selectedPeriod === period || undefined}
              data-selected={selectedPeriod === period ? '' : undefined} onclick={() => handlePeriodClick(period)}>{period}</button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if resolvedError}<div class="ui-time-picker__error" id={errorId} role="alert">{resolvedError}</div>{/if}
</div>
