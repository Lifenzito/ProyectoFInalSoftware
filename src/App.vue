<script setup>
import Banner from './components/Banner.vue'
</script>

<template>
  <Banner />
  <router-view />
</template>

<style>
/* opcional: fondo oscuro para ver que monta */
html,body,#app{height:100%}
body{margin:0;background:#1f1f1f;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto}
</style>