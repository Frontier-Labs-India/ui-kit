/* Sample avatar images served by the demo itself (public/avatars), picked
 * deterministically from a seed so a page looks the same on every load. The
 * demo used to load i.pravatar.cc, which sent every visitor's address to a
 * third party and needed it allowed in the Content-Security-Policy. */
const COUNT = 6

export function sampleAvatar(seed: string): string {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `${import.meta.env.BASE_URL}avatars/${(h % COUNT) + 1}.svg`
}
