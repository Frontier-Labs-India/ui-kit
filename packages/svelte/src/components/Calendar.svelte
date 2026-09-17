<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Icon from '../lib/Icon.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** Bindable. Omit it for an uncontrolled calendar that starts from defaultValue. */
    value?: Date | null
    defaultValue?: Date | null
    onChange?: (date: Date) => void
    minDate?: Date
    maxDate?: Date
    disabledDates?: Date[] | ((date: Date) => boolean)
    firstDayOfWeek?: 0 | 1
    locale?: string
    showOutsideDays?: boolean
    showWeekNumbers?: boolean
    numberOfMonths?: number
    highlightToday?: boolean
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
    /** Internal: range display and interception for DateRangePicker. */
    _rangeStart?: Date | null
    _rangeEnd?: Date | null
    _hoverDate?: Date | null
    _onDayHover?: (date: Date | null) => void
    _onDayClick?: (date: Date) => void
  }

  let {
    value = $bindable(), defaultValue, onChange, minDate, maxDate, disabledDates, firstDayOfWeek = 0, locale = 'en-US',
    showOutsideDays = true, showWeekNumbers = false, numberOfMonths = 1, highlightToday = true, size = 'md', motion,
    class: className, _rangeStart, _rangeEnd, _hoverDate, _onDayHover, _onDayClick, ...rest
  }: Props = $props()

  const cls = makeCls('calendar')
  const motionLevel = getMotionLevel(() => motion)

  type Day = { date: Date; outside: boolean }

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  function isDateBetween(date: Date, start: Date, end: Date) {
    const t = date.getTime()
    return t >= Math.min(start.getTime(), end.getTime()) && t <= Math.max(start.getTime(), end.getTime())
  }
  function getWeekNumber(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }
  const monthName = (year: number, month: number) => new Date(year, month, 1).toLocaleDateString(locale, { month: 'long' })
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => i)

  // State initialised once from the props, as React's useState initialisers are.
  // svelte-ignore state_referenced_locally
  let internal = $state<Date | null>(defaultValue ?? null)
  // svelte-ignore state_referenced_locally
  const init = value ?? defaultValue ?? new Date()
  let viewYear = $state(init.getFullYear())
  let viewMonth = $state(init.getMonth())
  let focusedDay = $state<Date | null>(null)
  let pickerOpen = $state<'month' | 'year' | null>(null)
  let grid: HTMLDivElement | undefined
  const today = new Date()

  const selectedDate = $derived(value !== undefined ? value : internal)

  function prevMonth() {
    if (viewMonth === 0) { viewYear -= 1; viewMonth = 11 } else viewMonth -= 1
  }
  function nextMonth() {
    if (viewMonth === 11) { viewYear += 1; viewMonth = 0 } else viewMonth += 1
  }

  function isDisabled(date: Date) {
    if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true
    if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true
    if (!disabledDates) return false
    if (typeof disabledDates === 'function') return disabledDates(date)
    return disabledDates.some(d => isSameDay(d, date))
  }

  /* `value` is bindable, like every form value in this package: a click moves a
   * bound value and an uncontrolled calendar keeps its own. React keeps a
   * controlled calendar on its prop until the parent re-renders; Svelte cannot
   * tell a bound prop from a one-way one, so that is not reproduced. */
  function handleDayClick(date: Date) {
    if (isDisabled(date)) return
    if (_onDayClick) { _onDayClick(date); return }
    if (value !== undefined) value = date
    else internal = date
    onChange?.(date)
  }

  function handleKeyDown(e: KeyboardEvent) {
    const current = focusedDay ?? selectedDate ?? today
    const y = current.getFullYear(), m = current.getMonth(), d = current.getDate()
    let next: Date | null = null
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); next = new Date(y, m, d - 1); break
      case 'ArrowRight': e.preventDefault(); next = new Date(y, m, d + 1); break
      case 'ArrowUp': e.preventDefault(); next = new Date(y, m, d - 7); break
      case 'ArrowDown': e.preventDefault(); next = new Date(y, m, d + 7); break
      case 'PageUp': e.preventDefault(); next = e.shiftKey ? new Date(y - 1, m, d) : new Date(y, m - 1, d); break
      case 'PageDown': e.preventDefault(); next = e.shiftKey ? new Date(y + 1, m, d) : new Date(y, m + 1, d); break
      case 'Home': e.preventDefault(); next = new Date(y, m, d - current.getDay() + firstDayOfWeek); break
      case 'End': e.preventDefault(); next = new Date(y, m, d + (6 - current.getDay() + firstDayOfWeek)); break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedDay) handleDayClick(focusedDay)
        return
      case 'Escape':
        e.preventDefault()
        pickerOpen = null
        return
    }
    if (next && !isDisabled(next)) {
      focusedDay = next
      viewYear = next.getFullYear()
      viewMonth = next.getMonth()
    }
  }

  // Runs after the DOM update, so the newly rendered day button exists.
  $effect(() => {
    if (!focusedDay || !grid) return
    const btn = grid.querySelector(`[data-day-key="${dayKey(focusedDay)}"]`) as HTMLButtonElement | null
    btn?.focus()
  })

  const dayNames = $derived(
    Array.from({ length: 7 }, (_, i) =>
      // Jan 7 2024 is a Sunday.
      new Date(2024, 0, 7 + ((firstDayOfWeek + i) % 7)).toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2),
    ),
  )

  function monthGrid(year: number, month: number): Day[][] {
    const totalDays = daysInMonth(year, month)
    const startOffset = (new Date(year, month, 1).getDay() - firstDayOfWeek + 7) % 7
    const days: Day[] = []
    if (showOutsideDays) {
      const prevMonthDays = daysInMonth(year, month - 1)
      for (let i = startOffset - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevMonthDays - i), outside: true })
    } else {
      for (let i = 0; i < startOffset; i++) days.push({ date: new Date(year, month, 0), outside: true })
    }
    for (let d = 1; d <= totalDays; d++) days.push({ date: new Date(year, month, d), outside: false })
    const remaining = 42 - days.length
    if (showOutsideDays) {
      for (let d = 1; d <= remaining; d++) days.push({ date: new Date(year, month + 1, d), outside: true })
    } else {
      for (let d = 0; d < remaining; d++) days.push({ date: new Date(year, month + 1, 1), outside: true })
    }
    const weeks: Day[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return weeks
  }

  const panels = $derived(
    Array.from({ length: numberOfMonths }, (_, i) => {
      let m = viewMonth + i
      let y = viewYear
      if (m > 11) { m -= 12; y += 1 }
      return { year: y, month: m }
    }),
  )
