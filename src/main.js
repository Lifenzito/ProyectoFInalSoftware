import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// (opcional) si tienes style.css
import './style.css'

// ✅ importa Tailwind **arriba**, junto con los demás
import './assets/tailwind.css'

createApp(App).use(router).mount('#app')