<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** Bindable. */
    tags: string[]
    onChange?: (tags: string[]) => void
    placeholder?: string
    maxTags?: number
    allowDuplicates?: boolean
    validate?: (tag: string) => boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    error?: string
    disabled?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    tags = $bindable(), onChange, placeholder, maxTags, allowDuplicates = false, validate, size = 'md', error,
    disabled = false, motion, class: className, 'aria-label': ariaLabel, ...rest
  }: Props = $props()

  const cls = makeCls('tag-input')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const errorId = `tag-input-${uid}-error`
  let text = $state('')

  function commit(next: string[]) {
    tags = next
    onChange?.(next)
  }

  function add(raw: string): boolean {
    const tag = raw.trim().replace(/,$/g, '')
    if (!tag) return false
    if (!allowDuplicates && tags.includes(tag)) return false
    if (maxTags !== undefined && tags.length >= maxTags) return false
    if (validate && !validate(tag)) return false
    commit([...tags, tag])
    return true
  }

  function keydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      const val = text.trim().replace(/,$/g, '')
      if (val) {
        e.preventDefault()
        if (add(val)) text = ''
      }
    } else if (e.key === 'Backspace' && !text && tags.length > 0) {
      commit(tags.filter((_, i) => i !== tags.length - 1))
    }
  }
</script>

<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-invalid={error ? '' : undefined}
  data-disabled={disabled ? '' : undefined}
  aria-describedby={error ? errorId : undefined}
  {...rest}
>
  <div class="ui-tag-input__wrapper">
    {#each tags as tag, i (`${tag}-${i}`)}
      <span class="ui-tag-input__tag">
        <span>{tag}</span>
        {#if !disabled}
          <button type="button" class="ui-tag-input__tag-remove" onclick={() => commit(tags.filter((_, j) => j !== i))} aria-label={`Remove ${tag}`} tabindex={-1}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        {/if}
      </span>
    {/each}
    <input type="text" class="ui-tag-input__field" bind:value={text} {placeholder} {disabled} aria-label={ariaLabel} onkeydown={keydown} />
  </div>
  {#if error}<span id={errorId} class="ui-tag-input__error" role="alert">{error}</span>{/if}
</div>