</script>

<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-show-week-numbers={showWeekNumbers ? '' : undefined}
  role="application"
  aria-label="Calendar"
  {...rest}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div bind:this={grid} onkeydown={handleKeyDown}>
    {#each panels as panel, panelIndex (`${panel.year}-${panel.month}`)}
      {@const name = monthName(panel.year, panel.month)}
      <div class="ui-calendar__panel">
        <div class="ui-calendar__header">
          {#if panelIndex === 0}
            <button type="button" class="ui-calendar__nav-btn" onclick={prevMonth} aria-label="Previous month"><Icon name="chevron-left" size="sm" /></button>
          {/if}
          {#if panelIndex > 0}<span></span>{/if}

          <div class="ui-calendar__title-area">
            <button type="button" class="ui-calendar__title-btn" onclick={() => { pickerOpen = pickerOpen === 'month' ? null : 'month' }} aria-label="Select month">{name}</button>
            <button type="button" class="ui-calendar__title-btn" onclick={() => { pickerOpen = pickerOpen === 'year' ? null : 'year' }} aria-label="Select year">{panel.year}</button>

            {#if pickerOpen === 'month' && panelIndex === 0}
              <div class="ui-calendar__picker-dropdown" role="listbox" aria-label="Select month">
                {#each ALL_MONTHS as m (m)}
                  <button
                    type="button"
                    role="option"
                    aria-selected={m === panel.month}
                    class="ui-calendar__picker-item"
                    data-selected={m === panel.month ? '' : undefined}
                    onclick={() => { viewMonth = m; pickerOpen = null }}
                  >{monthName(panel.year, m).slice(0, 3)}</button>
                {/each}
              </div>
            {/if}

            {#if pickerOpen === 'year' && panelIndex === 0}
              <div class="ui-calendar__picker-dropdown" role="listbox" aria-label="Select year">
                {#each Array.from({ length: 12 }, (_, i) => panel.year - 5 + i) as y (y)}
                  <button
                    type="button"
                    role="option"
                    aria-selected={y === panel.year}
                    class="ui-calendar__picker-item"
                    data-selected={y === panel.year ? '' : undefined}
                    onclick={() => { viewYear = y; pickerOpen = null }}
                  >{y}</button>
                {/each}
              </div>
            {/if}
          </div>

          {#if panelIndex === numberOfMonths - 1}
            <button type="button" class="ui-calendar__nav-btn" onclick={nextMonth} aria-label="Next month"><Icon name="chevron-right" size="sm" /></button>
          {/if}
          {#if panelIndex < numberOfMonths - 1}<span></span>{/if}
        </div>

        <div class="ui-calendar__grid" role="grid" aria-label={`${name} ${panel.year}`}>
          {#if showWeekNumbers}<div class="ui-calendar__day-header"></div>{/if}
          {#each dayNames as dayName}
            <div class="ui-calendar__day-header" role="columnheader" aria-label={dayName}>{dayName}</div>
          {/each}

          {#each monthGrid(panel.year, panel.month) as week}
            {#if showWeekNumbers}
              <div class="ui-calendar__week-number" aria-hidden="true">{getWeekNumber(week[0].date)}</div>
            {/if}
            {#each week as { date, outside }}
              {#if outside && !showOutsideDays}
                <div></div>
              {:else}
                {@const isToday = highlightToday && isSameDay(date, today)}
                {@const isSelected = selectedDate ? isSameDay(date, selectedDate) : false}
                {@const disabled = isDisabled(date)}
                {@const rangeStart = _rangeStart ?? null}
                {@const rangeEnd = _rangeEnd ?? _hoverDate ?? null}
                {@const inRange = rangeStart && rangeEnd && !outside ? isDateBetween(date, rangeStart, rangeEnd) : false}
                {@const isRangeStart = rangeStart && !outside ? isSameDay(date, rangeStart) : false}
                {@const isRangeEnd = rangeEnd && !outside ? isSameDay(date, rangeEnd) : false}
                <button
                  type="button"
                  role="gridcell"
                  class="ui-calendar__day"
                  data-day-key={dayKey(date)}
                  tabindex={focusedDay
                    ? isSameDay(date, focusedDay) ? 0 : -1
                    : isSelected || (isToday && !selectedDate) ? 0 : -1}
                  {disabled}
                  aria-selected={isSelected || undefined}
                  aria-disabled={disabled || undefined}
                  aria-current={isToday ? 'date' : undefined}
                  data-today={isToday ? '' : undefined}
                  data-selected={isSelected ? '' : undefined}
                  data-outside={outside ? '' : undefined}
                  data-in-range={inRange ? '' : undefined}
                  data-range-start={isRangeStart ? '' : undefined}
                  data-range-end={isRangeEnd ? '' : undefined}
                  onclick={() => handleDayClick(date)}
                  onmouseenter={() => _onDayHover?.(date)}
                  onmouseleave={() => _onDayHover?.(null)}
                  onfocus={() => { focusedDay = date }}
                >{date.getDate()}</button>
              {/if}
            {/each}
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
