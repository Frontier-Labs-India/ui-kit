import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import PipelineDAG from '../../src/components/PipelineDAG.svelte'

describe('PipelineDAG', () => {
  const nodes = [{ id: 'a', label: 'Kafka', status: 'running' as const }, { id: 'b', label: 'Sink' }]
  const edges = [{ source: 'a', target: 'b' }]

  it('reports node clicks and Enter/Space, and edge clicks', async () => {
    const onNodeClick = vi.fn(), onEdgeClick = vi.fn()
    const { container } = render(PipelineDAG, { props: { nodes, edges, onNodeClick, onEdgeClick } })
    const node = screen.getByLabelText('Kafka: running')
    await fireEvent.click(node)
    await fireEvent.keyDown(node, { key: 'Enter' })
    await fireEvent.keyDown(node, { key: ' ' })
    await fireEvent.click(container.querySelector('.ui-pipeline-dag__edge')!)
    expect(onNodeClick).toHaveBeenCalledTimes(3)
    expect(onEdgeClick).toHaveBeenCalledWith(edges[0])
  })
})
