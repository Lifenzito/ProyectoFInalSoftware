import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { db } from '../firebase/config'
import { uploadProductImage } from '../firebase/storage'

const SellerContext = createContext(null)

function LS_KEYS(uid) {
  return {
    profile: `antojoupb.v1.seller.${uid}.profile`,
    products: `antojoupb.v1.seller.${uid}.products`,
    orders: `antojoupb.v1.seller.${uid}.orders`,
  }
}

function readJSON(key, fallback = null) {
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

export function SellerProvider({ children }) {
  const { user } = useAuth()
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [publishing, setPublishing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (!user) return

    const keys = LS_KEYS(user.uid)
    const cachedProfile = readJSON(keys.profile)
    const cachedProducts = readJSON(keys.products)
    const cachedOrders = readJSON(keys.orders)

    if (cachedProfile) {
      setProfileName(cachedProfile.displayName || '')
      setProfilePhone(cachedProfile.phone || '')
    }
    if (cachedProducts) setProducts(cachedProducts)
    if (cachedOrders) setOrders(cachedOrders)

    let unsubProducts = null
    let unsubOrders = null

    const loadProfile = async () => {
      const snap = await getDoc(doc(db, 'usuarios', user.uid))
      if (snap.exists()) {
        const data = snap.data() || {}
        setProfileName(data.displayName || '')
        setProfilePhone(data.phone || '')
        writeJSON(keys.profile, { displayName: data.displayName || '', phone: data.phone || '' })
      }
    }

    loadProfile()

    const qProd = query(
      collection(db, 'productos'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    unsubProducts = onSnapshot(qProd, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      setProducts(list)
      writeJSON(keys.products, list)
    })

    const qOrders = query(
      collection(db, 'pedidos'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      setOrders(list)
      writeJSON(keys.orders, list)
    })

    return () => {
      unsubProducts && unsubProducts()
      unsubOrders && unsubOrders()
    }
  }, [user])

  const saveProfile = useCallback(async () => {
    if (!user) return
    setSavingProfile(true)
    try {
      await setDoc(
        doc(db, 'usuarios', user.uid),
        { displayName: profileName, phone: profilePhone, updatedAt: serverTimestamp() },
        { merge: true }
      )
      writeJSON(LS_KEYS(user.uid).profile, { displayName: profileName, phone: profilePhone })
      alert('Perfil guardado')
    } finally {
      setSavingProfile(false)
    }
  }, [user, profileName, profilePhone])

  const publishProduct = useCallback(
    async ({ title, price, description, category, file }) => {
      if (!user) return
      if (!profileName || !profilePhone) {
        alert('Completa tu perfil con nombre y teléfono antes de publicar.')
        return
      }

      setPublishing(true)
      try {
        let imageUrl = ''
        if (file) {
          imageUrl = await uploadProductImage(file)
        }

        const payload = {
          title,
          price: Number(price),
          description: description || '',
          category,
          imageUrl,
          sellerId: user.uid,
          sellerName: profileName,
          sellerPhone: profilePhone,
          createdAt: serverTimestamp(),
        }

        const optimistic = {
          id: `temp-${Date.now()}`,
          ...payload,
          createdAt: null,
        }

        setProducts((prev) => {
          const next = [optimistic, ...prev]
          writeJSON(LS_KEYS(user.uid).products, next)
          return next
        })

        await addDoc(collection(db, 'productos'), payload)
        alert('Producto publicado 🚀')
      } catch (error) {
        console.error(error)
        alert('Error publicando: ' + error.message)
      } finally {
        setPublishing(false)
      }
    },
    [user, profileName, profilePhone]
  )

  const deleteProduct = useCallback(
    async (id) => {
      if (!id || !user) return
      if (!confirm('¿Eliminar este producto?')) return
      await deleteDoc(doc(db, 'productos', id))
      setProducts((prev) => {
        const next = prev.filter((item) => item.id !== id)
        writeJSON(LS_KEYS(user.uid).products, next)
        return next
      })
    },
    [user]
  )

  const markAsDispatched = useCallback(
    async (id) => {
      if (!id || !user) return
      if (!confirm('¿Marcar este pedido como despachado?')) return
      await deleteDoc(doc(db, 'pedidos', id))
      setOrders((prev) => {
        const next = prev.filter((order) => order.id !== id)
        writeJSON(LS_KEYS(user.uid).orders, next)
        return next
      })
    },
    [user]
  )

  const value = useMemo(
    () => ({
      profileName,
      setProfileName,
      profilePhone,
      setProfilePhone,
      saveProfile,
      savingProfile,
      products,
      publishProduct,
      publishing,
      deleteProduct,
      orders,
      markAsDispatched,
    }),
    [
      profileName,
      profilePhone,
      saveProfile,
      savingProfile,
      products,
      publishProduct,
      publishing,
      deleteProduct,
      orders,
      markAsDispatched,
    ]
  )

  return <SellerContext.Provider value={value}>{children}</SellerContext.Provider>
}

export function useSeller() {
  const ctx = useContext(SellerContext)
  if (!ctx) throw new Error('useSeller must be used within SellerProvider')
  return ctx
}
