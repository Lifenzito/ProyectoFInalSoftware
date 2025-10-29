
import { describe, it, expect } from 'vitest'
import { toMillis, mergeById, normCat } from '../src/lib/clientHelpers'

describe('clientHelpers', () => {
  it('toMillis convierte Timestamp-like a ms', () => {
    expect(toMillis({ seconds: 10 })).toBe(10000)
    expect(toMillis(null)).toBe(0)
    expect(toMillis({})).toBe(0)
  })

  it('mergeById une arrays priorizando nuevos por id', () => {
    const oldArr = [{ id: '1', a: 1 }, { id: '2', a: 2 }]
    const newArr = [{ id: '2', a: 22 }, { id: '3', a: 3 }]
    const merged = mergeById(oldArr, newArr)
    const asMap = new Map(merged.map(x => [x.id, x]))
    expect(asMap.get('1').a).toBe(1)
    expect(asMap.get('2').a).toBe(22)
    expect(asMap.get('3').a).toBe(3)
  })

  it('normCat normaliza categorías', () => {
    expect(normCat('Dulces')).toBe('dulces')
    expect(normCat('SALADOS')).toBe('salados')
    expect(normCat('No comestible')).toBe('nocom')
    expect(normCat('X')).toBe('otros')
  })
})

