
export const auth = {} as any

export function onAuthStateChanged(_auth, cb) {
  cb(null)
  return () => {}
}

