import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import PipelineStage from '../../src/components/PipelineStage.svelte'

const stages = [
  { id: 'build', label: 'Build', status: 'success' as const },
  { id: 'test', label: 'Test', status: 'running' as const },
]

describe('PipelineStage', () => {
  it('calls onStageClick with the stage id', async () => {
    const onStageClick = vi.fn()
    render(PipelineStage, { props: { stages, onStageClick } })
    await fireEvent.click(screen.getByText('Test'))
    expect(onStageClick).toHaveBeenCalledWith('test')
  })

  it('renders plain labels, not buttons, without a handler', () => {
    const { container } = render(PipelineStage, { props: { stages } })
    expect(container.querySelector('button')).toBeNull()
  })
})
