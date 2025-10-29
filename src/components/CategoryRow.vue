<script setup>
import { cart } from '../store/cart'
const props = defineProps({ title:String, items:Array })
function add(p){ cart.add(p) }
</script>

<template>
  <section class="sec">
    <h2>{{ title }}</h2>
    <div class="strip">
      <button v-for="p in items" :key="p.id" class="card" @click="add(p)">
        <img v-if="p.imageUrl" :src="p.imageUrl" alt="" />
        <div class="meta">
          <div class="t">{{ p.title }}</div>
          <div class="s">Vende: {{ p.sellerName }}</div>
          <div class="p">$ {{ p.price }}</div>
        </div>
      </button>
    </div>
  </section>
</template>

<style scoped>
.sec{margin-bottom:1rem}
h2{font-size:1.2rem;margin-bottom:.4rem}
.strip{display:flex;gap:.6rem;overflow-x:auto;padding-bottom:.4rem}
.card{min-width:320px;width:320px;height:260px;border:1px solid #3a3a3a;border-radius:.8rem;background:#242424;color:#fff;display:flex;flex-direction:column;cursor:pointer}
.card img{width:100%;height:160px;object-fit:cover;border-top-left-radius:.8rem;border-top-right-radius:.8rem}
.meta{padding:.4rem .6rem;display:grid;gap:.2rem;text-align:left}
.t{font-weight:700}
.s{font-size:.85rem;opacity:.8}
.p{font-weight:700}
</style>