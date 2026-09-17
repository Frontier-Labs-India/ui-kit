<script module lang="ts">
  export interface CropResult {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    zoom: number
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { untrack } from 'svelte'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    src: string
    aspectRatio?: number
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    onCrop?: (result: CropResult) => void
    showGrid?: boolean
    showZoom?: boolean
    showRotate?: boolean
    rounded?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    src, aspectRatio, minWidth = 20, minHeight = 20, maxWidth, maxHeight, onCrop, showGrid = true, showZoom = true,
    showRotate = true, rounded = false, motion, class: className, ...rest
  }: Props = $props()

  type Box = { x: number; y: number; width: number; height: number }
  type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
  const CURSORS: Record<Handle, string> = { nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize', se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize' }
  const ROTATE_LEFT = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10a6 6 0 1 1 1.5 4M4 10V6M4 10h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  const ROTATE_RIGHT = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16 10a6 6 0 1 0-1.5 4M16 10V6M16 10h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

  const cls = makeCls('cropper')
  const motionLevel = getMotionLevel(() => motion)
  let container = $state<HTMLDivElement | null>(null)
  let image = $state<HTMLImageElement | null>(null)
  let loaded = $state(false)
  let imageSize = { width: 0, height: 0 }
  let containerSize = $state({ width: 0, height: 0 })
  let zoom = $state(1)
  let rotation = $state(0)
  let crop = $state<Box>({ x: 0, y: 0, width: 0, height: 0 })
  let drag: { type: 'move' | 'resize'; handle?: Handle; startX: number; startY: number; startCrop: Box } | null = null

  /* On load: centre a crop covering 80% of the container (height from the
   * aspect ratio when given), then report it in image pixels a tick later. */
  function onLoad() {
    if (!image || !container) return
    const img = image
    const cW = container.clientWidth
    const cH = container.clientHeight || cW * 0.75
    imageSize = { width: img.naturalWidth, height: img.naturalHeight }
    containerSize = { width: cW, height: cH }
    const w = Math.min(cW * 0.8, cW)
    const h = Math.min(aspectRatio ? (cW * 0.8) / aspectRatio : cH * 0.8, cH)
    const initial = { x: (cW - w) / 2, y: (cH - h) / 2, width: w, height: h }
    crop = initial
    loaded = true
    setTimeout(() => {
      if (!container) return
      const contW = container.clientWidth
      const contH = container.clientHeight
      if (contW === 0 || contH === 0) return
      const sx = img.naturalWidth / contW
      const sy = img.naturalHeight / contH
      onCrop?.({ x: Math.round(initial.x * sx), y: Math.round(initial.y * sy), width: Math.round(initial.width * sx), height: Math.round(initial.height * sy), rotation: 0, zoom: 1 })
    }, 0)
  }

  $effect(() => {
    void zoom
    void rotation
    if (!loaded || !container) return
    containerSize = { width: container.clientWidth, height: container.clientHeight }
  })

  // Reports the crop in original image pixels, undoing zoom.
  function emit(c: Box) {
    if (!loaded || !container) return
    const cW = container.clientWidth
    const cH = container.clientHeight
    if (cW === 0 || cH === 0) return
    const sx = imageSize.width / cW
    const sy = imageSize.height / cH
    onCrop?.({ x: Math.round((c.x / zoom) * sx), y: Math.round((c.y / zoom) * sy), width: Math.round((c.width / zoom) * sx), height: Math.round((c.height / zoom) * sy), rotation, zoom })
  }

  // Zoom or rotation changes report the crop, as React's effect does.
  $effect(() => {
    void zoom
    void rotation
    untrack(() => { if (loaded) emit(crop) })
  })

  function constrain(c: Box): Box {
    const cW = containerSize.width || 1
    const cH = containerSize.height || 1
    const mxW = maxWidth ? Math.min(maxWidth, cW) : cW
    const mxH = maxHeight ? Math.min(maxHeight, cH) : cH
    let { x, y, width, height } = c
    width = clamp(width, minWidth, mxW)
    height = clamp(height, minHeight, mxH)
    if (aspectRatio) {
      height = width / aspectRatio
      if (height > mxH) { height = mxH; width = height * aspectRatio }
      if (height < minHeight) { height = minHeight; width = height * aspectRatio }
    }
    return { x: clamp(x, 0, cW - width), y: clamp(y, 0, cH - height), width, height }
  }

  function start(e: PointerEvent, type: 'move' | 'resize', handle?: Handle) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    drag = { type, handle, startX: e.clientX, startY: e.clientY, startCrop: { ...crop } }
  }

  function onMove(e: PointerEvent) {
    if (!drag) return
    const { type, handle, startX, startY, startCrop } = drag
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (type === 'move') {
      crop = constrain({ ...startCrop, x: startCrop.x + dx, y: startCrop.y + dy })
    } else if (handle) {
      let { x, y, width, height } = startCrop
      if (handle.includes('e')) width = startCrop.width + dx
      if (handle.includes('w')) { width = startCrop.width - dx; x = startCrop.x + dx }
      if (handle.includes('s')) height = startCrop.height + dy
      if (handle.includes('n')) { height = startCrop.height - dy; y = startCrop.y + dy }
      if (aspectRatio) {
        if (handle === 'n' || handle === 's') width = height * aspectRatio
        else height = width / aspectRatio
      }
      crop = constrain({ x, y, width, height })
    }
  }

  function onUp() {
    if (!drag) return
    drag = null
    emit(crop)
  }

  const overlay = $derived({
    top: { height: `${crop.y}px` },
    bottom: { height: `${Math.max(0, containerSize.height - crop.y - crop.height)}px` },
    left: { top: `${crop.y}px`, height: `${crop.height}px`, width: `${crop.x}px` },
    right: { top: `${crop.y}px`, height: `${crop.height}px`, width: `${Math.max(0, containerSize.width - crop.x - crop.width)}px` },
  })
