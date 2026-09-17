export const MOTION_KEY = Symbol('ui-kit.motion')
export type MotionLevel = 0 | 1 | 2 | 3

/** Mirrors `createContext<number>(3)` in src/core/motion/motion-context.tsx.
 *  Verified against React's emitted markup, not assumed. */
export const DEFAULT_MOTION_LEVEL: MotionLevel = 3
