<template>
  <section class="market-section">
    <h2 class="section-title">{{ title }}</h2>
    <div class="slider" role="list">
      <ProductCard v-for="p in products" :key="p.id" :product="p" role="listitem" />
    </div>
  </section>
</template>

<script setup>
import ProductCard from './ProductCard.vue'
const props = defineProps({
  title: { type: String, required: true },
  products: { type: Array, required: true }
})
</script>

<style scoped>
.market-section + .market-section { margin-top: 28px; }
.section-title { color:#fff; font-size:1.4rem; font-weight:800; margin:10px 0; }
.slider { display:flex; gap:14px; overflow-x:auto; padding:8px 2px 14px; scroll-snap-type:x proximity; }
.slider::-webkit-scrollbar { height:8px; }
.slider::-webkit-scrollbar-thumb { background:rgba(255,255,255,.25); border-radius:999px; }
</style>
