<script module lang="ts">
  export interface MultiSelectOption {
    value: string
    label: string
    disabled?: boolean
    group?: string
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Icon from '../lib/Icon.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { getFormContextOptional } from '../runes/form-context.js'
  import { useAnchorPosition } from '../runes/anchor-position.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    options: MultiSelectOption[]
    /** Bindable. Omit it for an uncontrolled select that starts from defaultValue. */
    value?: string[]
    defaultValue?: string[]
    onChange?: (values: string[]) => void
    placeholder?: string
    searchable?: boolean
    clearable?: boolean
    disabled?: boolean
    maxSelected?: number
    size?: 'sm' | 'md' | 'lg'
    error?: string
    label?: string
    name?: string
    motion?: MotionLevel
    class?: string
  }

  let {
    options, value = $bindable(), defaultValue, onChange, placeholder = 'Select...', searchable = true, clearable = false,
    disabled, maxSelected, size = 'md', error: errorProp, label, name, motion, class: className, ...rest
  }: Props = $props()

  const cls = makeCls('multi-select')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const id = `multi-select-${uid}`
  const listboxId = `${id}-listbox`
  const labelId = `${id}-label`
  const errorId = `${id}-error`

  const form = getFormContextOptional()
  const field = $derived(name && form ? form.getFieldProps(name) : null)

  let isOpen = $state(false)
  // svelte-ignore state_referenced_locally
  let internal = $state<string[]>(defaultValue ?? [])
  let activeIndex = $state(-1)
  let query = $state('')

  const resolvedValue = $derived(value !== undefined ? value : field ? ((field.value as string[]) ?? []) : internal)
  const resolvedError = $derived(errorProp !== undefined ? errorProp : field && field.touched ? field.error : undefined)

  let input = $state<HTMLInputElement | null>(null)
  let trigger = $state<HTMLDivElement | null>(null)
  let listbox = $state<HTMLDivElement | null>(null)
  let popover = $state<HTMLDivElement | null>(null)
  let root = $state<HTMLDivElement | null>(null)

  const filteredOptions = $derived(
    !searchable || !query ? options : options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())),
  )
  const enabledOptions = $derived(filteredOptions.filter(o => !o.disabled))

  const position = useAnchorPosition(() => trigger, () => popover, () => ({ placement: 'bottom', offset: 4, enabled: isOpen }))

  function open() {
    if (disabled) return
    isOpen = true
    activeIndex = 0
    query = ''
  }

  function close() {
    isOpen = false
    query = ''
    field?.onBlur()
  }

  function commit(next: string[]) {
    if (value !== undefined) value = next
    else internal = next
    onChange?.(next)
    field?.onChange(next)
  }

  function toggleOption(option: MultiSelectOption) {
    if (option.disabled) return
    if (resolvedValue.includes(option.value)) commit(resolvedValue.filter(v => v !== option.value))
    else {
      if (maxSelected !== undefined && resolvedValue.length >= maxSelected) return
      commit([...resolvedValue, option.value])
    }
    query = ''
    activeIndex = 0
  }

  const removeValue = (v: string) => commit(resolvedValue.filter(x => x !== v))

  $effect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (root && !root.contains(e.target as Node)) close()
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', onDown), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', onDown)
    }
  })

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) open()
        else activeIndex = Math.min(activeIndex + 1, enabledOptions.length - 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) open()
        else activeIndex = Math.max(activeIndex - 1, 0)
        break
      case 'Home':
        if (isOpen) { e.preventDefault(); activeIndex = 0 }
        break
      case 'End':
        if (isOpen) { e.preventDefault(); activeIndex = enabledOptions.length - 1 }
        break
      case 'Enter':
        e.preventDefault()
        if (isOpen && activeIndex >= 0 && activeIndex < enabledOptions.length) toggleOption(enabledOptions[activeIndex])
        else if (!isOpen) open()
        break
      case ' ':
        if (isOpen && activeIndex >= 0 && activeIndex < enabledOptions.length) {
          e.preventDefault()
          toggleOption(enabledOptions[activeIndex])
        }
        break
      case 'Escape':
        if (isOpen) {
          e.preventDefault()
          close()
          input?.focus()
        }
        break
      case 'Backspace':
        if (searchable && query === '' && resolvedValue.length > 0) removeValue(resolvedValue[resolvedValue.length - 1])
        break
    }
  }

  $effect(() => {
    if (!isOpen || activeIndex < 0 || !listbox) return
    const item = listbox.querySelectorAll('[role="option"]:not([data-disabled])')[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView?.({ block: 'nearest' })
  })

  type Entry = { type: 'header'; group: string } | { type: 'option'; option: MultiSelectOption }
  const entries = $derived.by(() => {
    const out: Entry[] = []
    if (filteredOptions.some(o => o.group)) {
      const seen = new Set<string>()
      for (const option of filteredOptions) {
        const group = option.group ?? ''
        if (group && !seen.has(group)) {
          seen.add(group)
          out.push({ type: 'header', group })
        }
        out.push({ type: 'option', option })
      }
    } else {
      for (const option of filteredOptions) out.push({ type: 'option', option })
    }
    return out
  })

  const optionId = (v: string) => `${id}-option-${v}`
  const activeDescendantId = $derived(
    isOpen && activeIndex >= 0 && activeIndex < enabledOptions.length ? optionId(enabledOptions[activeIndex].value) : undefined,
  )
  const selectedOptions = $derived(resolvedValue.map(v => options.find(o => o.value === v)).filter(Boolean) as MultiSelectOption[])
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
  <!-- React renders this label without `for`: the input is named by aria-labelledby. -->
  <!-- svelte-ignore a11y_label_has_associated_control -->
  {#if label}<label class="ui-multi-select__label" id={labelId}>{label}</label>{/if}

  {#if name}{#each resolvedValue as v}<input type="hidden" {name} value={v} />{/each}{/if}

  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    bind:this={trigger}
    class="ui-multi-select__trigger"
    onclick={() => { if (!disabled && !isOpen) { open(); input?.focus() } }}
  >
    {#each selectedOptions as opt}
      <span class="ui-multi-select__tag">
        <span>{opt.label}</span>
        {#if !disabled}
          <button type="button" class="ui-multi-select__tag-remove" onclick={e => { e.stopPropagation(); removeValue(opt.value) }} aria-label={`Remove ${opt.label}`} tabindex={-1}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6m0-6l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
          </button>
        {/if}
      </span>
    {/each}
    <input
      bind:this={input}
      class="ui-multi-select__input"
      type="text"
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls={isOpen ? listboxId : undefined}
      aria-activedescendant={activeDescendantId}
      aria-labelledby={label ? labelId : undefined}
      aria-invalid={resolvedError ? true : undefined}
      aria-describedby={resolvedError ? errorId : undefined}
      {disabled}
      placeholder={selectedOptions.length === 0 ? placeholder : undefined}
      value={query}
      readonly={!searchable}
      oninput={e => { query = e.currentTarget.value; activeIndex = 0; if (!isOpen) isOpen = true }}
      onfocus={() => { if (!isOpen && !disabled) open() }}
      onkeydown={handleKeyDown}
    />
    <span class="ui-multi-select__actions">
      {#if clearable && resolvedValue.length > 0 && !disabled}
        <button type="button" class="ui-multi-select__clear" onclick={e => { e.stopPropagation(); commit([]); input?.focus() }} aria-label="Clear all selections" tabindex={-1}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6m0-6l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
        </button>
      {/if}
      <Icon
        name="chevron-down"
        size="sm"
        class="ui-multi-select__chevron"
        onclick={() => {
          if (disabled) return
          if (isOpen) close()
          else { open(); input?.focus() }
        }}
      />
    </span>
  </div>

  {#if isOpen}
    <div
      bind:this={popover}
      class="ui-multi-select__dropdown"
      role="listbox"
      id={listboxId}
      aria-labelledby={label ? labelId : undefined}
      aria-multiselectable="true"
      use:cssProps={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div bind:this={listbox} class="ui-multi-select__options">
        {#each entries as entry}
          {#if entry.type === 'header'}
            <div class="ui-multi-select__group-header" role="presentation">{entry.group}</div>
          {:else}
            {@const option = entry.option}
            {@const enabledIdx = enabledOptions.indexOf(option)}
            {@const isSelected = resolvedValue.includes(option.value)}
            <!-- Options are aria-activedescendant targets of the input, never focused. -->
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
            <div
              role="option"
              id={optionId(option.value)}
              aria-selected={isSelected}
              aria-disabled={option.disabled || undefined}
              class="ui-multi-select__option"
              data-active={enabledIdx === activeIndex ? '' : undefined}
              data-disabled={option.disabled ? '' : undefined}
              onclick={() => toggleOption(option)}
              onmouseenter={() => { if (!option.disabled && enabledIdx >= 0) activeIndex = enabledIdx }}
            >
              <span class="ui-multi-select__checkbox" aria-hidden="true" data-checked={isSelected ? '' : undefined}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6l2.5 2.5 4.5-4.5" /></svg>
              </span>
              <span class="ui-multi-select__option-label">{option.label}</span>
            </div>
          {/if}
        {/each}
        {#if filteredOptions.length === 0}<div class="ui-multi-select__empty">No options found</div>{/if}
      </div>
    </div>
  {/if}

  {#if resolvedError}<div class="ui-multi-select__error" id={errorId} role="alert">{resolvedError}</div>{/if}
</div>
