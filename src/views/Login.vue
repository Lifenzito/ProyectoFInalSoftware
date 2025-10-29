<!-- src/views/Login.vue -->
<script setup>
import { useRouter } from 'vue-router'
import { loginAs } from '../firebase/auth' // usa la nueva función con rol

const router = useRouter()

async function entrarVendedor() {
  await loginAs('vendedor') // crea doc en Firestore con rol=vendedor
  router.push('/seller')
}

async function entrarCliente() {
  await loginAs('cliente') // crea doc en Firestore con rol=cliente
  router.push('/cliente')
}
</script>

<template>
  <main class="p-6 grid gap-3 max-w-md text-white">
    <h1 class="text-2xl font-bold">AntojosUPB</h1>
    <button type="button" @click="entrarVendedor">
      Entrar como Vendedor (Google)
    </button>
    <button type="button" @click="entrarCliente">
      Entrar como Cliente (Google)
    </button>
  </main>
</template>

<style scoped>
button {
  padding: .6rem 1rem;
  border: 1px solid #444;
  border-radius: .6rem;
  background: #1c1c1c;
  color: #fff;
  cursor: pointer;
}
button:hover {
  background: #e60000;
  border-color: #e60000;
}
</style>