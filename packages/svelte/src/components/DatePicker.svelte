<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** Bindable ISO date (YYYY-MM-DD). Omit it for an uncontrolled picker that starts from defaultValue. */
    value?: string
    defaultValue?: string
    onChange?: (date: string) => void
    min?: string
    max?: string
    placeholder?: string
    label?: string | Snippet
    error?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    showWeekNumbers?: boolean
    firstDayOfWeek?: 0 | 1
    motion?: MotionLevel
    class?: string
  }

  let {
    value = $bindable(), defaultValue, onChange, min, max, placeholder, label, error, disabled = false, size = 'md',
    showWeekNumbers: _showWeekNumbers = false, firstDayOfWeek = 1, motion, class: className, 'aria-label': ariaLabel, ref = $bindable(null), ...rest
  }: Props = $props()

  const DAY_NAMES_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  const DAY_NAMES_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const parseDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const toISO = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(parseDate(iso))
    } catch {
      return iso
    }
  }
  const monthName = (year: number, month: number) =>
    new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1))
  const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const cls = makeCls('date-picker')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const stableId = `date-picker-${uid}`

  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue || '')
  const currentValue = $derived(value !== undefined ? value : internal)
  let isOpen = $state(false)
  // svelte-ignore state_referenced_locally
  const initial = currentValue ? parseDate(currentValue) : new Date()
  let viewDate = $state({ year: initial.getFullYear(), month: initial.getMonth() })

  // The view follows a changed value.
  $effect(() => {
    if (!currentValue) return
    const d = parseDate(currentValue)
    viewDate = { year: d.getFullYear(), month: d.getMonth() }
  })

  let calendar = $state<HTMLDivElement | null>(null)
  const dayRefs = new Map<number, HTMLButtonElement>()
  const dayRef = (node: HTMLButtonElement, day: number | null) => {
    if (day !== null) dayRefs.set(day, node)
    return {
      update(next: number | null) { if (next !== null) dayRefs.set(next, node) },
      destroy() { if (day !== null && dayRefs.get(day) === node) dayRefs.delete(day) },
    }
  }
  let pendingFocusDay: number | null = null
  const today = new Date()
  const dayNames = $derived(firstDayOfWeek === 1 ? DAY_NAMES_MON : DAY_NAMES_SUN)
  const daysInMonth = $derived(daysIn(viewDate.year, viewDate.month))

  const weeks = $derived.by(() => {
    const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay()
    const offset = firstDayOfWeek === 1 ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay
    const cells: Array<{ day: number; inMonth: boolean; date: Date }> = []
    const prevDays = daysIn(viewDate.year, viewDate.month - 1)
    for (let i = offset - 1; i >= 0; i--) {
      const d = prevDays - i
      cells.push({ day: d, inMonth: false, date: new Date(viewDate.year, viewDate.month - 1, d) })
    }
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true, date: new Date(viewDate.year, viewDate.month, d) })
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) cells.push({ day: d, inMonth: false, date: new Date(viewDate.year, viewDate.month + 1, d) })
    const out: (typeof cells)[] = []
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7))
    return out
  })

  function isDateDisabled(date: Date) {
    if (min && date < parseDate(min)) return true
    if (max && date > parseDate(max)) return true
    return false
  }

  /* `value` is bindable, as every form value here; onChange fires either way. */
  function selectDate(iso: string) {
    if (value !== undefined) value = iso
    else internal = iso
    onChange?.(iso)
    isOpen = false
  }

  function handleOpen() {
    if (!disabled) isOpen = true
  }

  function navigateMonth(delta: number) {
    let month = viewDate.month + delta
    let year = viewDate.year
    if (month < 0) { month = 11; year-- }
    if (month > 11) { month = 0; year++ }
    viewDate = { year, month }
    // React focuses a pending day after the re-render, in the next frame.
    if (pendingFocusDay !== null) {
      const day = pendingFocusDay
      pendingFocusDay = null
      requestAnimationFrame(() => dayRefs.get(day)?.focus())
    }
  }

  function handleCalendarKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { isOpen = false; return }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) return
    const dayAttr = (document.activeElement as HTMLElement | null)?.getAttribute('data-day')
    if (!dayAttr) return
    e.preventDefault()
    const currentDay = parseInt(dayAttr, 10)
    if (e.key === 'Enter' || e.key === ' ') {
      const date = new Date(viewDate.year, viewDate.month, currentDay)
      if (!isDateDisabled(date)) selectDate(toISO(date))
      return
    }
    const newDay = currentDay + (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' ? 7 : -7)
    if (newDay >= 1 && newDay <= daysInMonth) {
      dayRefs.get(newDay)?.focus()
    } else if (newDay < 1) {
      const prevMonth = viewDate.month === 0 ? 11 : viewDate.month - 1
      const prevYear = viewDate.month === 0 ? viewDate.year - 1 : viewDate.year
      pendingFocusDay = daysIn(prevYear, prevMonth) + newDay
      navigateMonth(-1)
    } else {
      pendingFocusDay = newDay - daysInMonth
      navigateMonth(1)
    }
  }

  $effect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (calendar && !calendar.contains(target)) {
        const container = calendar.closest('.ui-date-picker')
        if (container && !container.contains(target)) isOpen = false
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  })

  const errorId = $derived(error ? `${stableId}-error` : undefined)
  const inputId = `${stableId}-input`
  const dialogId = `${stableId}-dialog`
  const selectedDate = $derived(currentValue ? parseDate(currentValue) : null)
