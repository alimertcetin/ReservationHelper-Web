import { createRouter, createWebHistory } from 'vue-router'
import BookingPage from '../components/BookingPage.vue'
import TemplateManagement from '../components/TemplateManagement.vue'

const routes = [
  { 
    path: '/', 
    redirect: '/bookings' // Or whatever your main path is
  },
  {
    path: '/bookings',
    component: BookingPage
  },
  {
    path: '/templates',
    component: TemplateManagement
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
