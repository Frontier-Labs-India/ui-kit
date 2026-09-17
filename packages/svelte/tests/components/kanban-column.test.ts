import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import KanbanColumn from '../../src/components/KanbanColumn.svelte'

afterEach(() => { vi.restoreAllMocks() })

const cards = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }, { id: 'c', title: 'C' }]
function rects() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const i = ['a', 'b', 'c'].indexOf(this.dataset.cardId!)
    return { top: i * 50, height: 50 } as DOMRect
  })
}

describe('KanbanColumn', () => {
  it('drops a card from another column at the pointer index and shows the indicator while over', () => {
    rects()
    const onCardMove = vi.fn()
    const { container } = render(KanbanColumn, { props: { columnId: 'done', title: 'Done', cards, onCardMove } })
    const zone = container.querySelector('.ui-kanban-column__cards')!
    const data = JSON.stringify({ cardId: 'x9', sourceColumnId: 'todo' })
    const ev = (type: string, clientY: number) => {
      const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientY }) as DragEvent
      Object.defineProperty(e, 'dataTransfer', { value: { getData: () => data, dropEffect: '' } })
      zone.dispatchEvent(e)
      flushSync()
    }
    ev('dragenter', 60)
    ev('dragover', 60)
    expect(zone.hasAttribute('data-drag-over')).toBe(true)
    const indicator = zone.querySelector('.ui-kanban__drop-indicator')!
    // y=60 is above b's midpoint (75): index 1, before b.
    expect(indicator.nextElementSibling!.getAttribute('data-card-id')).toBe('b')
    ev('drop', 60)
    expect(onCardMove).toHaveBeenCalledWith('x9', 'done', 1)
    expect(zone.querySelector('.ui-kanban__drop-indicator')).toBeNull()
  })

  it('ignores drops without card data; nested dragenter/leave keeps the over state until the last leave', () => {
    const onCardMove = vi.fn()
    const { container } = render(KanbanColumn, { props: { columnId: 'c', title: 'C', cards, onCardMove } })
    const zone = container.querySelector('.ui-kanban-column__cards')!
    const plain = (type: string) => { zone.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true })); flushSync() }
    plain('dragenter')
    plain('dragenter')
    plain('dragleave')
    expect(zone.hasAttribute('data-drag-over')).toBe(true)
    plain('dragleave')
    expect(zone.hasAttribute('data-drag-over')).toBe(false)
    const drop = new MouseEvent('drop', { bubbles: true, cancelable: true }) as DragEvent
    Object.defineProperty(drop, 'dataTransfer', { value: { getData: () => 'not json' } })
    zone.dispatchEvent(drop)
    expect(onCardMove).not.toHaveBeenCalled()
  })

  it('touch drag moves on release to the index under the finger', () => {
    rects()
    const onCardMove = vi.fn()
    const { container } = render(KanbanColumn, { props: { columnId: 'col', title: 'C', cards, onCardMove } })
    const zone = container.querySelector('.ui-kanban-column__cards')!
    const card = container.querySelector('[data-card-id="a"]')!
    const touch = (type: string, clientY: number, target: Element = zone) => {
      const e = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent
      Object.defineProperty(e, 'touches', { value: [{ clientY }] })
      target.dispatchEvent(e)
      flushSync()
      return e
    }
    touch('touchstart', 10, card)
    expect(card.classList.contains('ui-kanban-column__card--dragging')).toBe(true)
    expect(touch('touchmove', 140).defaultPrevented).toBe(true)
    touch('touchend', 140)
    expect(onCardMove).toHaveBeenCalledWith('a', 'col', 3)
    expect(card.classList.contains('ui-kanban-column__card--dragging')).toBe(false)
  })

  it('cards are clickable by pointer and key; collapse toggles', async () => {
    const onCardClick = vi.fn()
    const onCollapse = vi.fn()
    const { container, getByLabelText } = render(KanbanColumn, { props: { columnId: 'c', title: 'C', cards, onCardClick, onCollapse } })
    const b = container.querySelector('[data-card-id="b"]')!
    await fireEvent.click(b)
    await fireEvent.keyDown(b, { key: ' ' })
    expect(onCardClick.mock.calls).toEqual([['b'], ['b']])
    await fireEvent.click(getByLabelText('Collapse column'))
    expect(onCollapse).toHaveBeenCalledWith(true)
  })
})
