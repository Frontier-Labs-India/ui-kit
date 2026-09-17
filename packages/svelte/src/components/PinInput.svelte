<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    length?: number
    /** Bindable. Omit it for an uncontrolled input. */
    value?: string
    onChange?: (value: string) => void
    onComplete?: (value: string) => void
    mask?: boolean
    type?: 'number' | 'alphanumeric'
    placeholder?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    error?: boolean
    disabled?: boolean
    oneTimeCode?: boolean
    manageFocus?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    length = 4, value = $bindable(), onChange, onComplete, mask = true, type = 'number', placeholder = '○', size = 'md',
    error = false, disabled = false, oneTimeCode = false, manageFocus = true, motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('pin-input')
  const motionLevel = getMotionLevel(() => motion)
  let internal = $state('')
  const current = $derived(value ?? internal)
  const digits = $derived(current.split('').concat(Array(length).fill('')).slice(0, length))
  const inputs: (HTMLInputElement | null)[] = []
  const valid = (c: string) => (type === 'number' ? /^\d$/ : /^[a-zA-Z0-9]$/).test(c)

  function update(next: string) {
    if (value !== undefined) value = next
    else internal = next
    onChange?.(next)
    if (next.length === length) onComplete?.(next)
  }

  function input(i: number, e: Event & { currentTarget: HTMLInputElement }) {
    const char = e.currentTarget.value.slice(-1)
    if (char !== '' && !valid(char)) {
      /* React re-renders a controlled input to its state, so a rejected character
       * disappears. Svelte does not re-apply an unchanged value — restore it. */
      e.currentTarget.value = digits[i]
      return
    }
    const chars = current.split('')
    while (chars.length < i) chars.push('')
    chars[i] = char
    update(chars.join('').replace(/\s/g, ''))
    e.currentTarget.value = char
    if (manageFocus && char && i < length - 1) inputs[i + 1]?.focus()
  }

  function keydown(i: number, e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      const chars = current.split('')
      if (chars[i]) {
        chars[i] = ''
        update(chars.join('').replace(/\s+$/, ''))
      } else if (manageFocus && i > 0) inputs[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && manageFocus && i > 0) inputs[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && manageFocus && i < length - 1) inputs[i + 1]?.focus()
  }

  function paste(e: ClipboardEvent) {
    e.preventDefault()
    const pasted = (e.clipboardData?.getData('text') ?? '').slice(0, length)
    if (!(type === 'number' ? /^\d+$/ : /^[a-zA-Z0-9]+$/).test(pasted)) return
    update(pasted)
    if (manageFocus) inputs[Math.min(pasted.length, length - 1)]?.focus()
  }

  // `||`, as React: an empty aria-label also falls back.
  const ariaLabel = $derived(((rest as Record<string, unknown>)['aria-label'] as string) || 'PIN input')
</script>

<div class={cn(cls('root'), className)} data-size={size} data-motion={motionLevel()} data-error={error ? '' : undefined} role="group" aria-label={ariaLabel} bind:this={ref} {...rest}>
  <div class="ui-pin-input__digits">
    {#each digits as digit, i (i)}
      <input
        bind:this={inputs[i]}
        type="text"
        inputmode={type === 'number' ? 'numeric' : 'text'}
        class="ui-pin-input__digit"
        value={digit}
        maxlength={1}
        {disabled}
        {placeholder}
        autocomplete={oneTimeCode ? 'one-time-code' : 'off'}
        aria-label={`PIN digit ${i + 1} of ${length}`}
        aria-invalid={error || undefined}
        data-masked={mask && digit ? true : undefined}
        oninput={e => input(i, e)}
        onkeydown={e => keydown(i, e)}
        onpaste={paste}
      />
    {/each}
  </div>
</div>
