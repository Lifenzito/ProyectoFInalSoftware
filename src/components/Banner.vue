<!-- src/components/Banner.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const router = useRouter()
const route  = useRoute()

const email = ref('')
const rol   = ref('') // cliente | vendedor | usuario

let un = null
onMounted(() => {
  un = onAuthStateChanged(auth, async (user) => {
    if (user) {
      email.value = user.email || ''
      try {
        const snap = await getDoc(doc(db, 'usuarios', user.uid))
        rol.value = snap.exists() ? (snap.data()?.rol || 'usuario') : 'usuario'
      } catch {
        rol.value = 'usuario'
      }
    } else {
      email.value = ''
      rol.value = ''
    }
  })
})
onUnmounted(() => un && un())

function go(to) {
  if (route.path !== to) router.push(to)
}
async function doLogout() {
  try { await signOut(auth) } catch {}
  router.push('/login')
}
</script>

<template>
  <header class="bar">
    <div class="brand" @click="go('/login')" role="button" aria-label="Ir al inicio">
      <img src="/logo.png" alt="Antojos" />
      <strong>ANTOJOS</strong>
    </div>

    <nav class="nav">
      <!-- Mostrar botones según el rol -->
      <template v-if="email">
        <button
          v-if="rol === 'cliente' || rol === 'vendedor'"
          @click="go('/cliente')"
          :class="['pill', route.path==='/cliente' ? 'active' : '']">
          Cliente
        </button>

        <button
          v-if="rol === 'vendedor'"
          @click="go('/seller')"
          :class="['pill', route.path==='/seller' ? 'active' : '']">
          Vendedor
        </button>

        <button class="pill danger" @click="doLogout">
          Cerrar sesión
        </button>
      </template>
    </nav>
  </header>

  <div v-if="email" class="session">
    Has iniciado sesión como <b>{{ rol || 'usuario' }}</b> — {{ email }}
  </div>
</template>

<style scoped>
.bar{
  position:sticky; top:0; z-index:50;
  display:flex; justify-content:space-between; align-items:center;
  padding:.6rem 1rem; background:#b61e1e; color:#fff;
}
.brand{display:flex; gap:.6rem; align-items:center; cursor:pointer}
.brand img{width:28px; height:28px; border-radius:.4rem}
.nav{display:flex; gap:.5rem; align-items:center}
.pill{
  margin-left:.2rem; padding:.4rem .8rem;
  border:1px solid #ffffff33; border-radius:.6rem;
  background:#0002; color:#fff; cursor:pointer;
}
.pill:hover{background:#0003}
.pill.active{background:#fff2; border-color:#fff8}
.pill.danger{background:#7f1d1d; border-color:#ffb4b4}
.pill.danger:hover{background:#a32020}
.session{padding:.4rem 1rem; background:#0003; color:#fff}
</style>