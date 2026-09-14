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
 *  The override is a GETTER, not a value. A component's <script> body runs once,
 *  so `getMotionLevel(motion)` would snapshot the prop at init and a later
 *  change would never reach the DOM — where React re-runs the hook every
 *  render. Taking `() => motion` keeps the read inside the reactive graph, and
 *  makes this symmetric with the context side, which is already a getter.
 */
export function getMotionLevel(override?: () => MotionLevel | undefined): () => MotionLevel {
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
    return override?.() ?? fromContext?.() ?? DEFAULT_MOTION_LEVEL
  }
}
