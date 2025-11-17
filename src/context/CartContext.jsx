import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const CART_KEY = 'antojoupb.v1.client.cart'
const LOC_KEY = 'antojoupb.v1.client.location'
const PHONE_KEY = 'antojoupb.v1.client.phone'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readJSON(CART_KEY, []))
  const [isOpen, setIsOpen] = useState(false)
  const [lastAddedId, setLastAddedId] = useState(null)
  const [clientLocation, setClientLocation] = useState(() => readJSON(LOC_KEY, ''))
  const [clientPhone, setClientPhone] = useState(() => readJSON(PHONE_KEY, ''))

  useEffect(() => {
    writeJSON(CART_KEY, items)
  }, [items])

  useEffect(() => {
    writeJSON(LOC_KEY, clientLocation)
  }, [clientLocation])

  useEffect(() => {
    writeJSON(PHONE_KEY, clientPhone)
  }, [clientPhone])

  useEffect(() => {
    if (!lastAddedId) return
    const timer = setTimeout(() => setLastAddedId(null), 800)
    return () => clearTimeout(timer)
  }, [lastAddedId])

  const addItem = useCallback((product) => {
    if (!product) return
    setItems((prev) => {
      const next = [...prev]
      const idx = next.findIndex((it) => it.id === product.id)
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          quantity: (next[idx].quantity || 1) + 1,
        }
      } else {
        next.push({
          id: product.id,
          title: product.title,
          price: Number(product.price) || 0,
          sellerId: product.sellerId,
          sellerName: product.sellerName || 'Vendedor',
          sellerPhone: product.sellerPhone || '',
          imageUrl: product.imageUrl || '',
          quantity: 1,
        })
      }
      return next
    })
    setLastAddedId(product.id)
  }, [])

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const cartCount = useMemo(
    () => items.reduce((acc, item) => acc + (item.quantity || 1), 0),
    [items]
  )

  const cartTotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0),
    [items]
  )

  const value = useMemo(
    () => ({
      items,
      isOpen,
      setIsOpen,
      addItem,
      removeItem,
      clearCart,
      cartCount,
      cartTotal,
      lastAddedId,
      clientLocation,
      setClientLocation,
      clientPhone,
      setClientPhone,
    }),
    [
      items,
      isOpen,
      setIsOpen,
      addItem,
      removeItem,
      clearCart,
      cartCount,
      cartTotal,
      lastAddedId,
      clientLocation,
      clientPhone,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
