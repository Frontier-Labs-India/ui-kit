<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface ComboboxOption {
    value: string
    label: string
    disabled?: boolean
    icon?: string | Snippet
    group?: string
    description?: string
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import Icon from '../lib/Icon.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { getFormContextOptional } from '../runes/form-context.js'
  import { useAnchorPosition } from '../runes/anchor-position.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    name: string
    options: ComboboxOption[]
    /** Bindable. Omit it for an uncontrolled combobox that starts from defaultValue. */
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    onSearch?: (query: string) => void
    placeholder?: string
    label?: string | Snippet
    error?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    allowCreate?: boolean
    onCreate?: (value: string) => void
    loading?: boolean
    emptyMessage?: string
    motion?: MotionLevel
    class?: string
  }

  let {
    name, options, value = $bindable(), defaultValue, onChange, onSearch, placeholder = 'Search...', label, error: errorProp,
    disabled, size = 'md', allowCreate, onCreate, loading, emptyMessage = 'No results found', motion, class: className, ...rest
  }: Props = $props()

  const cls = makeCls('combobox')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const id = `combobox-${uid}`
  const listboxId = `${id}-listbox`
  const inputId = `${id}-input`
  const labelId = `${id}-label`
  const errorId = `${id}-error`

  const form = getFormContextOptional()
  const field = $derived(form ? form.getFieldProps(name) : null)

  let isOpen = $state(false)
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue ?? '')
  let activeIndex = $state(-1)
  let query = $state('')

  const resolvedValue = $derived(value !== undefined ? value : field ? ((field.value as string) ?? '') : internal)
  const resolvedError = $derived(errorProp !== undefined ? errorProp : field && field.touched ? field.error : undefined)

  let input = $state<HTMLInputElement | null>(null)
  let wrapper = $state<HTMLDivElement | null>(null)
  let listbox = $state<HTMLDivElement | null>(null)
  let popover = $state<HTMLDivElement | null>(null)
  let root = $state<HTMLDivElement | null>(null)

  // With onSearch the caller filters `options`; otherwise filter locally.
  const filteredOptions = $derived(
    onSearch || !query ? options : options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())),
  )
  const enabledOptions = $derived(filteredOptions.filter(o => !o.disabled))
  const showCreate = $derived(
    !!allowCreate && query.trim() !== '' && !filteredOptions.some(o => o.label.toLowerCase() === query.toLowerCase()),
  )
  const totalNavigable = $derived(enabledOptions.length + (showCreate ? 1 : 0))

  const position = useAnchorPosition(() => wrapper, () => popover, () => ({ placement: 'bottom', offset: 4, enabled: isOpen }))

  function open() {
    if (disabled) return
    isOpen = true
    activeIndex = 0
  }

  function close() {
    isOpen = false
    // Restore the input to the selected option's label, and mark touched.
    const selected = options.find(o => o.value === resolvedValue)
    query = selected ? selected.label : ''
    field?.onBlur()
  }

  /* `value` is bindable: a bound or passed value is written, an uncontrolled
   * one kept internally; the form, when there is one, is told as React tells it. */
  function selectOption(option: ComboboxOption) {
    if (option.disabled) return
    if (value !== undefined) value = option.value
    else internal = option.value
    query = option.label
    onChange?.(option.value)
    field?.onChange(option.value)
    isOpen = false
    input?.focus()
  }

  function handleCreate() {
    const trimmed = query.trim()
    if (!trimmed) return
    onCreate?.(trimmed)
    isOpen = false
    input?.focus()
  }

  // Click outside closes; bound a tick later, as React does.
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

  // While closed, the input shows the selected option's label.
  $effect(() => {
    const selected = options.find(o => o.value === resolvedValue)
    if (selected && !isOpen) query = selected.label
    else if (!resolvedValue && !isOpen) query = ''
  })

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) open()
        else activeIndex = Math.min(activeIndex + 1, totalNavigable - 1)
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
        if (isOpen) { e.preventDefault(); activeIndex = totalNavigable - 1 }
        break
      case 'Enter':
        e.preventDefault()
        if (isOpen && activeIndex >= 0) {
          if (activeIndex < enabledOptions.length) selectOption(enabledOptions[activeIndex])
          else if (showCreate) handleCreate()
        }
        break
      case 'Escape':
        if (isOpen) { e.preventDefault(); close() }
        break
    }
  }

  $effect(() => {
    if (!isOpen || activeIndex < 0 || !listbox) return
    const item = listbox.querySelectorAll('[role="option"]:not([data-disabled])')[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView?.({ block: 'nearest' })
  })

  function handleInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    query = e.currentTarget.value
    activeIndex = 0
    if (!isOpen) isOpen = true
    onSearch?.(query)
  }

  type Entry = { type: 'header'; group: string } | { type: 'option'; option: ComboboxOption }
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
    isOpen && activeIndex >= 0 && activeIndex < enabledOptions.length
      ? optionId(enabledOptions[activeIndex].value)
      : isOpen && showCreate && activeIndex === enabledOptions.length
        ? `${id}-option-create`
        : undefined,
  )

  function highlight(text: string): [string, string, string] | null {
    if (!query) return null
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx < 0) return null
    return [text.slice(0, idx), text.slice(idx, idx + query.length), text.slice(idx + query.length)]
  }
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
  {#if label}<label class="ui-combobox__label" id={labelId} for={inputId}><Content value={label} /></label>{/if}

  <input type="hidden" {name} value={resolvedValue} />

  <div bind:this={wrapper} class="ui-combobox__input-wrapper">
    <input
      bind:this={input}
      id={inputId}
      class="ui-combobox__input"
      type="text"
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls={listboxId}
      aria-activedescendant={activeDescendantId}
      aria-autocomplete="list"
      aria-labelledby={label ? labelId : undefined}
      aria-invalid={resolvedError ? true : undefined}
      aria-describedby={resolvedError ? errorId : undefined}
      {disabled}
      {placeholder}
      value={query}
      oninput={handleInput}
      onfocus={() => { if (!isOpen && !disabled) open() }}
      onkeydown={handleKeyDown}
    />
    <Icon
      name="chevron-down"
      size="sm"
      class="ui-combobox__chevron"
      onclick={() => {
        if (disabled) return
        if (isOpen) close()
        else { open(); input?.focus() }
      }}
    />
  </div>

  {#if isOpen}
    <div
      bind:this={popover}
      class="ui-combobox__dropdown"
      role="listbox"
      id={listboxId}
      aria-labelledby={label ? labelId : undefined}
      use:cssProps={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div bind:this={listbox} class="ui-combobox__options">
        {#if loading}
          <div class="ui-combobox__loading" role="status"><div class="ui-combobox__spinner"></div><span>Loading...</span></div>
        {:else}
          {#each entries as entry}
            {#if entry.type === 'header'}
              <div class="ui-combobox__group-header" role="presentation">{entry.group}</div>
            {:else}
              {@const option = entry.option}
              {@const enabledIdx = enabledOptions.indexOf(option)}
              {@const isActive = enabledIdx === activeIndex}
              {@const isSelected = option.value === resolvedValue}
              {@const parts = highlight(option.label)}
              <!-- Options are aria-activedescendant targets of the input, never focused. -->
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
              <div
                role="option"
                id={optionId(option.value)}
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                class="ui-combobox__option"
                data-active={isActive ? '' : undefined}
                data-selected={isSelected ? '' : undefined}
                data-disabled={option.disabled ? '' : undefined}
                onclick={() => selectOption(option)}
                onmouseenter={() => { if (!option.disabled && enabledIdx >= 0) activeIndex = enabledIdx }}
              >
                {#if option.icon}<span class="ui-combobox__option-icon"><Content value={option.icon} /></span>{/if}
                <span class="ui-combobox__option-content">
                  <span class="ui-combobox__option-label">{#if parts}{parts[0]}<mark class="ui-combobox__match">{parts[1]}</mark>{parts[2]}{:else}{option.label}{/if}</span>
                  {#if option.description}<span class="ui-combobox__option-description">{option.description}</span>{/if}
                </span>
                {#if isSelected}<Icon name="check" size="sm" class="ui-combobox__check" />{/if}
              </div>
            {/if}
          {/each}
          {#if showCreate}
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
            <div
              role="option"
              id={`${id}-option-create`}
              aria-selected={false}
              class="ui-combobox__option ui-combobox__create"
              data-active={activeIndex === enabledOptions.length ? '' : undefined}
              onclick={handleCreate}
              onmouseenter={() => { activeIndex = enabledOptions.length }}
            >Create &ldquo;{query}&rdquo;</div>
          {/if}
          {#if filteredOptions.length === 0 && !showCreate}<div class="ui-combobox__empty">{emptyMessage}</div>{/if}
        {/if}
      </div>
    </div>
  {/if}

  {#if resolvedError}<div class="ui-combobox__error" id={errorId} role="alert">{resolvedError}</div>{/if}
</div>
