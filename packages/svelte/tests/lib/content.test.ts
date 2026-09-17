import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import Content from '../../src/lib/Content.svelte'

describe('Content — React rendering rules for node-shaped props', () => {
  const text = (value: unknown) => render(Content, { props: { value } as never }).container.textContent

  it('renders strings', () => expect(text('hi')).toBe('hi'))
  it('renders numbers, including 0', () => { expect(text(7)).toBe('7'); expect(text(0)).toBe('0') })
  it('renders nothing for null, undefined, true, false', () => {
    for (const v of [null, undefined, true, false]) expect(text(v)).toBe('')
  })
  it('renders a snippet', () => {
    const { container } = render(Content, { props: { value: createRawSnippet(() => ({ render: () => '<b>x</b>' })) } })
    expect(container.innerHTML).toContain('<b>x</b>')
  })
})
