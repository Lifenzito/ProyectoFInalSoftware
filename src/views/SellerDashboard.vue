<!-- src/views/SellerDashboard.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase/config'
import {
  doc, getDoc, setDoc, serverTimestamp, collection, addDoc,
  query, where, orderBy, onSnapshot, deleteDoc
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { uploadProductImage } from '../firebase/storage'

const router = useRouter()
const currentUser = ref(null)

/* ================================
   LocalStorage helpers (aislado por vendedor)
================================== */
function LS_KEYS(uid) {
  return {
    profile:  `antojoupb.v1.seller.${uid}.profile`,
    products: `antojoupb.v1.seller.${uid}.products`,
    orders:   `antojoupb.v1.seller.${uid}.orders`,
  }
}
function readJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

/* ================================
   Perfil de vendedor
================================== */
const profileName  = ref('')
const profilePhone = ref('')

async function loadProfile () {
  const snap = await getDoc(doc(db, 'usuarios', currentUser.value.uid))
  if (snap.exists()) {
    const data = snap.data() || {}
    profileName.value  = data.displayName || ''
    profilePhone.value = data.phone || ''
  }
}

async function saveProfile () {
  await setDoc(
    doc(db, 'usuarios', currentUser.value.uid),
    {
      displayName: profileName.value,
      phone: profilePhone.value,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
  const keys = LS_KEYS(currentUser.value.uid)
  writeJSON(keys.profile, { displayName: profileName.value, phone: profilePhone.value })
  alert('Perfil guardado')
}

/* ================================
   Publicar + mis productos
================================== */
const title    = ref('')
const price    = ref(null)
const desc     = ref('')
const category = ref('Salados')
const file     = ref(null)
const loading  = ref(false)

function onPick (e) { file.value = e.target.files?.[0] || null }

const misProductos = ref([])
let unProd = null

function listenMyProducts () {
  unProd && unProd()
  const qProd = query(
    collection(db, 'productos'),
    where('sellerId', '==', currentUser.value.uid),
    orderBy('createdAt', 'desc')
  )
  const keys = LS_KEYS(currentUser.value.uid)
  unProd = onSnapshot(qProd, (s) => {
    const productos = s.docs.map(d => ({ id: d.id, ...d.data() }))
    misProductos.value = productos
    writeJSON(keys.products, productos) // cache siempre
  })
}

async function publish () {
  if (!profileName.value || !profilePhone.value) return alert('Completa tu nombre y teléfono en el perfil.')
  if (!title.value || !price.value || !category.value) return alert('Faltan campos')

  loading.value = true
  try {
    let imageUrl = ''
    if (file.value) imageUrl = await uploadProductImage(file.value)

    // feedback inmediato en cache/UI
    const keys   = LS_KEYS(currentUser.value.uid)
    const cached = readJSON(keys.products, [])
    writeJSON(keys.products, [
      {
        title: title.value,
        price: Number(price.value),
        description: desc.value || '',
        category: category.value,
        imageUrl,
        sellerId: currentUser.value.uid,
        sellerName: profileName.value,
        sellerPhone: profilePhone.value,
        createdAt: null,
      },
      ...cached,
    ])
    misProductos.value = readJSON(keys.products, [])

    await addDoc(collection(db, 'productos'), {
      title: title.value,
      price: Number(price.value),
      description: desc.value || '',
      category: category.value,
      imageUrl,
      sellerId: currentUser.value.uid,
      sellerName: profileName.value,
      sellerPhone: profilePhone.value,
      createdAt: serverTimestamp(),
    })

    // limpia inputs
    title.value = ''
    price.value = null
    desc.value  = ''
    file.value  = null

    alert('Producto publicado 🚀')
  } catch (err) {
    console.error(err)
    alert('Error publicando: ' + err.message)
  } finally {
    loading.value = false
  }
}

/* 🔥 Eliminar producto del vendedor — también limpia cache/UI al instante */
async function deleteProduct (id) {
  if (!id) return
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
  try {
    await deleteDoc(doc(db, 'productos', id))
    // 🔽 Sincroniza UI y cache de inmediato (por si el snapshot tarda)
    const keys = LS_KEYS(currentUser.value.uid)
    misProductos.value = misProductos.value.filter(p => p.id !== id)
    writeJSON(keys.products, misProductos.value)
  } catch (err) {
    console.error(err)
    alert('Error eliminando producto: ' + err.message)
  }
}

/* ================================
   Pedidos recibidos
================================== */
const pedidos = ref([])
let unOrders = null

function listenMyOrders () {
  unOrders && unOrders()
  const qOrders = query(
    collection(db, 'pedidos'),
    where('sellerId', '==', currentUser.value.uid),
    orderBy('createdAt', 'desc')
  )
  const keys = LS_KEYS(currentUser.value.uid)
  unOrders = onSnapshot(qOrders, (s) => {
    const list = s.docs.map(d => ({ id: d.id, ...d.data() }))
    pedidos.value = list
    writeJSON(keys.orders, list) // cache siempre
  })
}

/* ✅ Marcar pedido como despachado — eliminar y limpiar cache/UI al instante */
async function markAsDispatched (id) {
  if (!id) return
  if (!confirm('¿Marcar este pedido como despachado?')) return
  try {
    await deleteDoc(doc(db, 'pedidos', id))
    // 🔽 Sincroniza UI y cache al toque
    const keys = LS_KEYS(currentUser.value.uid)
    pedidos.value = pedidos.value.filter(o => o.id !== id)
    writeJSON(keys.orders, pedidos.value)
  } catch (err) {
    console.error(err)
    alert('Error al despachar: ' + err.message)
  }
}

/* ================================
   Auth + cache
================================== */
let unsubAuth = null
onMounted(() => {
  unsubAuth = onAuthStateChanged(auth, async (u) => {
    if (!u) return router.replace('/')

    currentUser.value = u
    const keys = LS_KEYS(u.uid)

    // hidrata desde cache (rápido)
    const cachedProfile  = readJSON(keys.profile)
    const cachedProducts = readJSON(keys.products)
    const cachedOrders   = readJSON(keys.orders)
    if (cachedProfile) {
      profileName.value  = cachedProfile.displayName || ''
      profilePhone.value = cachedProfile.phone || ''
    }
    if (cachedProducts) misProductos.value = cachedProducts
    if (cachedOrders)   pedidos.value      = cachedOrders

    // sincroniza con Firestore
    await loadProfile()
    writeJSON(keys.profile, { displayName: profileName.value, phone: profilePhone.value })

    listenMyProducts()
    listenMyOrders()
  })
})

onUnmounted(() => {
  unsubAuth && unsubAuth()
  unProd && unProd()
  unOrders && unOrders()
})
</script>

<template>
  <main class="wrap">
    <!-- Perfil -->
    <section class="card">
      <h2>👤 Perfil de vendedor</h2>
      <div class="grid">
        <input placeholder="Tu nombre para mostrar" v-model="profileName" />
        <input placeholder="Tu teléfono de contacto" v-model="profilePhone" />
      </div>
      <button @click="saveProfile">Guardar perfil</button>
    </section>

    <!-- Publicar -->
    <section class="card">
      <h2>📦 Publicar producto</h2>
      <div class="grid">
        <input placeholder="Nombre" v-model="title" />
        <input type="number" placeholder="Precio" v-model="price" />
        <select v-model="category">
          <option>Salados</option>
          <option>Dulces</option>
          <option>No Comestible</option>
        </select>
        <textarea rows="3" placeholder="Descripción" v-model="desc"></textarea>
        <input type="file" accept="image/*" @change="onPick" />
      </div>
      <button :disabled="loading" @click="publish">Publicar</button>
    </section>

    <!-- Mis productos -->
    <section class="card">
      <h2>🧾 Mis productos</h2>
      <div v-if="!misProductos.length" class="hint">Aún no has publicado nada.</div>

      <div v-for="p in misProductos" :key="p.id" class="row">
        <img v-if="p.imageUrl" :src="p.imageUrl" class="thumb" />
        <div class="info">
          <div class="line">
            <b>{{ p.title }}</b> — ${{ p.price }}
          </div>
          <div class="muted">{{ p.category }} · {{ p.sellerName }} ({{ p.sellerPhone }})</div>
          <div class="muted">{{ p.description }}</div>
        </div>

        <!-- Botón eliminar -->
        <div class="actions">
          <button class="btn-danger" @click="deleteProduct(p.id)">Eliminar</button>
        </div>
      </div>
    </section>

    <!-- Pedidos -->
    <section class="card">
      <h2>🛒 Pedidos recibidos</h2>
      <div v-if="!pedidos.length" class="hint">Aún no tienes pedidos.</div>

      <div v-for="o in pedidos" :key="o.id" class="row">
        <div class="info">
          <div class="line">
            <b>Pedido</b> —
            {{ new Date(o.createdAt?.seconds * 1000 || Date.now()).toLocaleString() }}
          </div>
          <div class="muted">Cliente: {{ o.clientEmail }} · Tel: {{ o.clientPhone }}</div>
          <div class="muted">Ubicación: {{ o.clientLocation }}</div>
          <ul class="muted">
            <li v-for="it in o.items" :key="it.id">• {{ it.title }} x{{ it.quantity || 1 }} — ${{ it.price }}</li>
          </ul>
          <div class="line between">
            <b>Total: ${{ o.total }}</b>
            <button class="btn-ok" @click="markAsDispatched(o.id)">✅ Despachado</button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.wrap{max-width:900px;margin:1rem auto;padding:1rem;color:#fff}
.card{background:#2a2a2a;border-radius:.8rem;padding:1rem;margin-bottom:1rem}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
input,textarea,select{width:100%;padding:.6rem;border:1px solid #444;border-radius:.6rem;background:#1c1c1c;color:#fff}
button{margin-top:.6rem;padding:.6rem .9rem;border:1px solid #444;border-radius:.6rem;background:#e60000;color:#fff;cursor:pointer}
button:disabled{opacity:.5;cursor:not-allowed}
.row{display:flex;gap:.8rem;padding:.6rem 0;border-bottom:1px solid #444;align-items:flex-start}
.thumb{width:80px;height:80px;object-fit:cover;border-radius:.4rem}
.info{display:flex;flex-direction:column;gap:.25rem;flex:1}
.line{display:flex;align-items:center;gap:.5rem}
.between{justify-content:space-between}
.muted{opacity:.75;font-size:.9rem}
.hint{opacity:.7}

.actions{display:flex;align-items:center;gap:.5rem;margin-left:auto}
.btn-danger{background:#7f1d1d;border:1px solid #f87171;color:#fff;padding:.4rem .7rem;border-radius:.5rem;margin-top:0}
.btn-danger:hover{background:#ef4444}

.btn-ok{background:#166534;border:1px solid #22c55e;color:#fff;padding:.4rem .7rem;border-radius:.5rem;margin-top:0}
.btn-ok:hover{background:#22c55e}
</style>