<template>
  <AppLayout>
    <div class="reminders-page">

      <div class="page-header">
        <div>
          <h1 class="page-title">Reminders</h1>
          <p class="page-subtitle">{{ reminders.length }} reminder{{ reminders.length !== 1 ? 's' : '' }}</p>
        </div>
      </div>

      <div v-if="loading" class="reminders-list">
        <div class="skeleton-row" v-for="i in 4" :key="i"></div>
      </div>

      <div v-else-if="reminders.length === 0" class="empty-state">
        <div class="empty-illustration">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="1.2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <p class="empty-title">No reminders yet</p>
        <p class="empty-desc">Ask Zappy on WhatsApp to set a reminder.</p>
      </div>

      <div v-else class="reminders-list">
        <div
          v-for="r in reminders"
          :key="r.id"
          class="reminder-row"
          :class="{ sent: r.sent, overdue: isOverdue(r) && !r.sent }"
        >
          <div class="reminder-icon">
            <svg v-if="r.sent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else-if="isOverdue(r)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>

          <div class="reminder-body">
            <p class="reminder-type">{{ r.type }}</p>
            <p class="reminder-meta">
              <span class="reminder-time">{{ formatDate(r.scheduled_at) }}</span>
              <span v-if="r.Task" class="reminder-task">· {{ r.Task.title }}</span>
            </p>
          </div>

          <div class="reminder-badges">
            <span v-if="r.sent" class="badge badge-sent">Sent</span>
            <span v-else-if="isOverdue(r)" class="badge badge-overdue">Overdue</span>
            <span v-else class="badge badge-pending">Pending</span>
          </div>

          <button class="btn-delete" @click="deleteReminder(r.id)" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/index.js'

const reminders = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/reminders')
    reminders.value = res.data.reminders
  } finally {
    loading.value = false
  }
})

function isOverdue(r) {
  return new Date(r.scheduled_at) < new Date()
}

function formatDate(dt) {
  return new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function deleteReminder(id) {
  await api.delete(`/reminders/${id}`)
  reminders.value = reminders.value.filter(r => r.id !== id)
}
</script>

<style scoped>
.reminders-page { padding: 32px; max-width: 760px; margin: 0 auto; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.page-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
.page-subtitle { font-size: 13px; color: #94a3b8; margin: 4px 0 0; }

.reminders-list { display: flex; flex-direction: column; gap: 10px; }

.reminder-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  transition: box-shadow 0.15s;
}

.reminder-row:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.reminder-row.sent { opacity: 0.6; }
.reminder-row.overdue { border-color: #fecaca; background: #fff5f5; }

.reminder-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reminder-body { flex: 1; min-width: 0; }
.reminder-type { font-size: 14px; font-weight: 600; color: #0f172a; margin: 0 0 3px; }
.reminder-meta { font-size: 12px; color: #94a3b8; margin: 0; display: flex; gap: 6px; }
.reminder-task { color: #6366f1; }

.reminder-badges { flex-shrink: 0; }
.badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
.badge-pending { background: #ede9fe; color: #6366f1; }
.badge-sent { background: #d1fae5; color: #059669; }
.badge-overdue { background: #fee2e2; color: #dc2626; }

.btn-delete {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.15s, background 0.15s;
}
.btn-delete:hover { color: #ef4444; background: #fff1f2; }

.skeleton-row {
  height: 68px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  border-radius: 12px;
}

@keyframes shimmer { to { background-position: -200% 0; } }

.empty-state { text-align: center; padding: 80px 24px; }
.empty-illustration { margin-bottom: 16px; }
.empty-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 6px; }
.empty-desc { font-size: 14px; color: #94a3b8; margin: 0; }
</style>
