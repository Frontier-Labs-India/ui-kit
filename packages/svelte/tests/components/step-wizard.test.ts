import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import StepWizard from '../../src/components/StepWizard.svelte'

const steps = (validate?: () => boolean | Promise<boolean>) => [
  { id: 'a', label: 'A', validate },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
]
const buttons = (c: HTMLElement) => [...c.querySelectorAll<HTMLButtonElement>('.ui-step-wizard__step-button')]
const content = (c: HTMLElement) => c.querySelector('.ui-step-wizard__content')!.textContent
const settle = () => new Promise(r => setTimeout(r, 0))

describe('StepWizard', () => {
  it('goes back to a completed step but not forward without allowSkip', async () => {
    const onChange = vi.fn()
    const { container } = render(StepWizard, { props: { steps: steps(), items: ['one', 'two', 'three'], defaultStep: 1, onChange } })
    expect(content(container)).toBe('two')
    await fireEvent.click(buttons(container)[2])
    await settle()
    expect(onChange).not.toHaveBeenCalled()
    await fireEvent.click(buttons(container)[0])
    await settle()
    expect(onChange).toHaveBeenCalledWith(0)
    expect(content(container)).toBe('one')
    expect(buttons(container)[1].getAttribute('tabindex')).toBe('-1')
  })

  it('with allowSkip, moving forward waits for the current step\'s validate', async () => {
    let ok = false
    const validate = vi.fn(async () => ok)
    const onChange = vi.fn()
    const { container } = render(StepWizard, { props: { steps: steps(validate), items: ['one', 'two', 'three'], allowSkip: true, onChange } })
    await fireEvent.click(buttons(container)[2])
    await settle()
    expect(validate).toHaveBeenCalledOnce()
    expect(onChange).not.toHaveBeenCalled()
    ok = true
    await fireEvent.click(buttons(container)[2])
    await settle()
    expect(onChange).toHaveBeenCalledWith(2)
    expect(content(container)).toBe('three')
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(2)
  })

  it('controlled: clicks only report', async () => {
    const onChange = vi.fn()
    const { container, rerender } = render(StepWizard, { props: { steps: steps(), items: ['one', 'two', 'three'], activeStep: 2, onChange } })
    await fireEvent.click(buttons(container)[0])
    await settle()
    expect(onChange).toHaveBeenCalledWith(0)
    expect(content(container)).toBe('three')
    await rerender({ steps: steps(), items: ['one', 'two', 'three'], activeStep: 0, onChange })
    expect(content(container)).toBe('one')
  })

  it('controlled clicks leave the uncontrolled step alone, so dropping activeStep restores it (as React)', async () => {
    const { container, rerender } = render(StepWizard, { props: { steps: steps(), items: ['one', 'two', 'three'], activeStep: 2 } })
    await fireEvent.click(buttons(container)[1])
    await settle()
    await rerender({ steps: steps(), items: ['one', 'two', 'three'], activeStep: undefined })
    expect(content(container)).toBe('one')
  })
})
