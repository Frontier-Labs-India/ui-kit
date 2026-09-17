import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { createRawSnippet, flushSync } from 'svelte'
import Card from '../../src/components/Card.svelte'

const children = createRawSnippet(() => ({ render: () => '<p>body <a href="#x">link</a></p>' }))
const collapsed = (c: Element) => c.querySelector('.ui-card__content')!.getAttribute('data-collapsed')

describe('Card (expandable)', () => {
  it('the toggle collapses and expands, updating aria', async () => {
    const { container } = render(Card, { props: { expandable: true, header: 'H', children } })
    const t = container.querySelector('.ui-card__expand-toggle')!
    expect(collapsed(container)).toBe('false')
    await fireEvent.click(t); flushSync()
    expect(collapsed(container)).toBe('true')
    expect(t.getAttribute('aria-expanded')).toBe('false')
    await fireEvent.click(t); flushSync()
    expect(collapsed(container)).toBe('false')
  })

  it('a click on the card body toggles; a click on a link inside does not', async () => {
    const { container } = render(Card, { props: { expandable: true, children } })
    await fireEvent.click(container.querySelector('p')!); flushSync()
    expect(collapsed(container)).toBe('true')
    await fireEvent.click(container.querySelector('a')!); flushSync()
    expect(collapsed(container)).toBe('true')
  })

  it('defaultExpanded false starts collapsed', () => {
    const { container } = render(Card, { props: { expandable: true, defaultExpanded: false, children } })
    expect(collapsed(container)).toBe('true')
  })
})
