
export const serverTimestamp = () => ({ __mock: 'serverTimestamp' })
export function collection() { return { __mock: 'collection' } }
export function doc(_db, _path, _id) { return { id: _id } }
export function getDoc() { return Promise.resolve({ exists: () => false, data: () => ({}) }) }
export function setDoc() { return Promise.resolve() }
export function addDoc() { return Promise.resolve({ id: 'mock-id' }) }
export function deleteDoc() { return Promise.resolve() }
export function where() { return {} }
export function orderBy() { return {} }
export function query() { return {} }
export function onSnapshot(_q, cb) {
  const snap = { docs: [], forEach: (fn) => [] }
  cb(snap)
  return () => {}
}
export const db = {} as any

