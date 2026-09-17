<script lang="ts">
  /* A minimal FormState provider for tests: $state-backed, so fields that read
   * getFieldProps inside $derived follow it. Proves the context is consumed —
   * the SSR contract renders without a provider and cannot. */
  import type { Component } from 'svelte'
  import { setFormContext } from '../../src/runes/form-context.js'

  let { field, name = 'f', initial, error, props = {}, log }: {
    field: Component<any>
    name?: string
    initial: unknown
    error?: string
    props?: Record<string, unknown>
    log: string[]
  } = $props()

  // svelte-ignore state_referenced_locally
  const state = $state({ value: initial, touched: false })
  const form = {
    getFieldProps: () => ({
      get value() { return state.value },
      get touched() { return state.touched },
      error,
      onChange: (v: unknown) => { log.push(`change:${JSON.stringify(v)}`); state.value = v },
      onBlur: () => { log.push('blur'); state.touched = true },
    }),
  }
  setFormContext(form as never)
</script>

{#each [field] as Field (Field)}<Field {name} {...props} />{/each}
<output>{JSON.stringify(state.value)}</output>
