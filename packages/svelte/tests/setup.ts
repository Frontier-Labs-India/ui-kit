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
