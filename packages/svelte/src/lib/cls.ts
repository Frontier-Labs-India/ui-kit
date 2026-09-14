/* The class-name half of React's useStyles(), which is the only half that is
 * framework-neutral. The other two — SSR registration and mount-time injection
 * — are React-shaped and are not needed here: this package ships a stylesheet
 * rather than injecting at runtime.
 *
 * These nine lines are copied rather than imported. Importing use-styles.ts
 * would pull useEffect, useCallback and useStyleCollector into a Svelte bundle.
 * src/__tests__/core/cls-parity.test.ts asserts the copy stays honest. */

type Part = string | false | null | undefined | 0 | ''

export function makeCls(name: string) {
  const prefix = `ui-${name}`
  return (...parts: Part[]): string =>
    parts
      .filter((p): p is string => typeof p === 'string' && p.length > 0)
      .map(p => (p === 'root' ? prefix : `${prefix}--${p}`))
      .join(' ')
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ')
}
