import { auth, db } from './config'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

const provider = new GoogleAuthProvider()

async function ensureUserDoc(user, rol) {
  const ref = doc(db, 'usuarios', user.uid)
  await setDoc(ref, {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    rol,
    updatedAt: serverTimestamp()
  }, { merge: true })
}

export async function loginAs(rol = 'cliente') {
  const res = await signInWithPopup(auth, provider)
  await ensureUserDoc(res.user, rol)
  return res.user
}

export async function logout() { await signOut(auth) }

export function onAuth(cb) { return onAuthStateChanged(auth, cb) }