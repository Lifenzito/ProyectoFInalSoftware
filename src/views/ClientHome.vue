<!-- src/views/ClientHome.vue -->
<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'

const router = useRouter()

/* ========= LocalStorage keys ========= */
const LS = {
  dulces:  'antojoupb.v1.client.dulces',
  salados: 'antojoupb.v1.client.salados',
  nocom:   'antojoupb.v1.client.nocom',
  cart:    'antojoupb.v1.client.cart',
  loc:     'antojoupb.v1.client.location',
  phone:   'antojoupb.v1.client.phone'
}
function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) } catch { return fallback }
}
function writeLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

/* ========= helpers ========= */
function toMillis(ts) {
  if (!ts) return 0
  if (typeof ts === 'object' && 'seconds' in ts) return ts.seconds * 1000
  return 0
}

/* Normalización robusta de categorías */
function normCat(raw){
  const n = String(raw ?? '').trim().toLowerCase().replace(/\s+/g,' ')
  if (n.startsWith('dulc')) return 'dulces'
  if (n.startsWith('salad')) return 'salados'
  if (n.includes('no') && n.includes('comest')) return 'nocom'
  return 'otros'
}

/* ========= Estado por categoría ========= */
const dulces  = ref([])
const salados = ref([])
const noCom   = ref([])

/* ========= refs scroller ========= */
const dulcesRef  = ref(null)
const saladosRef = ref(null)
const noComRef   = ref(null)

/* ========= estado flechas ========= */
const dulcesAr  = ref({ left:false, right:false })
const saladosAr = ref({ left:false, right:false })
const noComAr   = ref({ left:false, right:false })

function updateArrows(el, state){
  if (!el) return
  const L  = el.scrollLeft
  const W  = el.clientWidth
  const SW = el.scrollWidth
  state.left  = L > 1
  state.right = (SW - (L + W)) > 1
}
function forceRecalcArrows(elRef, stateRef){
  const el = elRef?.value
  if (!el) return
  updateArrows(el, stateRef.value)
  requestAnimationFrame(() => updateArrows(el, stateRef.value))
  setTimeout(() => updateArrows(el, stateRef.value), 220)
}

/* ========= Scroll Listener (sin interferir con scroll vertical) ========= */
const scrollCleanups = []
function watchScroller(elRef, stateRef){
  nextTick(() => {
    const el = elRef.value
    if (!el) return
    const onScroll = () => updateArrows(el, stateRef.value)
    updateArrows(el, stateRef.value)
    el.addEventListener('scroll', onScroll, { passive:true })
    scrollCleanups.push(() => el.removeEventListener('scroll', onScroll))
  })
}

/* ========= Firestore: traigo todos y separo por categoría ========= */
let unsubs = []
function clearListeners(){ unsubs.forEach(u => { try { u && u() } catch {} }); unsubs = [] }

function hydrateFromCache() {
  dulces.value  = readLS(LS.dulces,  [])
  salados.value = readLS(LS.salados, [])
  noCom.value   = readLS(LS.nocom,   [])
}

/* ✅ Reconstruye una categoría SOLO con lo que llega del snapshot.
      Si el id existe en cache, se hace merge de campos; si no llega, NO se queda. */
function rebuildCategory(lsKey, incomingArr){
  const prev = readLS(lsKey, [])
  const prevMap = new Map(prev.map(p => [p.id, p]))
  const out = incomingArr.map(p => ({ ...prevMap.get(p.id), ...p }))
  out.sort((a,b)=> toMillis(b.createdAt) - toMillis(a.createdAt))
  writeLS(lsKey, out)
  return out
}

