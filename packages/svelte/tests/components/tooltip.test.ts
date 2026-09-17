import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import TooltipProbe from './tooltip-probe.svelte'

afterEach(() => vi.useRealTimers())

const hoverTrigger = async (container: Element) => {
  await userEvent.hover(container.querySelector('button')!)
}

describe('Tooltip', () => {
  it('is hidden until hovered', () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help' } })
    expect(container.querySelector('.ui-tooltip')).toBeNull()
  })

  it('renders its trigger content', () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help' } })
    expect(container.querySelector('button')!.textContent).toBe('Trigger')
  })

  it('appears on hover after the delay', async () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0 } })
    await hoverTrigger(container)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).not.toBeNull())
    expect(container.querySelector('[role="tooltip"]')!.textContent).toBe('Help')
  })

  it('does not appear when disabled', async () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0, disabled: true } })
    await hoverTrigger(container)
    await new Promise(r => setTimeout(r, 20))
    expect(container.querySelector('.ui-tooltip')).toBeNull()
  })

  it('wires aria-describedby to the panel id while visible', async () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0 } })
    await hoverTrigger(container)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).not.toBeNull())
    const described = container.querySelector('button')!.getAttribute('aria-describedby')
    expect(described).toBe(container.querySelector('[role="tooltip"]')!.id)
    expect(described).not.toBeNull()
  })

  it('has no aria-describedby while hidden', () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help' } })
    expect(container.querySelector('button')!.hasAttribute('aria-describedby')).toBe(false)
  })

  it('anchors to the caller\'s own trigger element, not a wrapper', async () => {
    // The old display:contents wrapper had an all-zero rect in real browsers,
    // placing the panel at the viewport origin. The trigger is now measured.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.tagName === 'BUTTON') return { top: 300, bottom: 330, left: 100, right: 180, width: 80, height: 30, x: 100, y: 300 } as DOMRect
      return { top: 0, bottom: 20, left: 0, right: 60, width: 60, height: 20, x: 0, y: 0 } as DOMRect
    })
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0 } })
    const button = container.querySelector('button')!
    expect(button.parentElement).toBe(container)
    await hoverTrigger(container)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).not.toBeNull())
    const tip = container.querySelector('.ui-tooltip') as HTMLElement
    await vi.waitFor(() => expect(tip.style.getPropertyValue('top')).toBe('272px'))
    expect(tip.style.getPropertyValue('left')).toBe('110px')
    vi.restoreAllMocks()
  })

  it('positions via setProperty', async () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0 } })
    await hoverTrigger(container)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).not.toBeNull())
    const tip = container.querySelector('.ui-tooltip') as HTMLElement
    expect(tip.style.getPropertyValue('position')).toBe('fixed')
    // NOTE: do NOT also assert the style attribute is absent. jsdom serialises
    // setProperty into the style attribute — verified — so outerHTML contains
    // style="position: fixed;" even for a correct cssProps implementation.
    // The property CSP enforces is that cssText is never written, which
    // css-props.test.ts spies on directly and check-svelte-csp.js catches in
    // source.
  })

  it('applies maxWidth as a number in px', async () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0, maxWidth: 200 } })
    await hoverTrigger(container)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).not.toBeNull())
    const tip = container.querySelector('.ui-tooltip') as HTMLElement
    expect(tip.style.getPropertyValue('max-inline-size')).toBe('200px')
  })

  it('applies maxWidth as a string verbatim', async () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0, maxWidth: '30ch' } })
    await hoverTrigger(container)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).not.toBeNull())
    const tip = container.querySelector('.ui-tooltip') as HTMLElement
    expect(tip.style.getPropertyValue('max-inline-size')).toBe('30ch')
  })

  it('sets pointer-events only when interactive', async () => {
    const plain = render(TooltipProbe, { props: { content: 'Help', delay: 0 } })
    await hoverTrigger(plain.container)
    await vi.waitFor(() => expect(plain.container.querySelector('.ui-tooltip')).not.toBeNull())
    expect((plain.container.querySelector('.ui-tooltip') as HTMLElement).style.getPropertyValue('pointer-events')).toBe('')

    const inter = render(TooltipProbe, { props: { content: 'Help', delay: 0, interactive: true } })
    await hoverTrigger(inter.container)
    await vi.waitFor(() => expect(inter.container.querySelector('.ui-tooltip')).not.toBeNull())
    expect((inter.container.querySelector('.ui-tooltip') as HTMLElement).style.getPropertyValue('pointer-events')).toBe('auto')
  })

  it('reflects the resolved placement as data-placement', async () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0, placement: 'right' } })
    await hoverTrigger(container)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).not.toBeNull())
    expect(container.querySelector('.ui-tooltip')!.getAttribute('data-placement')).toBe('right')
  })

  it('hides again on unhover', async () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0 } })
    await hoverTrigger(container)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).not.toBeNull())
    await userEvent.unhover(container.querySelector('button')!)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).toBeNull())
  })

  it('removes its scroll and resize listeners when hidden', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0 } })
    await hoverTrigger(container)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).not.toBeNull())
    const added = addSpy.mock.calls.filter(c => c[0] === 'scroll' || c[0] === 'resize').length
    expect(added).toBeGreaterThan(0)
    await userEvent.unhover(container.querySelector('button')!)
    await vi.waitFor(() => expect(container.querySelector('.ui-tooltip')).toBeNull())
    const removed = removeSpy.mock.calls.filter(c => c[0] === 'scroll' || c[0] === 'resize').length
    expect(removed).toBe(added)
    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
