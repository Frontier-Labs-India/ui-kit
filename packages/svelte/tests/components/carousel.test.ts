import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import Carousel from '../../src/components/Carousel.svelte'

const scrollTo = vi.fn()
beforeEach(() => { scrollTo.mockClear(); Element.prototype.scrollTo = scrollTo as never })
afterEach(() => { vi.useRealTimers() })

const live = (c: HTMLElement) => c.querySelector('.ui-carousel__live')!.textContent
const dots = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.ui-carousel__dot')]
const arrow = (c: HTMLElement, which: 'prev' | 'next') => c.querySelector<HTMLButtonElement>(`.ui-carousel__arrow--${which}`)!

describe('Carousel', () => {
  it('arrows and dots move between pages, clamped without loop, and scroll the track', async () => {
    const { container } = render(Carousel, { props: { items: ['a', 'b', 'c'] } })
    expect(arrow(container, 'prev').disabled).toBe(true)
    await fireEvent.click(arrow(container, 'next'))
    expect(live(container)).toBe('Slide 2 of 3')
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'smooth' })
    await fireEvent.click(dots(container)[2])
    expect(live(container)).toBe('Slide 3 of 3')
    expect(dots(container)[2].hasAttribute('data-active')).toBe(true)
    expect(arrow(container, 'next').disabled).toBe(true)
  })

  it('keys: arrows, Home and End; loop wraps', async () => {
    const { container } = render(Carousel, { props: { items: ['a', 'b', 'c'], loop: true, motion: 0 } })
    const root = container.querySelector('.ui-carousel')!
    await fireEvent.keyDown(root, { key: 'ArrowLeft' })
    expect(live(container)).toBe('Slide 3 of 3')
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'auto' })
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(live(container)).toBe('Slide 1 of 3')
    await fireEvent.keyDown(root, { key: 'End' })
    expect(live(container)).toBe('Slide 3 of 3')
    await fireEvent.keyDown(root, { key: 'Home' })
    expect(live(container)).toBe('Slide 1 of 3')
  })

  it('pages by slidesPerView', async () => {
    const { container } = render(Carousel, { props: { items: ['1', '2', '3', '4', '5'], slidesPerView: 2 } })
    expect(dots(container)).toHaveLength(3)
    // jsdom normalises calc(); the exact value is compared with React in the contract.
    expect((container.querySelector('.ui-carousel__slide') as HTMLElement).style.flexBasis).toContain('100% - 0px')
  })

  it('autoplay advances on the interval, pauses while hovered', async () => {
    vi.useFakeTimers()
    const { container } = render(Carousel, { props: { items: ['a', 'b', 'c'], autoPlay: true, autoPlayInterval: 1000 } })
    await vi.advanceTimersByTimeAsync(1000)
    expect(live(container)).toBe('Slide 2 of 3')
    await fireEvent.mouseEnter(container.querySelector('.ui-carousel')!)
    await vi.advanceTimersByTimeAsync(3000)
    expect(live(container)).toBe('Slide 2 of 3')
    await fireEvent.mouseLeave(container.querySelector('.ui-carousel')!)
    await vi.advanceTimersByTimeAsync(1000)
    expect(live(container)).toBe('Slide 3 of 3')
  })

  it('a settled scroll picks the page of the closest slide', async () => {
    vi.useFakeTimers()
    const { container } = render(Carousel, { props: { items: ['1', '2', '3', '4'], slidesPerView: 2 } })
    const track = container.querySelector<HTMLElement>('.ui-carousel__track')!
    const slides = [...container.querySelectorAll<HTMLElement>('.ui-carousel__slide')]
    slides.forEach((s, i) => Object.defineProperty(s, 'offsetLeft', { value: i * 100, configurable: true }))
    Object.defineProperty(track, 'scrollLeft', { value: 290, configurable: true })
    await fireEvent.scroll(track)
    await vi.advanceTimersByTimeAsync(50)
    expect(live(container)).toBe('Slide 2 of 2')
  })
})
