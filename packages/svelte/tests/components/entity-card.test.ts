import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import EntityCard from '../../src/components/EntityCard.svelte'

describe('EntityCard', () => {
  it('an action runs without clicking the card or following its link', async () => {
    const onclick = vi.fn(), restart = vi.fn()
    const { container } = render(EntityCard, { props: { name: 'db', href: '/db', onclick, motion: 0, actions: [{ label: 'Restart', onClick: restart }] } })
    const e = new MouseEvent('click', { bubbles: true, cancelable: true })
    screen.getByLabelText('Restart').dispatchEvent(e)
    expect(restart).toHaveBeenCalledOnce()
    expect(onclick).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(true)
    await fireEvent.click(container.querySelector('.ui-entity-card')!)
    expect(onclick).toHaveBeenCalledOnce()
  })
})
