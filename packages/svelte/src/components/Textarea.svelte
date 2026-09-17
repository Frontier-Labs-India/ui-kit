<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { getFormContextOptional } from '../runes/form-context.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** Bindable. Omit it for an uncontrolled textarea that starts from defaultValue. */
    value?: string
    defaultValue?: string
    onChange?: (e: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) => void
    label?: string
    description?: string
    error?: string
    placeholder?: string
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    disabled?: boolean
    required?: boolean
    autoResize?: boolean
    minRows?: number
    maxRows?: number
    maxLength?: number
    showCount?: boolean
    resize?: 'none' | 'vertical' | 'horizontal' | 'both'
    motion?: MotionLevel
    class?: string
  }

  let {
    value = $bindable(), defaultValue, onChange, label, description, error: errorProp, placeholder, name, size = 'md',
    disabled, required, autoResize, minRows = 3, maxRows, maxLength, showCount, resize = 'vertical', motion,
    class: className, id: idProp, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const cls = makeCls('textarea')
  const uid = $props.id()
  const inputId = $derived(idProp || `textarea-${uid}`)
  let textarea: HTMLTextAreaElement | undefined

  const form = getFormContextOptional()
  const field = $derived(form && name ? form.getFieldProps(name) : null)
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue ?? '')

  const current = $derived(value !== undefined ? value : field ? ((field.value as string) ?? '') : internal)
  const error = $derived(errorProp !== undefined ? errorProp : field && field.touched ? field.error : undefined)
  const errorId = $derived(error ? `${inputId}-error` : undefined)
  const descriptionId = $derived(description ? `${inputId}-description` : undefined)
  const describedBy = $derived([descriptionId, errorId].filter(Boolean).join(' ') || undefined)
  const valueLength = $derived((typeof current === 'string' ? current : '').length)
  const showCounter = $derived(showCount || maxLength !== undefined)
  const atLimit = $derived(maxLength !== undefined && valueLength >= maxLength)

  /* Grows the textarea to its content between minRows and maxRows. Writes go
   * through style properties, as React's do, which style-src 'self' allows. */
  $effect(() => {
    void current
    const el = textarea
    if (!el || !autoResize) return
    el.style.height = 'auto'
    const computed = window.getComputedStyle(el)
    const parsed = parseFloat(computed.lineHeight)
    const lineHeight = isNaN(parsed) ? parseFloat(computed.fontSize) * 1.5 : parsed
    const paddingBlock = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom)
    const borderBlock = parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth)
    const minHeight = lineHeight * minRows + paddingBlock + borderBlock
    const maxHeight = maxRows ? lineHeight * maxRows + paddingBlock + borderBlock : Infinity
    const scrollHeight = el.scrollHeight
    el.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`
    el.style.overflow = maxRows && scrollHeight > maxHeight ? 'auto' : 'hidden'
  })

  // Same rule as FormInput: a form-managed field writes to the form, otherwise
  // the text goes to `value` when it is bound or passed, or to internal state.
  function handleInput(e: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) {
    onChange?.(e)
    const next = e.currentTarget.value
    if (value !== undefined) value = next
    else {
      internal = next
      field?.onChange(next)
    }
  }
</script>

<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-resize={autoResize ? 'none' : resize}
  data-invalid={error ? '' : undefined}
  data-disabled={disabled ? '' : undefined}
  {...rest}
>
  {#if label}
    <label for={inputId} class="ui-textarea__label">{label}{#if required}<span class="ui-textarea__required" aria-hidden="true">*</span>{/if}</label>
  {/if}
  <div class="ui-textarea__field-wrapper">
    <textarea
      bind:this={textarea}
      id={inputId}
      {name}
      class="ui-textarea__field"
      {disabled}
      {placeholder}
      value={current}
      oninput={handleInput}
      onblur={() => field?.onBlur()}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      {required}
      maxlength={maxLength}
      rows={minRows}
      data-auto-resize={autoResize ? '' : undefined}
    ></textarea>
  </div>
  {#if description}<span id={descriptionId} class="ui-textarea__description">{description}</span>{/if}
  {#if error}<span id={errorId} class="ui-textarea__error" role="alert">{error}</span>{/if}
  {#if showCounter}
    <div class="ui-textarea__footer">
      <span class="ui-textarea__counter" data-at-limit={atLimit ? '' : undefined}>{maxLength !== undefined ? `${valueLength}/${maxLength}` : valueLength}</span>
    </div>
  {/if}
</div>
