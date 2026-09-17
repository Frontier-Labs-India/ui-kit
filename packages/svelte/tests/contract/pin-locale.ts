/* Pins the DEFAULT locale for locale-formatting calls to en-US, in both the
 * contract generator and the Svelte test runtime.
 *
 * Components format with an undefined locale — SeverityTimeline calls
 * toLocaleTimeString(undefined, …) — which means "the machine's locale". Node
 * reads that from LC_ALL / LANG at startup and it cannot be changed afterwards:
 * the same instant renders "12:05 PM" under en_US and "12:05" under de_DE. A
 * fixture generated on one machine would then read as stale on another, the
 * same failure TZ pinning prevents for time zones.
 *
 * Only calls that pass no locale are affected; an explicit locale is honoured. */

const PINNED = 'en-US'
const marker = Symbol.for('ui-kit.contract.locale-pinned')
const g = globalThis as Record<symbol, unknown>

if (!g[marker]) {
  g[marker] = true

  for (const name of ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString'] as const) {
    const original = Date.prototype[name]
    Date.prototype[name] = function (this: Date, locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
      return original.call(this, locales ?? PINNED, options)
    }
  }

  const numberToLocale = Number.prototype.toLocaleString
  Number.prototype.toLocaleString = function (this: number, locales?: string | string[], options?: Intl.NumberFormatOptions) {
    return numberToLocale.call(this, locales ?? PINNED, options)
  }

  const DTF = Intl.DateTimeFormat
  const NF = Intl.NumberFormat
  Intl.DateTimeFormat = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
    return new DTF(locales ?? PINNED, options)
  } as unknown as typeof Intl.DateTimeFormat
  Object.assign(Intl.DateTimeFormat, { supportedLocalesOf: DTF.supportedLocalesOf })
  Intl.NumberFormat = function (locales?: string | string[], options?: Intl.NumberFormatOptions) {
    return new NF(locales ?? PINNED, options)
  } as unknown as typeof Intl.NumberFormat
  Object.assign(Intl.NumberFormat, { supportedLocalesOf: NF.supportedLocalesOf })
}

export {}
