import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  {
    path: '/',
    redirect: () => {
      const token = localStorage.getItem('token')
      return token ? '/dashboard' : '/login'
    }
  },
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks',
    component: () => import('../views/Tasks.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notes',
    component: () => import('../views/Notes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/persons',
    component: () => import('../views/Persons.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/conversations',
    component: () => import('../views/Conversations.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reminders',
    component: () => import('../views/Reminders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
