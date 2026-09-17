<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { getFormContextOptional } from '../runes/form-context.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLInputAttributes, 'size' | 'value'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLInputElement | null
    name: string
    /** Bindable. Inside a form context, the field's value is used when this is omitted. */
    value?: string | number | null
    label?: string | Snippet
    description?: string
    error?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'filled'
    icon?: string | Snippet
    iconEnd?: string | Snippet
    motion?: MotionLevel
    maxLength?: number
    showCount?: boolean
    clearable?: boolean
    onClear?: () => void
    required?: boolean
    disabled?: boolean
    classNames?: Partial<Record<'root' | 'label' | 'field' | 'icon' | 'iconEnd' | 'description' | 'error', string>>
    class?: string
  }

  let {
    name, value = $bindable(), label, description, error: errorProp, size = 'md', variant = 'default', icon, iconEnd, motion,
    maxLength, showCount, clearable, onClear, required, disabled, classNames, class: className, id: idProp,
    oninput, onblur, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const cls = makeCls('form-input')
  const uid = $props.id()
  const inputId = $derived(idProp || `form-input-${uid}`)

  const form = getFormContextOptional()
  const field = $derived(form ? form.getFieldProps(name) : null)

  // Explicit props override the form context, as in React.
  const current = $derived(value !== undefined ? value : field?.value ?? undefined)
  const error = $derived(errorProp !== undefined ? errorProp : field && field.touched ? field.error : undefined)

  const errorId = $derived(error ? `${inputId}-error` : undefined)
  const descriptionId = $derived(description ? `${inputId}-description` : undefined)
  const describedBy = $derived([descriptionId, errorId].filter(Boolean).join(' ') || undefined)

  const valueLength = $derived((typeof current === 'string' ? current : typeof current === 'number' ? String(current) : '').length)
  const showCounter = $derived(showCount || maxLength !== undefined)
  const atLimit = $derived(maxLength !== undefined && valueLength >= maxLength)

  /* A form-managed field writes to the form; otherwise the typed text goes to
   * `value`, so bind:value is two-way even from an undefined start. React reads
   * the counter and clear button from the value prop alone, so an uncontrolled
   * React input never counts or shows clear; here they follow typing. */
  function handleInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    oninput?.(e)
    if (field && value === undefined) field.onChange(e.currentTarget.value)
    else value = e.currentTarget.value
  }

  function handleBlur(e: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) {
    onblur?.(e)
    field?.onBlur()
  }
</script>

<div
  class={cn(cls('root'), classNames?.root, className)}
  data-size={size}
  data-variant={variant}
  data-motion={motionLevel()}
  data-invalid={error ? '' : undefined}
  data-disabled={disabled ? '' : undefined}
  data-has-icon={icon ? '' : undefined}
  data-has-icon-end={iconEnd || clearable ? '' : undefined}
>
  {#if label}
    <label for={inputId} class={cn('ui-form-input__label', classNames?.label)}><Content value={label} />{#if required}<span class="ui-form-input__required" aria-hidden="true">*</span>{/if}</label>
  {/if}

  <div class="ui-form-input__field-wrapper">
    {#if icon}<span class={cn('ui-form-input__icon', classNames?.icon)} aria-hidden="true"><Content value={icon} /></span>{/if}

    <input
      id={inputId}
      {name}
      class={cn('ui-form-input__field', classNames?.field)}
      {disabled}
      value={current}
      oninput={handleInput}
      onblur={handleBlur}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      {required}
      maxlength={maxLength}
      bind:this={ref}
      {...rest}
    />

    {#if iconEnd}<span class={cn('ui-form-input__icon-end', classNames?.iconEnd)} aria-hidden="true"><Content value={iconEnd} /></span>{/if}

    {#if clearable && valueLength > 0}
      <button type="button" class="ui-form-input__clear" onclick={() => onClear?.()} aria-label="Clear input">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    {/if}
  </div>

  {#if description}<span id={descriptionId} class={cn('ui-form-input__description', classNames?.description)}>{description}</span>{/if}
  {#if error}<span id={errorId} class={cn('ui-form-input__error', classNames?.error)} role="alert">{error}</span>{/if}
  {#if showCounter}
    <span class="ui-form-input__counter" data-at-limit={atLimit ? '' : undefined}>{maxLength !== undefined ? `${valueLength}/${maxLength}` : valueLength}</span>
  {/if}
</div>
