<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { cart } from '../store/cart'

const router = useRouter()
const clientPhone = ref('')
const clientLocation = ref('') // ubicación dentro del campus
const loading = ref(false)

function groupBySeller(items){
  const map = {}
  for(const it of items){
    (map[it.sellerId] ||= []).push(it)
  }
  return map
}

async function placeOrder(){
  if(!auth.currentUser) return alert('Inicia sesión como cliente.')
  if(!clientPhone.value || !clientLocation.value) return alert('Teléfono y ubicación son obligatorios.')
  loading.value = true
  try{
    const groups = groupBySeller(cart.items)
    for(const sellerId of Object.keys(groups)){
      const items = groups[sellerId]
      const total = items.reduce((a,b)=> a + Number(b.price||0), 0)
      await addDoc(collection(db, 'pedidos'), {
        sellerId,
        items,
        total,
        clientUid: auth.currentUser.uid,
        clientEmail: auth.currentUser.email || '',
        clientPhone: clientPhone.value,
        clientLocation: clientLocation.value,
        createdAt: serverTimestamp()
      })
    }
    // “Factura” .txt (descarga simple en cliente)
    const lines = cart.items.map(i => `• ${i.title} — $${i.price} — Vendedor: ${i.sellerName} (${i.sellerPhone})`)
    const text = [
      `CLIENTE: ${auth.currentUser.email}`,
      `TEL: ${clientPhone.value}`,
      `UBICACIÓN: ${clientLocation.value}`,
      '',
      'ITEMS:',
      ...lines,
      '',
      `TOTAL: $${cart.total()}`
    ].join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `factura_${Date.now()}.txt`
    a.click()

    cart.clear()
    alert('Pedido enviado. ¡Gracias!')
    router.push('/cliente')
  }catch(e){
    console.error(e); alert('Error enviando pedido: '+e.message)
  }finally{
    loading.value = false
  }
}
</script>

<template>
  <main class="wrap">
    <h2>Finalizar pedido</h2>

    <div v-if="!cart.items.length" class="muted">Tu carrito está vacío.</div>

    <ul class="list">
      <li v-for="it in cart.items" :key="it.id">
        {{ it.title }} — ${{ it.price }} · {{ it.sellerName }}
      </li>
    </ul>

    <div class="grid">
      <input placeholder="Tu teléfono" v-model="clientPhone" />
      <input placeholder="Ubicación dentro del campus" v-model="clientLocation" />
    </div>

    <div class="total">Total: <b>${{ cart.total() }}</b></div>

    <button :disabled="loading || !cart.items.length" @click="placeOrder">Confirmar pedido</button>
  </main>
</template>

<style scoped>
.wrap{max-width:760px;margin:1rem auto;padding:1rem;color:#fff}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
input{padding:.6rem;border:1px solid #444;border-radius:.6rem;background:#1c1c1c;color:#fff;width:100%}
.total{margin:.8rem 0}
button{padding:.6rem .9rem;border:1px solid #444;border-radius:.6rem;background:#e60000;color:#fff}
.list{opacity:.9;margin:.6rem 0}
.muted{opacity:.7}
</style>