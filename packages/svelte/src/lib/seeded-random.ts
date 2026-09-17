/* The deterministic pseudo-random sequence the React decorative backgrounds use
 * (MeteorShower, BackgroundBoxes, BackgroundBeams…), copied exactly. Layouts
 * must be identical between packages and between server and client renders,
 * so this is not Math.random() and must not be "improved". */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}
