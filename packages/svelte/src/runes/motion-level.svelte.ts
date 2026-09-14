import { getContext, setContext, hasContext } from 'svelte'
import { MOTION_KEY, DEFAULT_MOTION_LEVEL, type MotionLevel } from './context'

/** Provider side — mirrors React's MotionProvider. */
export function setMotionLevel(get: () => MotionLevel) {
  setContext(MOTION_KEY, get)
}

/** Consumer side — mirrors useMotionLevel(override) in
 *  src/core/motion/use-motion-level.ts, including its precedence:
 *
 *    1. prefers-reduced-motion wins over EVERYTHING, an explicit prop included
 *    2. then the prop
 *    3. then context, whose default is 3
 *
 *  Returns a getter so the value is read at use time, which is what makes the
 *  media query re-evaluate the way React's re-render does. */
export function getMotionLevel(override?: MotionLevel): () => MotionLevel {
  const fromContext = hasContext(MOTION_KEY)
    ? getContext<() => MotionLevel>(MOTION_KEY)
    : null

  return () => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return 0
    }
    // `??` not `||` — an override of 0 means "no motion", not "unset".
    return override ?? fromContext?.() ?? DEFAULT_MOTION_LEVEL
  }
}
