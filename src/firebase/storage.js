import { storage } from './config'
import { auth } from './config'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export async function uploadProductImage(file) {
  const uid = auth.currentUser?.uid || 'anon'
  const path = `productos/${uid}/${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file)
  return await getDownloadURL(fileRef)
}
