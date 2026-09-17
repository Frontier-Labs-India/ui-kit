<script lang="ts">
  import Self from './JsonTreeNode.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from './react-style.js'

  /* One node of JsonViewer's tree; recurses into objects and arrays, as React's
   * TreeNode does. Internal to JsonViewer. */

  interface Props {
    keyName?: string
    value: unknown
    depth: number
    initialExpandDepth: number
    collapsed: boolean
    enableClipboard: boolean
    displayDataTypes: boolean
    displayObjectSize: boolean
    indentWidth: number
    sortKeys: boolean
    maxStringLength: number | undefined
    isLast: boolean
    visited?: Set<unknown>
  }

  let p: Props = $props()

  const typeOf = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)
  const valueType = $derived(typeOf(p.value))
  const expandable = $derived(valueType === 'object' || valueType === 'array')
  const visited = $derived(p.visited ?? new Set<unknown>())
  const circular = $derived(expandable && visited.has(p.value))
  // svelte-ignore state_referenced_locally
  let expanded = $state(p.collapsed ? false : p.depth < p.initialExpandDepth)
  let copied = $state(false)
  let stringExpanded = $state(false)
  const indentStyle = $derived(reactStyle({ inlineSize: `${p.depth * p.indentWidth}ch` }))
  const comma = $derived(p.isLast ? '' : ',')

  const display = $derived.by(() => {
    if (valueType === 'string') {
      const s = p.value as string
      const truncated = p.maxStringLength && s.length > p.maxStringLength && !stringExpanded
      return truncated ? `"${s.slice(0, p.maxStringLength)}..."` : `"${s}"`
    }
    return valueType === 'null' ? 'null' : String(p.value)
  })
  const dataType = $derived(['string', 'number', 'boolean', 'null'].includes(valueType) ? valueType : 'string')
  /* React: {isString && maxStringLength && tooLong && !expanded && <span/>}. With
   * maxStringLength 0 the expression short-circuits to the number 0, which React
   * RENDERS as the text "0". Inherited defect, reproduced for markup parity and
   * pinned by a contract case; fix in both packages together. */
  const strayZero = $derived(valueType === 'string' && p.maxStringLength === 0)
  const showMore = $derived(valueType === 'string' && !!p.maxStringLength && (p.value as string).length > p.maxStringLength && !stringExpanded)

  const entries = $derived.by((): [string, unknown][] => {
    if (!expandable) return []
    const e: [string, unknown][] = Array.isArray(p.value)
      ? (p.value as unknown[]).map((v, i) => [String(i), v])
      : Object.entries(p.value as Record<string, unknown>)
    if (p.sortKeys && !Array.isArray(p.value)) e.sort(([a], [b]) => a.localeCompare(b))
    return e
  })
  const nextVisited = $derived(new Set([...visited, p.value]))
  const isArray = $derived(valueType === 'array')

  function copyText(text: string) {
    try {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text)
      else {
        // Fallback, as React: an off-screen textarea positioned through the CSSOM.
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.setProperty('position', 'fixed')
        ta.style.setProperty('left', '-9999px')
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
    } catch {
      // silently fail, as React does
    }
    copied = true
    setTimeout(() => (copied = false), 1500)
  }
</script>

{#snippet key()}
  {#if p.keyName !== undefined}<span class="ui-json-viewer__key">{p.keyName}</span><span class="ui-json-viewer__colon">:</span>{/if}
{/snippet}

<div class="ui-json-viewer__node">
  {#if circular}
    <div class="ui-json-viewer__row">
      <span class="ui-json-viewer__indent" use:cssProps={indentStyle}></span><span class="ui-json-viewer__chevron-spacer"></span>{@render key()}<span class="ui-json-viewer__value" data-type="null" use:cssProps={reactStyle({ fontStyle: 'italic' })}>[Circular]</span>
    </div>
  {:else if expandable}
    <div class="ui-json-viewer__row">
      <span class="ui-json-viewer__indent" use:cssProps={indentStyle}></span>
      <button class="ui-json-viewer__chevron" onclick={() => (expanded = !expanded)} aria-label={expanded ? 'Collapse' : 'Expand'} aria-expanded={expanded} data-expanded={expanded ? '' : undefined}>▶</button>
      {@render key()}
      <span class="ui-json-viewer__bracket">{isArray ? '[' : '{'}</span>
      {#if p.displayObjectSize}<span class="ui-json-viewer__size">{isArray ? `[${entries.length}]` : `{${entries.length}}`}</span>{/if}
      {#if !expanded}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <span class="ui-json-viewer__ellipsis" onclick={() => (expanded = !expanded)} role="button" tabindex={0}>...</span><span class="ui-json-viewer__bracket">{isArray ? ']' : '}'}{comma}</span>
      {/if}
    </div>
    <div class="ui-json-viewer__children" data-collapsed={expanded ? undefined : ''}>
      <div class="ui-json-viewer__children-inner">
        {#each entries as [k, v], i (k)}
          <Self
            keyName={isArray ? undefined : k}
            value={v}
            depth={p.depth + 1}
            initialExpandDepth={p.initialExpandDepth}
            collapsed={p.collapsed}
            enableClipboard={p.enableClipboard}
            displayDataTypes={p.displayDataTypes}
            displayObjectSize={p.displayObjectSize}
            indentWidth={p.indentWidth}
            sortKeys={p.sortKeys}
            maxStringLength={p.maxStringLength}
            isLast={i === entries.length - 1}
            visited={nextVisited}
          />
        {/each}
      </div>
    </div>
    {#if expanded}
      <div class="ui-json-viewer__row"><span class="ui-json-viewer__indent" use:cssProps={indentStyle}></span><span class="ui-json-viewer__chevron-spacer"></span><span class="ui-json-viewer__bracket">{isArray ? ']' : '}'}{comma}</span></div>
    {/if}
  {:else}
    <div class="ui-json-viewer__row">
      <span class="ui-json-viewer__indent" use:cssProps={indentStyle}></span><span class="ui-json-viewer__chevron-spacer"></span>{@render key()}
      <!-- role="button" and tabindex come from the same enableClipboard flag, which the
           analyser cannot see. DEFECT inherited from React, kept for parity: the span is
           focusable but has no key handler, so a keyboard user can focus a value and not
           copy it. Fix in both packages. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_no_noninteractive_tabindex -->
      <span
        class="ui-json-viewer__value"
        data-type={dataType}
        onclick={p.enableClipboard ? () => copyText(display) : undefined}
        role={p.enableClipboard ? 'button' : undefined}
        tabindex={p.enableClipboard ? 0 : undefined}
        aria-label={p.enableClipboard ? `Copy value ${display}` : undefined}
        data-copied={copied ? '' : undefined}
      >{display}</span>{#if strayZero}0{/if}{#if showMore}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <span class="ui-json-viewer__ellipsis" onclick={() => (stringExpanded = true)} role="button" tabindex={0} aria-label="Expand string"> show more</span>{/if}{#if p.displayDataTypes}<span class="ui-json-viewer__type">{valueType}</span>{/if}{#if comma}<span class="ui-json-viewer__bracket">{comma}</span>{/if}
    </div>
  {/if}
</div>
