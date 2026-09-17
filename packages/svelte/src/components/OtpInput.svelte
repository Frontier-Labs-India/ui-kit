<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    length?: number
    /** Bindable. */
    value?: string
    onChange?: (value: string) => void
    onComplete?: (value: string) => void
    type?: 'number' | 'text'
    error?: string
    disabled?: boolean
    autoFocus?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    motion?: MotionLevel
    class?: string
  }

  let {
    length = 6, value = $bindable(), onChange, onComplete, type = 'number', error, disabled = false, autoFocus = false,
    size = 'md', motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('otp-input')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const stableId = `otp-${uid}`
  let internal = $state('')
  const current = $derived(value !== undefined ? value : internal)
  const digits = $derived(current.split('').concat(Array(length).fill('')).slice(0, length))
  const inputs: (HTMLInputElement | null)[] = []
  const inputRef = (node: HTMLInputElement, i: number) => {
    inputs[i] = node
    return { destroy: () => { if (inputs[i] === node) inputs[i] = null } }
  }

  $effect(() => {
    if (autoFocus) inputs[0]?.focus()
  })

  /* `value` is bindable, as every form value here; onChange and onComplete
   * fire either way. */
  function update(next: string) {
    if (value !== undefined) value = next
    else internal = next
    onChange?.(next)
    if (next.length === length) onComplete?.(next)
  }

  function handleInput(i: number, e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const input = e.currentTarget
    const char = input.value.slice(-1)
    if (type === 'number' && !/^\d$/.test(char) && char !== '') {
      // Rejected: put back what the value says, which Svelte will not re-apply.
      input.value = digits[i]
      return
    }
    const chars = current.split('')
    while (chars.length < i) chars.push('')
    chars[i] = char
    update(chars.join('').replace(/\s/g, ''))
    input.value = char
    if (char && i < length - 1) inputs[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: KeyboardEvent) {
    if (e.key !== 'Backspace') return
    const chars = current.split('')
    if (chars[i]) {
      chars[i] = ''
      update(chars.join('').replace(/\s+$/, ''))
    } else if (i > 0) {
      inputs[i - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault()
    const pasted = (e.clipboardData?.getData('text') ?? '').slice(0, length)
    if (type === 'number' && !/^\d+$/.test(pasted)) return
    update(pasted)
    inputs[Math.min(pasted.length, length - 1)]?.focus()
  }

  const errorId = $derived(error ? `${stableId}-error` : undefined)
</script>

<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-invalid={error ? '' : undefined}
  role="group"
  aria-describedby={errorId}
  bind:this={ref}
  {...rest}
>
  <div class="ui-otp-input__digits">
    {#each digits as digit, i}
      <input
        use:inputRef={i}
        type="text"
        inputmode={type === 'number' ? 'numeric' : 'text'}
        class="ui-otp-input__digit"
        value={digit}
        maxlength={1}
        {disabled}
        autocomplete="one-time-code"
        aria-label={`Digit ${i + 1} of ${length}`}
        aria-invalid={error ? true : undefined}
        oninput={e => handleInput(i, e)}
        onkeydown={e => handleKeyDown(i, e)}
        onpaste={handlePaste}
      />
    {/each}
  </div>
  {#if error}<span id={errorId} class="ui-otp-input__error" role="alert">{error}</span>{/if}
</div>
