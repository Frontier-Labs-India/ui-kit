import './contract/pin-locale.js'

/* jsdom lacks ResizeObserver, which the shared anchor-positioning code observes
 * the trigger with. The React suite polyfills it the same way in
 * src/__tests__/setup.ts; without it every positioned component throws inside
 * its effect and the failure surfaces as an unrelated assertion. */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

/* jsdom has HTMLDialogElement but not showModal/close. The React suite stubs
 * them per file (confirm-dialog.test.tsx, sheet.test.tsx) with the same
 * attribute semantics; Dialog, Sheet and CommandBar all call them from an
 * effect, so without this an open dialog throws on mount. */
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
