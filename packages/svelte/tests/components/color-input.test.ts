import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import ColorInput from '../../src/components/ColorInput.svelte'
import BindProbe from './value-bind-probe.svelte'
import { hslToHex } from '../../src/lib/color-input-math.js'

afterEach(() => { vi.restoreAllMocks() })
const out = (c: HTMLElement) => JSON.parse(c.querySelector('output')!.textContent!)
const attrs = (el: Element) => Array.from(el.attributes).map(a => a.name).filter(n => n !== 'style').sort()

describe('ColorInput', () => {
  it('lib/color-input-math.ts is still a verbatim extract of the React source', () => {
    const react = readFileSync(resolve(import.meta.dirname, '../../../../src/components/color-input.tsx'), 'utf8')
    const ours = readFileSync(resolve(import.meta.dirname, '../../src/lib/color-input-math.ts'), 'utf8')
    let body = react.slice(react.indexOf('function hexToHsl('), react.indexOf('// ─── Styles')).trimEnd()
    for (const fn of ['hexToHsl', 'hslToHex', 'isValidHex', 'normalizeHex']) body = body.replace(`function ${fn}(`, `export function ${fn}(`)
    expect(ours.endsWith(body + '\n')).toBe(true)
  })

  it("open popover markup carries exactly React's attributes", async () => {
    const { container } = render(ColorInput, { props: { name: 'c', swatches: ['#fff'] } })
    await fireEvent.click(container.querySelector('.ui-color-input__trigger')!)
    expect(attrs(container.querySelector('.ui-color-input__popover')!)).toEqual(['aria-label', 'class', 'role'])
    expect(attrs(container.querySelector('.ui-color-input__sl-area')!)).toEqual(['aria-label', 'aria-valuetext', 'class', 'role', 'tabindex'])
    expect(attrs(container.querySelector('.ui-color-input__hue-slider')!)).toEqual(['aria-label', 'class', 'max', 'min', 'type'])
    expect(attrs(container.querySelector('.ui-color-input__preset-swatch')!)).toEqual(['aria-label', 'class', 'type'])
    expect(document.activeElement).toBe(container.querySelector('.ui-color-input__sl-area'))
  })

  it('arrow keys, Home/End and the hue slider change the colour (bind:value)', async () => {
    const { container } = render(BindProbe, { props: { field: ColorInput, initial: '#808080', props: { name: 'c' } } })
    await fireEvent.click(container.querySelector('.ui-color-input__trigger')!)
    const sl = container.querySelector<HTMLElement>('.ui-color-input__sl-area')!
    await fireEvent.keyDown(sl, { key: 'ArrowUp' })
    expect(sl.getAttribute('aria-valuetext')).toBe('Saturation 0%, Lightness 51%')
    expect(out(container)).toBe(hslToHex(0, 0, 51))
    await fireEvent.keyDown(sl, { key: 'End' })
    expect(out(container)).toBe('#ffffff')
    await fireEvent.keyDown(sl, { key: 'ArrowLeft' })
    const hue = container.querySelector<HTMLInputElement>('.ui-color-input__hue-slider')!
    hue.value = '120'
    await fireEvent.input(hue)
    expect(out(container)).toBe(hslToHex(120, 99, 100))
    expect(container.querySelector<HTMLInputElement>('.ui-color-input__hex-input')!.value).toBe(out(container))
  })

  it('pointer on the area sets saturation from x and lightness from y', async () => {
    const onChange = vi.fn()
    const { container } = render(ColorInput, { props: { name: 'c', onChange, defaultValue: '#ff0000' } })
    await fireEvent.click(container.querySelector('.ui-color-input__trigger')!)
    const sl = container.querySelector<HTMLElement>('.ui-color-input__sl-area')!
    vi.spyOn(sl, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 200, height: 100 } as DOMRect)
    sl.dispatchEvent(new MouseEvent('pointerdown', { clientX: 50, clientY: 25, bubbles: true }))
    flushSync()
    expect(onChange).toHaveBeenLastCalledWith(hslToHex(0, 25, 75))
    sl.dispatchEvent(new MouseEvent('pointermove', { clientX: 200, clientY: 100 }))
    flushSync()
    expect(onChange).toHaveBeenLastCalledWith(hslToHex(0, 100, 0))
    sl.dispatchEvent(new MouseEvent('pointerup'))
    sl.dispatchEvent(new MouseEvent('pointermove', { clientX: 0, clientY: 0 }))
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('hex text commits a valid colour on blur (3-digit normalised) and reverts an invalid one; swatches select', async () => {
    const onChange = vi.fn()
    const { container } = render(ColorInput, { props: { name: 'c', onChange, defaultValue: '#000000', swatches: ['#ABC'] } })
    const text = container.querySelector<HTMLInputElement>('.ui-color-input__hex-input')!
    text.value = '#F0A'
    await fireEvent.input(text)
    await fireEvent.blur(text)
    expect(onChange).toHaveBeenLastCalledWith('#ff00aa')
    text.value = 'nope'
    await fireEvent.input(text)
    await fireEvent.blur(text)
    expect(text.value).toBe('#ff00aa')
    await fireEvent.click(container.querySelector('.ui-color-input__trigger')!)
    await fireEvent.click(container.querySelector('.ui-color-input__preset-swatch')!)
    expect(onChange).toHaveBeenLastCalledWith('#aabbcc')
  })

  it('Escape and an outside mousedown close; the trigger does not count as outside; disabled never opens', async () => {
    const { container } = render(ColorInput, { props: { name: 'c' } })
    const trigger = container.querySelector('.ui-color-input__trigger')!
    await fireEvent.click(trigger)
    await fireEvent.keyDown(container.querySelector('.ui-color-input__popover')!, { key: 'Escape' })
    expect(container.querySelector('.ui-color-input__popover')).toBeNull()
    await fireEvent.click(trigger)
    trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(container.querySelector('.ui-color-input__popover')).not.toBeNull()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(container.querySelector('.ui-color-input__popover')).toBeNull()
    const d = render(ColorInput, { props: { name: 'd', disabled: true } })
    await fireEvent.click(d.container.querySelector('.ui-color-input__trigger')!)
    expect(d.container.querySelector('.ui-color-input__popover')).toBeNull()
  })
})