function listenAll(){
  const qAll = query(
    collection(db, 'productos'),
    orderBy('createdAt','desc'),
    limit(200)
  )
  const u = onSnapshot(qAll, async snap => {
    const incomingRaw = snap.docs.map(d => {
      const data = d.data() || {}
      return {
        id: d.id,
        title: data.title || '',
        price: Number(data.price ?? 0),
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        sellerId: data.sellerId || 'anon',
        sellerName: data.sellerName || data.sellerId || 'Vendedor',
        sellerPhone: data.sellerPhone || '',
        createdAt: data.createdAt || null,
        _cat: normCat(data.category)
      }
    })

    // separar por categoría (solo snapshot — así desaparecen borrados)
    const arrD = incomingRaw.filter(p => p._cat === 'dulces')
    const arrS = incomingRaw.filter(p => p._cat === 'salados')
    const arrN = incomingRaw.filter(p => p._cat === 'nocom')

    // reconstruir categorías con snapshot; cache se reescribe
    dulces.value  = rebuildCategory(LS.dulces,  arrD)
    salados.value = rebuildCategory(LS.salados, arrS)
    noCom.value   = rebuildCategory(LS.nocom,   arrN)

    await nextTick()
    forceRecalcArrows(dulcesRef,  dulcesAr)
    forceRecalcArrows(saladosRef, saladosAr)
    forceRecalcArrows(noComRef,   noComAr)
  })
  unsubs.push(u)
}

function startAll(){
  clearListeners()
  listenAll()

  watchScroller(dulcesRef,  dulcesAr)
  watchScroller(saladosRef, saladosAr)
  watchScroller(noComRef,   noComAr)

  nextTick(() => {
    forceRecalcArrows(dulcesRef,  dulcesAr)
    forceRecalcArrows(saladosRef, saladosAr)
    forceRecalcArrows(noComRef,   noComAr)
  })
}

/* ========= Carrito ========= */
const cart = ref(readLS(LS.cart, []))
const cartOpen = ref(false)
const popupOpen = ref(false)
const selectedProd = ref(null)

function openPopup(prod){ selectedProd.value = prod; popupOpen.value = true }
function closePopup(){ popupOpen.value = false; selectedProd.value = null }

function addToCart(prod){
  const idx = cart.value.findIndex(p => p.id === prod.id)
  if (idx >= 0) {
    cart.value[idx].quantity += 1
  } else {
    cart.value.push({
      id: prod.id,
      title: prod.title,
      price: Number(prod.price) || 0,
      sellerId: prod.sellerId,
      sellerName: prod.sellerName || 'Vendedor',
      sellerPhone: prod.sellerPhone || '',
      imageUrl: prod.imageUrl || '',
      quantity: 1
    })
  }
  writeLS(LS.cart, cart.value)
  popupOpen.value = false
}
function removeFromCart(id){
  cart.value = cart.value.filter(p => p.id !== id)
  writeLS(LS.cart, cart.value)
}
function clearCart(){
  cart.value = []
  writeLS(LS.cart, cart.value)
}

const cartCount = computed(() => cart.value.reduce((a,b)=>a + (b.quantity||1), 0))
const cartTotal = computed(() => cart.value.reduce((a,b)=>a + (b.price * (b.quantity||1)), 0))

// Datos cliente
const clientLocation = ref(readLS(LS.loc, ''))
const clientPhone    = ref(readLS(LS.phone, ''))
watch(clientLocation, v => writeLS(LS.loc, v))
watch(clientPhone,    v => writeLS(LS.phone, v))

