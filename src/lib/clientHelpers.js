/** Convierte un Timestamp-like de Firestore a ms */
export function toMillis(ts) {
  if (!ts) return 0
  if (typeof ts === 'object' && ts !== null) {
    if ('seconds' in ts && typeof ts.seconds === 'number') return ts.seconds * 1000
    if (ts instanceof Date) return ts.getTime()
  }
  return 0
}

/** Merge por id: los nuevos pisan a los viejos con el mismo id */
export function mergeById(oldArr = [], newArr = []) {
  const map = new Map()
  for (const it of oldArr || []) map.set(it && it.id, it)
  for (const it of newArr || []) map.set(it && it.id, it)
  // filtra ids "undefined" por si acaso
  return Array.from(map.entries())
    .filter(([id]) => id !== undefined && id !== null)
    .map(([, v]) => v)
}

/** Normaliza categoría a uno de: dulces | salados | nocom | otros */
export function normCat(raw) {
  const n = String(raw ?? '').trim().toLowerCase()
  if (n.startsWith('dulc')) return 'dulces'
  if (n.startsWith('sala')) return 'salados'
  if ((n.includes('no') && n.includes('comest')) || n.includes('no comestible')) return 'nocom'
  return 'otros'
}
