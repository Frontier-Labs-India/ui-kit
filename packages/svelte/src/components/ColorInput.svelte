<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { hexToHsl, hslToHex, isValidHex, normalizeHex } from '../lib/color-input-math.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    name: string
    /** Bindable hex colour. Omit it for an uncontrolled input that starts from defaultValue. */
    value?: string
    defaultValue?: string
    onChange?: (color: string) => void
    label?: string | Snippet
    error?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    swatches?: string[]
    showInput?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    name, value = $bindable(), defaultValue, onChange, label, error, disabled = false, size = 'md', swatches, showInput = true,
    motion, class: className, ...rest
  }: Props = $props()

  const cls = makeCls('color-input')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const stableId = `color-input-${uid}`
  const errorId = $derived(error ? `${stableId}-error` : undefined)

  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue || '#000000')
  const current = $derived(value !== undefined ? value : internal)
  let isOpen = $state(false)
  // svelte-ignore state_referenced_locally
  let hexText = $state(current)
  // svelte-ignore state_referenced_locally
  const initial = hexToHsl(current)
  let hue = $state(initial.h)
  let saturation = $state(initial.s)
  let lightness = $state(initial.l)
  let popover = $state<HTMLDivElement | null>(null)
  let slArea = $state<HTMLDivElement | null>(null)

  // A changed controlled value updates the text and the picker.
  $effect(() => {
    if (value === undefined || !value) return
    const v = value
    hexText = v
    const next = hexToHsl(v)
    hue = next.h
    saturation = next.s
    lightness = next.l
  })

  function update(hex: string) {
    if (value !== undefined) value = hex
    else internal = hex
    hexText = hex
    onChange?.(hex)
  }

  function setHsl(hex: string) {
    const next = hexToHsl(hex)
    hue = next.h
    saturation = next.s
    lightness = next.l
  }

  // Opening focuses the saturation/lightness area.
  $effect(() => {
    if (isOpen && slArea) slArea.focus()
  })

  // A mousedown outside the popover (and outside the trigger) closes it.
  $effect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (popover && !popover.contains(target)) {
        const trigger = popover.parentElement?.querySelector('.ui-color-input__trigger')
        if (trigger && trigger.contains(target)) return
        isOpen = false
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  })

  function onHexBlur() {
    const trimmed = hexText.trim()
    if (isValidHex(trimmed)) {
      const normalized = normalizeHex(trimmed)
      setHsl(normalized)
      update(normalized)
    } else {
      hexText = current
    }
  }

  function onSLKeyDown(e: KeyboardEvent) {
    let s = saturation
    let l = lightness
    switch (e.key) {
      case 'ArrowRight': s = Math.min(100, saturation + 1); break
      case 'ArrowLeft': s = Math.max(0, saturation - 1); break
      case 'ArrowUp': l = Math.min(100, lightness + 1); break
      case 'ArrowDown': l = Math.max(0, lightness - 1); break
      case 'Home': s = 0; l = 0; break
      case 'End': s = 100; l = 100; break
      default: return
    }
    e.preventDefault()
    saturation = s
    lightness = l
    update(hslToHex(hue, s, l))
  }

  function onSLPointerDown(e: PointerEvent) {
    if (disabled || !slArea) return
    const area = slArea
    area.setPointerCapture?.(e.pointerId)
    const at = (x: number, y: number) => {
      const rect = area.getBoundingClientRect()
      const s = Math.round(Math.max(0, Math.min(1, (x - rect.left) / rect.width)) * 100)
      const l = Math.round((1 - Math.max(0, Math.min(1, (y - rect.top) / rect.height))) * 100)
      saturation = s
      lightness = l
      update(hslToHex(hue, s, l))
    }
    at(e.clientX, e.clientY)
    const onMove = (ev: PointerEvent) => at(ev.clientX, ev.clientY)
    const onUp = () => {
      area.removeEventListener('pointermove', onMove)
      area.removeEventListener('pointerup', onUp)
    }
    area.addEventListener('pointermove', onMove)
    area.addEventListener('pointerup', onUp)
  }

  const slBackground = $derived(`linear-gradient(to top, #000, transparent),
      linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`)
</script>

<div class={cn(cls('root'), className)} data-size={size} data-motion={motionLevel()} data-disabled={disabled ? '' : undefined} data-invalid={error ? '' : undefined} {...rest}>
  {#if label}<label class="ui-color-input__label" for={`${stableId}-hex`}><Content value={label} /></label>{/if}
  <div class="ui-color-input__row">
    <div
      class="ui-color-input__trigger"
      role="button"
      tabindex={disabled ? -1 : 0}
      aria-label={`Choose color: ${current}`}
      aria-expanded={isOpen}
      onclick={() => { if (!disabled) isOpen = !isOpen }}
      onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) isOpen = !isOpen } }}
    >
      <div class="ui-color-input__swatch" use:cssProps={{ 'background-color': current }}></div>
    </div>
    {#if showInput}
      <input
        type="text"
        id={`${stableId}-hex`}
        class="ui-color-input__hex-input"
        {name}
        value={hexText}
        {disabled}
        oninput={e => { hexText = e.currentTarget.value }}
        onblur={onHexBlur}
        aria-label="Hex color value"
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        spellcheck={false}
        autocomplete="off"
      />
    {/if}
  </div>
  {#if isOpen}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_interactive_supports_focus -->
    <div bind:this={popover} class="ui-color-input__popover" role="dialog" aria-label="Color picker" onkeydown={e => { if (e.key === 'Escape') { e.preventDefault(); isOpen = false } }}>
      <!-- React's slider has aria-valuetext but no aria-valuenow (inherited); kept for parity. -->
      <!-- svelte-ignore a11y_role_has_required_aria_props -->
      <div
        bind:this={slArea}
        class="ui-color-input__sl-area"
        use:cssProps={{ background: slBackground }}
        onpointerdown={onSLPointerDown}
        onkeydown={onSLKeyDown}
        role="slider"
        aria-label="Saturation and lightness"
        aria-valuetext={`Saturation ${saturation}%, Lightness ${lightness}%`}
        tabindex={0}
      >
        <div class="ui-color-input__sl-thumb" use:cssProps={{ 'inset-inline-start': `${saturation}%`, 'inset-block-start': `${100 - lightness}%`, 'background-color': current }}></div>
      </div>
      <input type="range" class="ui-color-input__hue-slider" min={0} max={360} value={hue} oninput={e => { hue = Number(e.currentTarget.value); update(hslToHex(hue, saturation, lightness)) }} aria-label="Hue" />
      {#if swatches && swatches.length > 0}
        <div class="ui-color-input__swatches" role="group" aria-label="Preset colors">
          {#each swatches as color, i (`${color}-${i}`)}
            <button type="button" class="ui-color-input__preset-swatch" use:cssProps={{ 'background-color': color }} onclick={() => { const n = normalizeHex(color); setHsl(n); update(n) }} aria-label={`Select color ${color}`}></button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
  {#if error}<span id={errorId} class="ui-color-input__error" role="alert">{error}</span>{/if}
</div>
