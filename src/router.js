import { createRouter, createWebHistory } from 'vue-router'

// Carga perezosa por si algo no existe aún evita fallas de import
const Login = () => import('./views/Login.vue')
const ClientHome = () => import('./views/ClientHome.vue')
const SellerDashboard = () => import('./views/SellerDashboard.vue')

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/cliente', component: ClientHome },
  { path: '/seller', component: SellerDashboard },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router