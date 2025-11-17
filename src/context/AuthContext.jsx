import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { onAuth, loginAs, logout } from '../firebase/auth'
import { db } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuth(async (firebaseUser) => {
      setUser(firebaseUser)

      if (!firebaseUser) {
        setRole(null)
        setLoading(false)
        return
      }

      try {
        const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
        setRole(snap.exists() ? snap.data()?.rol || 'usuario' : 'usuario')
      } catch (error) {
        console.error('Error reading user role', error)
        setRole('usuario')
      } finally {
        setLoading(false)
      }
    })

    return () => {
      if (unsub) unsub()
    }
  }, [])

  const value = useMemo(
    () => ({ user, role, loading, loginAs, logout }),
    [user, role, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