</script>

<div class={cn(cls('root'), className)} data-size={size} data-motion={motionLevel()} data-invalid={error ? '' : undefined} bind:this={ref} {...rest}>
  {#if label}<label for={inputId} class="ui-date-picker__label"><Content value={label} /></label>{/if}
  <div class="ui-date-picker__input-wrapper">
    <input
      id={inputId}
      type="text"
      role="combobox"
      class="ui-date-picker__input"
      value={currentValue ? formatDate(currentValue) : ''}
      {placeholder}
      {disabled}
      readonly
      onclick={handleOpen}
      aria-label={ariaLabel}
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={isOpen ? dialogId : undefined}
    />
    <button type="button" class="ui-date-picker__trigger" onclick={handleOpen} {disabled} aria-label="Open calendar" tabindex={-1}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </button>
  </div>
  {#if isOpen}
    <!-- Key handling for the day buttons inside, which bubble here; React sets no tabindex on the dialog. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_interactive_supports_focus -->
    <div bind:this={calendar} class="ui-date-picker__calendar" role="dialog" aria-label="Calendar" id={dialogId} onkeydown={handleCalendarKeyDown}>
      <div class="ui-date-picker__header">
        <button type="button" class="ui-date-picker__nav-btn" onclick={() => navigateMonth(-1)} aria-label="Previous month">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="ui-date-picker__month-label">{monthName(viewDate.year, viewDate.month)}</span>
        <button type="button" class="ui-date-picker__nav-btn" onclick={() => navigateMonth(1)} aria-label="Next month">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
      <table class="ui-date-picker__grid" role="grid">
        <thead><tr>{#each dayNames as name (name)}<th role="columnheader" scope="col">{name}</th>{/each}</tr></thead>
        <tbody>
          {#each weeks as week}
            <tr>
              {#each week as cell}
                {@const isToday = isSameDay(cell.date, today)}
                {@const isSelected = !!selectedDate && isSameDay(cell.date, selectedDate)}
                {@const isDisabled = !cell.inMonth || isDateDisabled(cell.date)}
                <td>
                  <button
                    use:dayRef={cell.inMonth ? cell.day : null}
                    type="button"
                    class="ui-date-picker__day"
                    disabled={isDisabled}
                    data-today={isToday || undefined}
                    data-selected={isSelected ? '' : undefined}
                    data-outside={!cell.inMonth ? '' : undefined}
                    data-day={cell.inMonth ? cell.day : undefined}
                    onclick={() => { if (!isDisabled && cell.inMonth) selectDate(toISO(cell.date)) }}
                    tabindex={isSelected ? 0 : cell.inMonth && cell.day === 1 ? 0 : -1}
                    aria-label={cell.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  >{cell.day}</button>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  {#if error}<span id={errorId} class="ui-date-picker__error" role="alert">{error}</span>{/if}
</div>
