import { createRouter, createWebHistory } from 'vue-router'
import BookingPage from '../components/BookingPage.vue'
import TemplateManagement from '../components/TemplateManagement.vue'
import AccountManagement from '../components/AccountManagement.vue'
import PriceManager from '../components/PriceManager.vue'
import PricePolicyManagement from '../components/PricePolicyManagement.vue'
import RoomTypeManagement from '../components/RoomTypeManagement.vue'
import StaffManagement from '../components/StaffManagement.vue'

const routes = [
  { 
    path: '/', 
    redirect: '/bookings'
  },
  {
    path: '/bookings',
    component: BookingPage
  },
  {
    path: '/account-management',
    component: AccountManagement
  },
  {
    path: '/price-manager',
    component: PriceManager
  },
  {
    path: '/policy-manager',
    component: PricePolicyManagement
  },
  {
    path: '/room-type-management',
    component: RoomTypeManagement
  },
  {
    path: '/staff-management',
    component: StaffManagement
  },
  {
    path: '/template-management',
    component: TemplateManagement
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
