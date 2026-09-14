import { getContext, setContext, hasContext } from 'svelte'
import { MOTION_KEY, type MotionLevel } from './context'

/** Provider side — mirrors React's UIProvider motion prop. */
export function setMotionLevel(get: () => MotionLevel) {
  setContext(MOTION_KEY, get)
}

/** Consumer side — mirrors useMotionLevel(override).
 *  Returns a getter so the value stays reactive at the call site. */
export function getMotionLevel(override?: MotionLevel): () => MotionLevel {
  const fromContext = hasContext(MOTION_KEY)
    ? getContext<() => MotionLevel>(MOTION_KEY)
    : null
  // `??` not `||` — an override of 0 means "no motion", not "unset".
  return () => override ?? fromContext?.() ?? 2
}
