import { vi } from 'vitest'

/* matchMedia mock (para JSDOM) */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  }),
})

/* localStorage mock simple */
const store = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
  clear: () => { store.clear() },
})

/* createObjectURL mock para blobs */
if (!URL.createObjectURL) {
  // @ts-ignore
  URL.createObjectURL = () => 'blob:mock'
}
