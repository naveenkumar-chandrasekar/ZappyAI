<template>
  <div class="layout">
    <AppToast />
    <aside class="sidebar">

      <div class="sidebar-brand">
        <div class="brand-mark">
          <div class="brand-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">Zappy</span>
            <span class="brand-tagline">Personal Assistant</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <p class="nav-section-label">MENU</p>
        <a
          v-for="item in navItems"
          :key="item.to"
          @click.prevent="router.push(item.to)"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
          :style="isActive(item.to) ? { '--item-color': item.color, '--item-bg': item.activeBg, '--item-border': item.color } : { '--item-color': item.color }"
        >
          <div class="nav-icon-box" :style="isActive(item.to) ? { background: item.activeBg } : {}">
            <svg :style="{ color: isActive(item.to) ? item.color : '#64748b' }" v-html="item.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></svg>
          </div>
          <span class="nav-label" :style="isActive(item.to) ? { color: item.color } : {}">{{ item.label }}</span>
          <span v-if="isActive(item.to)" class="nav-active-dot" :style="{ background: item.color }"></span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-details">
            <div class="user-name">{{ user?.name || 'User' }}</div>
            <div class="user-mobile">{{ user?.mobile_number || '' }}</div>
          </div>
          <button class="logout-icon-btn" @click="handleLogout" title="Sign out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

    </aside>

    <main class="main-content">
      <div class="content-inner">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import AppToast from './AppToast.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const userInitial = computed(() => {
  const name = authStore.user?.name || authStore.user?.mobile_number || 'U'
  return name.charAt(0).toUpperCase()
})

const navItems = [
  {
    to: '/dashboard', label: 'Dashboard',
    color: '#60a5fa', activeBg: 'rgba(59,130,246,0.12)',
    svg: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  },
  {
    to: '/tasks', label: 'Tasks',
    color: '#34d399', activeBg: 'rgba(16,185,129,0.12)',
    svg: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  },
  {
    to: '/notes', label: 'Notes',
    color: '#fbbf24', activeBg: 'rgba(245,158,11,0.12)',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  },
  {
    to: '/persons', label: 'Persons',
    color: '#fb7185', activeBg: 'rgba(244,63,94,0.12)',
    svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
  {
    to: '/conversations', label: 'Conversations',
    color: '#a78bfa', activeBg: 'rgba(139,92,246,0.12)',
    svg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  },
  {
    to: '/settings', label: 'Settings',
    color: '#38bdf8', activeBg: 'rgba(14,165,233,0.12)',
    svg: '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>',
  },
]

function isActive(to) {
  return route.path === to || route.path.startsWith(to + '/')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  min-width: 240px;
  background: #0d1117;
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
}

/* ── Brand ── */
.sidebar-brand {
  padding: 20px 16px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 11px;
}

.brand-logo {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.3px;
  line-height: 1.1;
}

.brand-tagline {
  font-size: 10px;
  color: #475569;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* ── Nav ── */
.sidebar-nav {
  flex: 1;
  padding: 14px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
}

.nav-section-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #334155;
  padding: 0 10px;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  border: 1px solid transparent;
}

.nav-item:hover {
  background: rgba(255,255,255,0.05);
}

.nav-item.active {
  background: var(--item-bg);
  border-color: rgba(255,255,255,0.04);
}

.nav-icon-box {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: rgba(255,255,255,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.nav-item:hover .nav-icon-box {
  background: rgba(255,255,255,0.07);
}

.nav-label {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  transition: color 0.15s ease;
}

.nav-item:hover .nav-label {
  color: #94a3b8;
}

.nav-active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Footer ── */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.user-details {
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-mobile {
  font-size: 10px;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: none;
  background: none;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.logout-icon-btn:hover {
  background: rgba(248,113,113,0.12);
  color: #f87171;
}

/* ── Main ── */
.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
  background: #f8fafc;
}

.content-inner {
  max-width: 1100px;
  padding: 40px 48px;
  margin: 0 auto;
}
</style>
