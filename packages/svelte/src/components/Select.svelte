<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface SelectOption {
    value: string
    label: string
    disabled?: boolean
    icon?: string | Snippet
    group?: string
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import Icon from '../lib/Icon.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { portal } from '../actions/portal.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { getFormContextOptional } from '../runes/form-context.js'
  import { useAnchorPosition } from '../runes/anchor-position.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    name: string
    options: SelectOption[]
    /** Bindable. A string, or a string[] when `multiple`. */
    value?: string | string[]
    defaultValue?: string | string[]
    onChange?: (value: string | string[]) => void
    placeholder?: string
    label?: string | Snippet
    error?: string
    disabled?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    searchable?: boolean
    clearable?: boolean
    multiple?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    name, options, value = $bindable(), defaultValue, onChange, placeholder = 'Select...', label, error: errorProp, disabled,
    size = 'md', searchable, clearable, multiple, motion, class: className, ...rest
  }: Props = $props()

  const cls = makeCls('select')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const id = `select-${uid}`
  const listboxId = `${id}-listbox`
  const labelId = `${id}-label`
  const errorId = `${id}-error`

  const form = getFormContextOptional()
  const field = $derived(form ? form.getFieldProps(name) : null)

  let isOpen = $state(false)
  // svelte-ignore state_referenced_locally
  let internal = $state<string | string[]>(defaultValue ?? (multiple ? [] : ''))
  let activeIndex = $state(-1)
  let searchQuery = $state('')

  const resolvedValue = $derived(
    value !== undefined ? value : field ? ((field.value as string | string[]) ?? (multiple ? [] : '')) : internal,
  )
  const isValueSelected = (v: string) => (multiple ? Array.isArray(resolvedValue) && resolvedValue.includes(v) : resolvedValue === v)
  const resolvedError = $derived(errorProp !== undefined ? errorProp : field && field.touched ? field.error : undefined)

  let trigger = $state<HTMLButtonElement | null>(null)
  let listbox = $state<HTMLDivElement | null>(null)
  let popover = $state<HTMLDivElement | null>(null)
  let root = $state<HTMLDivElement | null>(null)

  const filteredOptions = $derived(
    searchable && searchQuery ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase())) : options,
  )
  const enabledOptions = $derived(filteredOptions.filter(o => !o.disabled))

  const position = useAnchorPosition(() => trigger, () => popover, () => ({ placement: 'bottom', align: 'start', offset: 4, enabled: isOpen }))

  function open() {
    if (disabled) return
    isOpen = true
    searchQuery = ''
    const selectedIdx = multiple ? 0 : enabledOptions.findIndex(o => o.value === resolvedValue)
    activeIndex = selectedIdx >= 0 ? selectedIdx : 0
  }

  function close() {
    isOpen = false
    trigger?.focus()
    field?.onBlur()
  }

  function commit(next: string | string[]) {
    if (value !== undefined) value = next
    else internal = next
    onChange?.(next)
    field?.onChange(next)
  }

  function selectOption(option: SelectOption) {
    if (option.disabled) return
    if (multiple) {
      const current = Array.isArray(resolvedValue) ? resolvedValue : []
      // Stays open for picking several.
      commit(current.includes(option.value) ? current.filter(v => v !== option.value) : [...current, option.value])
    } else {
      commit(option.value)
      close()
    }
  }

  function handleClear(e: MouseEvent) {
    e.stopPropagation()
    commit(multiple ? [] : '')
  }

  // Outside click closes; the portalled dropdown counts as inside.
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

  function handleListboxKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); activeIndex = Math.min(activeIndex + 1, enabledOptions.length - 1); break
      case 'ArrowUp': e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); break
      case 'Home': e.preventDefault(); activeIndex = 0; break
      case 'End': e.preventDefault(); activeIndex = enabledOptions.length - 1; break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < enabledOptions.length) selectOption(enabledOptions[activeIndex])
        break
      case ' ':
        // In searchable mode a space types into the search box.
        if (!searchable) {
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < enabledOptions.length) selectOption(enabledOptions[activeIndex])
        }
        break
      case 'Escape': e.preventDefault(); close(); break
      default:
        // Typeahead on the first character, when not searchable.
        if (e.key.length === 1 && !searchable) {
          const match = enabledOptions.findIndex(o => o.label.toLowerCase().startsWith(e.key.toLowerCase()))
          if (match >= 0) activeIndex = match
        }
    }
  }

  $effect(() => {
    if (!isOpen || activeIndex < 0 || !listbox) return
    const item = listbox.querySelectorAll('[role="option"]:not([data-disabled])')[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView?.({ block: 'nearest' })
  })

  // Focus the search box, or the listbox, when opened.
  $effect(() => {
    if (!isOpen || !popover) return
    if (searchable) popover.querySelector<HTMLInputElement>('.ui-select__search')?.focus()
    else popover.focus()
  })

  const selectedOption = $derived(multiple ? undefined : options.find(o => o.value === resolvedValue))
  const selectedOptions = $derived(multiple ? options.filter(o => Array.isArray(resolvedValue) && resolvedValue.includes(o.value)) : [])
  const hasValue = $derived(multiple ? Array.isArray(resolvedValue) && resolvedValue.length > 0 : !!resolvedValue)
</script>

<div
  bind:this={root}
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-open={isOpen ? '' : undefined}
  data-invalid={resolvedError ? '' : undefined}
  data-disabled={disabled ? '' : undefined}
  data-multiple={multiple ? '' : undefined}
  {...rest}
>
  <!-- React renders this label without `for`: the trigger is named by aria-labelledby. -->
  <!-- svelte-ignore a11y_label_has_associated_control -->
  {#if label}<label class="ui-select__label" id={labelId}><Content value={label} /></label>{/if}

  {#if multiple && Array.isArray(resolvedValue)}
    {#each resolvedValue as v}<input type="hidden" {name} value={v} />{/each}
  {:else}
    <input type="hidden" {name} value={resolvedValue as string} />
  {/if}

  <button
    bind:this={trigger}
    type="button"
    class="ui-select__trigger"
    role="combobox"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    aria-controls={isOpen ? listboxId : undefined}
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
    <span class="ui-select__value">
      {#if multiple}
        {#if selectedOptions.length > 0}
          <span class="ui-select__multi-value">
            {#if selectedOptions.length <= 3}
              {#each selectedOptions as o}<span class="ui-select__tag">{o.label}</span>{/each}
            {:else}
              <span class="ui-select__tag">{selectedOptions[0].label}</span><span class="ui-select__tag">{selectedOptions[1].label}</span><span class="ui-select__multi-count">+{selectedOptions.length - 2} more</span>
            {/if}
          </span>
        {:else}
          <span class="ui-select__placeholder">{placeholder}</span>
        {/if}
      {:else}
        {#if selectedOption?.icon}<Content value={selectedOption.icon} />{/if}{#if selectedOption}{selectedOption.label}{:else}<span class="ui-select__placeholder">{placeholder}</span>{/if}
      {/if}
    </span>
    {#if clearable && hasValue}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <span class="ui-select__clear" role="button" tabindex={-1} aria-label="Clear selection" onclick={handleClear}><Icon name="x" size="sm" /></span>
    {/if}
    <Icon name="chevron-down" size="sm" class="ui-select__chevron" />
  </button>

  {#if isOpen}
    <div
      use:portal
      bind:this={popover}
      class="ui-select__dropdown"
      role="listbox"
      id={listboxId}
      aria-labelledby={label ? labelId : undefined}
      aria-multiselectable={multiple || undefined}
      tabindex={-1}
      onkeydown={handleListboxKeyDown}
      use:cssProps={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        'min-inline-size': position.width > 0 ? `${position.width}px` : null,
      }}
    >
      {#if searchable}
        <input
          class="ui-select__search"
          placeholder="Search..."
          value={searchQuery}
          oninput={e => { searchQuery = e.currentTarget.value; activeIndex = 0 }}
          onkeydown={e => {
            /* React also handles this in the listbox, where the event bubbles to,
             * so each key typed here is handled twice (one ArrowDown moves two
             * options; confirmed against React). Not reproducible faithfully —
             * React's second call sees stale batched state, Svelte's would not —
             * so the key is handled once here. Recorded as a React defect. */
            e.stopPropagation()
            handleListboxKeyDown(e)
          }}
        />
      {/if}
      <div bind:this={listbox} class="ui-select__options">
        {#each filteredOptions as option}
          {@const enabledIdx = enabledOptions.indexOf(option)}
          {@const isSelected = isValueSelected(option.value)}
          <!-- Options are chosen through the listbox's key handling, as in React. -->
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
          <div
            role="option"
            aria-selected={isSelected}
            aria-disabled={option.disabled || undefined}
            class="ui-select__option"
            data-active={enabledIdx === activeIndex ? '' : undefined}
            data-selected={isSelected ? '' : undefined}
            data-disabled={option.disabled ? '' : undefined}
            onclick={() => selectOption(option)}
            onmouseenter={() => { if (!option.disabled && enabledIdx >= 0) activeIndex = enabledIdx }}
          >
            {#if option.icon}<span class="ui-select__option-icon"><Content value={option.icon} /></span>{/if}{option.label}{#if isSelected}<Icon name="check" size="sm" class="ui-select__check" />{/if}
          </div>
        {/each}
        {#if filteredOptions.length === 0}<div class="ui-select__empty">No options found</div>{/if}
      </div>
    </div>
  {/if}

  {#if resolvedError}<div class="ui-select__error" id={errorId} role="alert">{resolvedError}</div>{/if}
</div>
