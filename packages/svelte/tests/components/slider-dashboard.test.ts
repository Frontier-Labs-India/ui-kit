import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Slider from '../../src/components/Slider.svelte'
import DashboardGrid from '../../src/components/DashboardGrid.svelte'

describe('Slider', () => {
  it('uncontrolled: moves the fill and the shown value, reporting numbers', async () => {
    const onChange = vi.fn()
    const { container } = render(Slider, { props: { label: 'Vol', showValue: true, onChange } })
    const input = container.querySelector('input') as HTMLInputElement
    input.value = '40'; await fireEvent.input(input); flushSync()
    expect(onChange).toHaveBeenCalledWith(40)
    expect(container.querySelector('.ui-slider__value')!.textContent).toBe('40')
    expect(input.style.getPropertyValue('background')).toContain(' 40%')
  })

  it('min === max fills fully rather than dividing by zero', () => {
    const { container } = render(Slider, { props: { min: 5, max: 5 } })
    expect((container.querySelector('input') as HTMLInputElement).style.getPropertyValue('background')).toContain(' 100%')
  })
})

describe('DashboardGrid', () => {
  it('each group collapses independently, hiding its description', async () => {
    render(DashboardGrid, { props: { groups: [
      { id: 'a', title: 'A', description: 'about a', items: ['x'] },
      { id: 'b', title: 'B', description: 'about b', items: ['y'], collapsed: true },
    ] } })
    expect(screen.queryByText('about b')).toBeNull()
    await fireEvent.click(screen.getByText('A').closest('button')!); flushSync()
    expect(screen.queryByText('about a')).toBeNull()
    await fireEvent.click(screen.getByText('B').closest('button')!); flushSync()
    expect(screen.getByText('about b')).toBeTruthy()
  })
})
