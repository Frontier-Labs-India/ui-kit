/* React's reading of the case encoding in packages/svelte/tests/contract/cases.ts,
 * shared by both fixture generators (SSR HTML and ref targets) so they cannot
 * read a case differently. The Svelte side is tests/contract/hydrate.svelte.ts.
 *
 *   { $el: 'x' }       <b>x</b>
 *   { $fn: true }      a no-op function
 *   { $date: iso }     a Date
 *   { $part: Name, props }   a part component (COMPONENT-API.md rules 2-3),
 *                      props.children may be an array of parts */
import React from 'react'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SOURCES } from '../packages/svelte/tests/contract/cases'

const ROOT = resolve(import.meta.dirname, '..')
const meta = JSON.parse(readFileSync(resolve(ROOT, 'dist/component-meta.json'), 'utf8'))
const fileOf: Record<string, string> = Object.fromEntries(meta.components.map((c: { name: string; fileName: string }) => [c.name, c.fileName]))

export async function loadComponent(name: string): Promise<React.ComponentType<any>> {
  if (SOURCES[name]) {
    // `file#Export` when the public name differs from the file's own export name.
    const [file, exportName = name] = SOURCES[name].split('#')
    const mod = await import(pathToFileURL(resolve(ROOT, file)).href)
    if (!mod[exportName]) throw new Error(`${file} does not export ${exportName}`)
    return mod[exportName]
  }
  const file = fileOf[name]
  if (!file) throw new Error(`${name} is not in component-meta.json and has no SOURCES entry`)
  for (const dir of ['src/components', 'src/domain']) {
    const p = resolve(ROOT, dir, `${file}.tsx`)
    if (existsSync(p)) {
      const mod = await import(pathToFileURL(p).href)
      if (!mod[name]) throw new Error(`${p} does not export ${name}`)
      return mod[name]
    }
  }
  throw new Error(`no source file for ${name} (${file}.tsx)`)
}

/** Loads every part a set of cases names, so hydrate() can stay synchronous. */
export async function loadParts(cases: unknown): Promise<Record<string, React.ComponentType<any>>> {
  const names = new Set<string>()
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') {
      if ('$part' in v) names.add(String((v as { $part: string }).$part))
      Object.values(v).forEach(walk)
    }
  }
  walk(cases)
  const parts: Record<string, React.ComponentType<any>> = {}
  for (const n of names) parts[n] = await loadComponent(n)
  return parts
}

export function hydrate(value: unknown, parts: Record<string, React.ComponentType<any>>): unknown {
  if (Array.isArray(value)) return value.map(v => hydrate(v, parts))
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if ('$el' in v) return React.createElement('b', null, String(v.$el))
    if ('$date' in v) return new Date(String(v.$date))
    if ('$fn' in v) return () => {}
    if ('$part' in v) {
      const { children, ...props } = (v.props ?? {}) as Record<string, unknown>
      const kids = children === undefined ? [] : Array.isArray(children) ? children : [children]
      // Spread as separate arguments: an array child would need keys, which
      // callers writing JSX never supply.
      return React.createElement(parts[String(v.$part)], hydrate(props, parts) as object, ...(hydrate(kids, parts) as React.ReactNode[]))
    }
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, hydrate(x, parts)]))
  }
  return value
}

/** A case's props for React: an array of parts as `children` becomes JSX children. */
export function caseElement(Component: React.ComponentType<any>, props: unknown, parts: Record<string, React.ComponentType<any>>, extra: object = {}): React.ReactElement {
  const { children, ...rest } = props as Record<string, unknown>
  const isPartList = Array.isArray(children) && children.some(c => c && typeof c === 'object' && '$part' in c)
  if (isPartList) {
    return React.createElement(Component, { ...(hydrate(rest, parts) as object), ...extra }, ...(hydrate(children, parts) as React.ReactNode[]))
  }
  return React.createElement(Component, { ...(hydrate(props, parts) as object), ...extra })
}