// ✅ Checkout con verificación de sesión y buyerId/buyerEmail
async function checkout(){
  if (!clientLocation.value?.trim() || !clientPhone.value?.trim()) {
    alert('Por favor ingresa tu ubicación en el campus y tu teléfono.')
    return
  }
  if (cart.value.length === 0) {
    alert('Tu carrito está vacío.')
    return
  }

  // Verificar sesión
  const user = auth.currentUser
  if (!user) {
    alert('Debes iniciar sesión para poder comprar.')
    router.push('/login')
    return
  }

  const bySeller = new Map()
  for (const it of cart.value) {
    if (!bySeller.has(it.sellerId)) bySeller.set(it.sellerId, [])
    bySeller.get(it.sellerId).push(it)
  }

  const clientEmail = user.email || 'anon'
  const buyerId = user.uid
  const created = []

  for (const [sellerId, items] of bySeller.entries()) {
    const total = items.reduce((a,b)=> a + b.price * (b.quantity||1), 0)
    const payload = {
      sellerId,
      buyerId,
      buyerEmail: clientEmail,
      items: items.map(i => ({ id: i.id, title: i.title, price: i.price, quantity: i.quantity || 1 })),
      total,
      clientEmail,
      clientPhone: clientPhone.value.trim(),
      clientLocation: clientLocation.value.trim(),
      createdAt: serverTimestamp()
    }
    await addDoc(collection(db, 'pedidos'), payload)
    created.push({ sellerId, items, total, sellerPhone: items[0]?.sellerPhone || '' , sellerName: items[0]?.sellerName || 'Vendedor'})
  }

  const now = new Date()
  let factura = ''
  factura += `AntojosUPB — Factura\n`
  factura += `Fecha: ${now.toLocaleString()}\n`
  factura += `Cliente: ${clientEmail}\n`
  factura += `Teléfono cliente: ${clientPhone.value}\n`
  factura += `Ubicación en campus: ${clientLocation.value}\n`
  factura += `----------------------------------------\n`
  for (const group of created) {
    factura += `Vendedor: ${group.sellerName} — Tel: ${group.sellerPhone}\n`
    for (const it of group.items) {
      factura += `  • ${it.title} x${it.quantity || 1} — $${it.price}\n`
    }
    factura += `  Subtotal vendedor: $${group.total}\n`
    factura += `----------------------------------------\n`
  }
  factura += `TOTAL: $${cartTotal.value}\n`

  const blob = new Blob([factura], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `factura_antojoupb_${now.getFullYear()}-${(now.getMonth()+1)}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  clearCart()
  cartOpen.value = false
  alert('Pedido enviado ✅')
}

/* ========= ciclo de vida ========= */
let unsubsAuth = null
let detachResize = null
onMounted(()=>{
  hydrateFromCache()
  unsubsAuth = onAuthStateChanged(auth, () => { startAll() })
  const onR = () => {
    forceRecalcArrows(dulcesRef,  dulcesAr)
    forceRecalcArrows(saladosRef, saladosAr)
    forceRecalcArrows(noComRef,   noComAr)
  }
  window.addEventListener('resize', onR)
  detachResize = () => window.removeEventListener('resize', onR)
})
onUnmounted(()=>{
  clearListeners()
  unsubsAuth && unsubsAuth()
  detachResize && detachResize()
  scrollCleanups.forEach(fn => { try { fn() } catch {} })
})

/* ========= Flechas ========= */
const STEP = 320
function prev(refEl){ refEl?.value?.scrollBy({ left: -STEP, behavior: 'smooth' }) }
function next(refEl){ refEl?.value?.scrollBy({ left:  STEP, behavior: 'smooth' }) }
</script>

<template>
  <main class="min-h-screen bg-neutral-900 text-white p-4 sm:p-6 space-y-10 overflow-x-hidden">
    <!-- FAB Carrito -->
    <button
      class="fixed top-14 right-40 z-[70] bg-red-600 text-white rounded-full shadow-lg px-3 py-2 flex items-center gap-1"
      @click="cartOpen = !cartOpen" aria-label="Carrito">
      🛒 <span v-if="cartCount" class="bg-white text-red-600 rounded-full px-2 font-bold">{{ cartCount }}</span>
    </button>

    <!-- ========== DULCES ========== -->
    <section class="space-y-2">
      <h2 class="text-xl font-bold">Dulces</h2>

      <div class="relative">
        <button
          v-show="dulcesAr.left"
          @click="prev(dulcesRef)"
          class="hidden sm:grid place-items-center absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-neutral-700 bg-neutral-800/90 hover:bg-red-600 hover:border-red-600 z-20">
          ‹
        </button>

        <div
          ref="dulcesRef"
          class="overflow-x-auto overflow-y-hidden whitespace-nowrap pr-12 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-neutral-800"
        >
          <button
            v-for="p in dulces" :key="p.id"
            type="button"
            @click="openPopup(p)"
            class="inline-block align-top w-64 bg-neutral-800 border border-neutral-700 rounded-xl p-3 mr-3 last:mr-0 text-left hover:border-red-600 transition"
            title="Ver opciones"
          >
            <img v-if="p.imageUrl" :src="p.imageUrl" alt="" class="w-full h-52 object-cover rounded-lg mb-2" />
            <div class="font-bold text-lg truncate">{{ p.title }}</div>
            <div class="text-red-500 font-semibold mt-1">$ {{ p.price }}</div>
            <div class="text-xs opacity-70">Vendedor: {{ p.sellerName }}</div>
            <p v-if="p.description" class="text-sm opacity-80 line-clamp-2 mt-1">{{ p.description }}</p>
          </button>
        </div>

        <button
          v-show="dulcesAr.right"
          @click="next(dulcesRef)"
          class="hidden sm:grid place-items-center absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-neutral-700 bg-neutral-800/90 hover:bg-red-600 hover:border-red-600 z-20">
          ›
        </button>
      </div>
    </section>

    <!-- ========== SALADOS ========== -->
    <section class="space-y-2">
      <h2 class="text-xl font-bold">Salados</h2>

      <div class="relative">
        <button
          v-show="saladosAr.left"
          @click="prev(saladosRef)"
          class="hidden sm:grid place-items-center absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-neutral-700 bg-neutral-800/90 hover:bg-red-600 hover:border-red-600 z-20">
          ‹
        </button>

        <div
          ref="saladosRef"
          class="overflow-x-auto overflow-y-hidden whitespace-nowrap pr-12 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-neutral-800"
        >
          <button
            v-for="p in salados" :key="p.id"
            type="button"
            @click="openPopup(p)"
            class="inline-block align-top w-64 bg-neutral-800 border border-neutral-700 rounded-xl p-3 mr-3 last:mr-0 text-left hover:border-red-600 transition"
            title="Ver opciones"
          >
            <img v-if="p.imageUrl" :src="p.imageUrl" alt="" class="w-full h-52 object-cover rounded-lg mb-2" />
            <div class="font-bold text-lg truncate">{{ p.title }}</div>
            <div class="text-red-500 font-semibold mt-1">$ {{ p.price }}</div>
            <div class="text-xs opacity-70">Vendedor: {{ p.sellerName }}</div>
            <p v-if="p.description" class="text-sm opacity-80 line-clamp-2 mt-1">{{ p.description }}</p>
          </button>
        </div>

        <button
          v-show="saladosAr.right"
          @click="next(saladosRef)"
          class="hidden sm/grid place-items-center absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-neutral-700 bg-neutral-800/90 hover:bg-red-600 hover:border-red-600 z-20">
          ›
        </button>
      </div>
    </section>

    <!-- ========== NO COMESTIBLE ========== -->
    <section class="space-y-2">
      <h2 class="text-xl font-bold">No comestible</h2>

      <div class="relative">
        <button
          v-show="noComAr.left"
          @click="prev(noComRef)"
          class="hidden sm:grid place-items-center absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-neutral-700 bg-neutral-800/90 hover:bg-red-600 hover:border-red-600 z-20">
          ‹
        </button>

        <div
          ref="noComRef"
          class="overflow-x-auto overflow-y-hidden whitespace-nowrap pr-12 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-neutral-800"
        >
          <button
            v-for="p in noCom" :key="p.id"
            type="button"
            @click="openPopup(p)"
            class="inline-block align-top w-64 bg-neutral-800 border border-neutral-700 rounded-xl p-3 mr-3 last:mr-0 text-left hover:border-red-600 transition"
            title="Ver opciones"
          >
            <img v-if="p.imageUrl" :src="p.imageUrl" alt="" class="w-full h-52 object-cover rounded-lg mb-2" />
            <div class="font-bold text-lg truncate">{{ p.title }}</div>
            <div class="text-red-500 font-semibold mt-1">$ {{ p.price }}</div>
            <div class="text-xs opacity-70">Vendedor: {{ p.sellerName }}</div>
            <p v-if="p.description" class="text-sm opacity-80 line-clamp-2 mt-1">{{ p.description }}</p>
          </button>
        </div>

        <button
          v-show="noComAr.right"
          @click="next(noComRef)"
          class="hidden sm/grid place-items-center absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-neutral-700 bg-neutral-800/90 hover:bg-red-600 hover:border-red-600 z-20">
          ›
        </button>
      </div>
    </section>

    <!-- Modal simple -->
    <div v-if="popupOpen" class="fixed inset-0 bg-black/50 grid place-items-center z-50" @click.self="closePopup">
      <div class="w-[min(92vw,520px)] bg-neutral-800 border border-neutral-700 rounded-xl p-4">
        <h3 class="text-lg font-bold mb-2">¿Agregar al carrito?</h3>
        <div v-if="selectedProd" class="flex items-center gap-3 mb-3">
          <img v-if="selectedProd.imageUrl" :src="selectedProd.imageUrl" class="w-20 h-20 object-cover rounded-md" />
          <div>
            <div class="font-bold">{{ selectedProd.title }}</div>
            <div>$ {{ selectedProd.price }}</div>
            <div class="text-sm opacity-70">Vendedor: {{ selectedProd.sellerName }}</div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700" @click="addToCart(selectedProd)">Agregar</button>
          <button class="px-3 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600" @click="closePopup">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Drawer carrito -->
    <aside
  class="fixed top-0 right-0 h-screen w-[380px] max-w-[92vw] bg-neutral-900 border-l border-neutral-800 shadow-xl transition-transform duration-200 z-[60] flex flex-col"
  :class="cartOpen ? 'translate-x-0' : 'translate-x-full'"
>
  <!-- Header -->
  <header class="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
    <h3 class="text-lg font-bold">Tu carrito</h3>
    <button class="px-2 py-1 rounded-md bg-neutral-700 hover:bg-neutral-600" @click="cartOpen=false">✕</button>
  </header>

  <!-- Contenido scrolleable -->
  <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 pb-24">
    <div v-if="!cart.length" class="opacity-70">Tu carrito está vacío.</div>

    <div v-for="item in cart" :key="item.id" class="flex items-center gap-3 pb-3 border-b border-neutral-800">
      <img v-if="item.imageUrl" :src="item.imageUrl" class="w-14 h-14 object-cover rounded-md" />
      <div class="flex-1">
        <div class="font-bold">{{ item.title }}</div>
        <div class="text-sm opacity-70">{{ item.sellerName }} — {{ item.sellerPhone }}</div>
        <div>$ {{ item.price }} · x{{ item.quantity || 1 }}</div>
      </div>
      <button class="px-2 py-1 rounded-md bg-red-700 hover:bg-red-800" @click="removeFromCart(item.id)">Quitar</button>
    </div>

    <label class="text-sm opacity-80">Ubicación dentro del campus (obligatorio)</label>
    <textarea rows="3" v-model="clientLocation" class="w-full rounded-md bg-neutral-800 border border-neutral-700 p-2"></textarea>

    <label class="text-sm opacity-80">Tu teléfono (obligatorio)</label>
    <input type="tel" v-model="clientPhone" class="w-full rounded-md bg-neutral-800 border border-neutral-700 p-2" placeholder="300 123 4567" />
  </div>

  <!-- Footer sticky SIEMPRE visible -->
  <footer class="sticky bottom-0 bg-neutral-900 px-4 py-3 border-t border-neutral-800 flex items-center justify-between">
    <div class="font-bold">Total: $ {{ cartTotal }}</div>
    <button class="px-3 py-2 rounded-md bg-red-600 disabled:opacity-50" :disabled="!cart.length" @click="checkout">
      Generar factura .txt y pedir
    </button>
  </footer>
</aside>
  </main>
</template>

<style scoped>
/* Scrollbar bonita (si no usas plugin oficial) */
.scrollbar-thin::-webkit-scrollbar { height: 8px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background-color: #dc2626; border-radius: 9999px; }
.scrollbar-thin::-webkit-scrollbar-track { background-color: #262626; }
</style>