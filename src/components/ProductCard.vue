<template>
  <article class="card">
    <img :src="product.image || product.imageUrl" alt="producto" />
    <h3 class="title">{{ product.title }}</h3>
    <p class="price">${{ product.price }}</p>
    <p class="desc">{{ product.description }}</p>
  </article>
</template>

<script setup>
const props = defineProps({
  product: { type: Object, required: true }
})
</script>

<style scoped>
.card { flex:0 0 220px; background:#2a2a2a; color:#fff; border:1px solid #3a3a3a; border-radius:14px; padding:10px; }
img { width:100%; height:160px; object-fit:cover; border-radius:10px; }
.title { margin:6px 0 4px; font-weight:800; }
.price { margin:0 0 6px; opacity:.95; }
.desc { font-size:.9rem; opacity:.85; }
</style>