</script>

<div class={cn(cls('root'), className)} data-motion={motionLevel()} data-rounded={rounded ? '' : undefined} {...rest}>
  <div
    bind:this={container}
    class="ui-cropper__container"
    onpointermove={onMove}
    onpointerup={onUp}
    onpointerleave={onUp}
    onwheel={e => { e.preventDefault(); zoom = clamp(zoom + (e.deltaY > 0 ? -0.05 : 0.05), 0.5, 3) }}
    role="application"
    aria-label="Image cropper"
    aria-roledescription="cropper"
  >
    <!-- React's alt text, kept for the contract. -->
    <!-- svelte-ignore a11y_img_redundant_alt -->
    <img bind:this={image} {src} alt="Image to crop" class="ui-cropper__image" onload={onLoad} use:cssProps={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, 'pointer-events': rotation !== 0 ? 'none' : null }} draggable={false} />
    {#if loaded}
      <div class="ui-cropper__overlay" aria-hidden="true">
        <div class="ui-cropper__overlay-top" use:cssProps={overlay.top}></div>
        <div class="ui-cropper__overlay-bottom" use:cssProps={overlay.bottom}></div>
        <div class="ui-cropper__overlay-left" use:cssProps={overlay.left}></div>
        <div class="ui-cropper__overlay-right" use:cssProps={overlay.right}></div>
      </div>
      <!-- React's crop region: role="slider" moved by pointer only, with no aria-valuenow (inherited). -->
      <!-- svelte-ignore a11y_role_has_required_aria_props -->
      <div
        class="ui-cropper__crop-area"
        use:cssProps={{ 'inset-block-start': `${crop.y}px`, 'inset-inline-start': `${crop.x}px`, 'inline-size': `${crop.width}px`, 'block-size': `${crop.height}px` }}
        onpointerdown={e => start(e, 'move')}
        role="slider"
        aria-label="Crop region"
        aria-valuetext={`Position ${Math.round(crop.x)}, ${Math.round(crop.y)}, size ${Math.round(crop.width)} by ${Math.round(crop.height)}`}
        tabindex={0}
      >
        {#if showGrid}
          <div class="ui-cropper__grid" aria-hidden="true">
            <div class="ui-cropper__grid-line ui-cropper__grid-line--h1"></div>
            <div class="ui-cropper__grid-line ui-cropper__grid-line--h2"></div>
            <div class="ui-cropper__grid-line ui-cropper__grid-line--v1"></div>
            <div class="ui-cropper__grid-line ui-cropper__grid-line--v2"></div>
          </div>
        {/if}
        {#each HANDLES as pos (pos)}
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
          <div
            class={`ui-cropper__handle ui-cropper__handle--${pos}`}
            use:cssProps={{ cursor: CURSORS[pos] }}
            onpointerdown={e => start(e, 'resize', pos)}
            role="separator"
            aria-orientation={pos === 'n' || pos === 's' ? 'horizontal' : 'vertical'}
            aria-label={`Resize ${pos}`}
            tabindex={0}
          ></div>
        {/each}
      </div>
    {/if}
  </div>
  {#if showZoom || showRotate}
    <div class="ui-cropper__controls">
      {#if showZoom}
        <div class="ui-cropper__control-group">
          <span class="ui-cropper__control-label">Zoom</span>
          <input type="range" class="ui-cropper__slider" min="0.5" max="3" step="0.01" value={zoom} oninput={e => { zoom = Number(e.currentTarget.value) }} aria-label="Zoom level" />
          <span class="ui-cropper__control-label">{Math.round(zoom * 100)}%</span>
        </div>
      {/if}
      {#if showRotate}
        <div class="ui-cropper__control-group">
          <span class="ui-cropper__control-label">Rotate</span>
          <button type="button" class="ui-cropper__rotate-btn" onclick={() => { rotation -= 90 }} aria-label="Rotate left 90 degrees" title="Rotate -90°"><span>{@html ROTATE_LEFT}</span></button>
          <button type="button" class="ui-cropper__rotate-btn" onclick={() => { rotation += 90 }} aria-label="Rotate right 90 degrees" title="Rotate +90°"><span>{@html ROTATE_RIGHT}</span></button>
          <input type="range" class="ui-cropper__slider" min="-180" max="180" step="1" value={rotation} oninput={e => { rotation = Number(e.currentTarget.value) }} aria-label="Rotation angle" />
          <span class="ui-cropper__control-label">{rotation}°</span>
        </div>
      {/if}
    </div>
  {/if}
</div>
