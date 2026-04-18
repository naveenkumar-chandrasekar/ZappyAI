<template>
  <AppLayout>
    <div class="dashboard">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <p class="header-date">{{ currentDate }}</p>
          <h1 class="greeting">Good {{ timeOfDay }}, <span class="name-highlight">{{ userName }}</span> 👋</h1>
        </div>
        <router-link to="/conversations" class="ask-btn">
          <span class="ask-icon">⚡</span>
          Ask Zappy
        </router-link>
      </div>

      <!-- Stat cards -->
      <div class="stats-grid">
        <template v-if="statsLoading">
          <div class="skeleton-card" v-for="i in 3" :key="i"></div>
        </template>
        <template v-else>
          <router-link to="/tasks" class="stat-card indigo-card">
            <div class="stat-card-inner">
              <div class="stat-icon indigo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.pendingTasks }}</div>
                <div class="stat-label">Pending Tasks</div>
              </div>
              <div class="stat-trend">{{ stats.totalTasks }} total</div>
            </div>
          </router-link>

          <router-link to="/notes" class="stat-card emerald-card">
            <div class="stat-card-inner">
              <div class="stat-icon emerald-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.totalNotes }}</div>
                <div class="stat-label">Notes Saved</div>
              </div>
              <div class="stat-trend">knowledge base</div>
            </div>
          </router-link>

          <router-link to="/persons" class="stat-card amber-card">
            <div class="stat-card-inner">
              <div class="stat-icon amber-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.totalContacts }}</div>
                <div class="stat-label">Contacts</div>
              </div>
              <div class="stat-trend">in network</div>
            </div>
          </router-link>
        </template>
      </div>

      <!-- Charts row -->
      <div class="charts-grid">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Task Completion</h2>
            <span class="completion-badge" :class="completionRateClass">{{ taskCompletionPct }}%</span>
          </div>
          <div class="card-body">
            <div v-if="!stats.totalTasks" class="chart-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>No tasks recorded yet</span>
            </div>
            <div v-else class="bar-chart">
              <div class="bar-row">
                <div class="bar-label"><span class="bar-dot green"></span>Completed</div>
                <div class="bar-track"><div class="bar-fill green" :style="{ width: taskCompletionPct + '%' }"></div></div>
                <div class="bar-value">{{ stats.completedTasks }}</div>
              </div>
              <div class="bar-row">
                <div class="bar-label"><span class="bar-dot amber"></span>Pending</div>
                <div class="bar-track"><div class="bar-fill amber" :style="{ width: taskPendingPct + '%' }"></div></div>
                <div class="bar-value">{{ stats.pendingTasks }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Contacts by Priority</h2>
          </div>
          <div class="card-body">
            <div v-if="!stats.totalContacts" class="chart-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>No contacts added yet</span>
            </div>
            <div v-else class="bar-chart">
              <div class="bar-row">
                <div class="bar-label"><span class="bar-dot red"></span>High</div>
                <div class="bar-track"><div class="bar-fill red" :style="{ width: priorityPct('High') + '%' }"></div></div>
                <div class="bar-value">{{ stats.contactsByPriority.High || 0 }}</div>
              </div>
              <div class="bar-row">
                <div class="bar-label"><span class="bar-dot amber"></span>Medium</div>
                <div class="bar-track"><div class="bar-fill amber" :style="{ width: priorityPct('Medium') + '%' }"></div></div>
                <div class="bar-value">{{ stats.contactsByPriority.Medium || 0 }}</div>
              </div>
              <div class="bar-row">
                <div class="bar-label"><span class="bar-dot green"></span>Low</div>
                <div class="bar-track"><div class="bar-fill green" :style="{ width: priorityPct('Low') + '%' }"></div></div>
                <div class="bar-value">{{ stats.contactsByPriority.Low || 0 }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom row -->
      <div class="two-col">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Today's Summary</h2>
            <span class="live-badge">
              <span class="live-dot"></span>Daily
            </span>
          </div>
          <div class="card-body">
            <div v-if="summaryLoading" class="summary-skeleton">
              <div class="skel-line"></div>
              <div class="skel-line short"></div>
              <div class="skel-line"></div>
              <div class="skel-line shorter"></div>
            </div>
            <div v-else-if="summary" class="summary-structured">
              <div v-for="(section, i) in parsedSummary" :key="i" class="summary-section">
                <div v-if="section.heading" class="summary-heading">
                  <span class="summary-heading-icon">{{ section.icon }}</span>
                  {{ section.heading }}
                </div>
                <div v-else-if="section.intro" class="summary-intro">{{ section.intro }}</div>
                <ul v-if="section.items.length" class="summary-items">
                  <li v-for="(item, j) in section.items" :key="j" class="summary-item">
                    <span class="item-dot"></span>
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon">🌅</div>
              <p class="empty-title">No summary yet</p>
              <p class="empty-desc">Check back after your scheduled summary time.</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Upcoming Tasks</h2>
            <router-link to="/tasks" class="card-link">View all →</router-link>
          </div>
          <div class="card-body">
            <div v-if="statsLoading" class="task-skeleton">
              <div class="skel-task" v-for="i in 3" :key="i"></div>
            </div>
            <div v-else-if="upcomingTasks.length === 0" class="empty-state compact">
              <div class="empty-icon">🎉</div>
              <p class="empty-title">All clear!</p>
              <p class="empty-desc">No pending tasks.</p>
            </div>
            <div v-else class="task-list">
              <div v-for="task in upcomingTasks" :key="task.id" class="task-row">
                <div class="task-checkbox" :class="{ overdue: isOverdue(task) }"></div>
                <div class="task-info">
                  <div class="task-title">{{ task.title }}</div>
                  <div v-if="task.due_at" class="task-due">
                    <span :class="isOverdue(task) ? 'badge-danger' : 'badge-muted'">
                      {{ isOverdue(task) ? '⚠ Overdue' : formatDate(task.due_at) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/index.js'
import { useAuthStore } from '../stores/auth.js'
import { useSummaryStore } from '../stores/summary.js'
import { useToast } from '../composables/useToast.js'

const authStore = useAuthStore()
const summaryStore = useSummaryStore()
const { error: toastError } = useToast()

const stats = ref({ totalTasks: 0, completedTasks: 0, pendingTasks: 0, totalNotes: 0, totalContacts: 0, contactsByPriority: { High: 0, Medium: 0, Low: 0 } })
const statsLoading = ref(true)
const summary = computed(() => summaryStore.text)
const summaryLoading = computed(() => summaryStore.loading)
const upcomingTasks = ref([])

const userName = computed(() => authStore.user?.name || authStore.user?.mobile || 'there')

const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})

const taskCompletionPct = computed(() => {
  if (!stats.value.totalTasks) return 0
  return Math.round((stats.value.completedTasks / stats.value.totalTasks) * 100)
})

const taskPendingPct = computed(() => {
  if (!stats.value.totalTasks) return 0
  return Math.round((stats.value.pendingTasks / stats.value.totalTasks) * 100)
})

const completionRateClass = computed(() => {
  const pct = taskCompletionPct.value
  if (pct >= 75) return 'green'
  if (pct >= 40) return 'amber'
  return 'red'
})

function priorityPct(key) {
  const total = stats.value.totalContacts
  if (!total) return 0
  return Math.round(((stats.value.contactsByPriority[key] || 0) / total) * 100)
}

const SECTION_ICONS = {
  'pending tasks': '✅',
  'task': '✅',
  'upcoming birthdays': '🎂',
  'birthday': '🎂',
  'notes': '📝',
  'reminder': '⏰',
}

function getSectionIcon(heading) {
  const lower = heading.toLowerCase()
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return '📋'
}

const parsedSummary = computed(() => {
  if (!summary.value || !String(summary.value).trim()) return []
  const lines = summary.value.split('\n').map(l => l.trim()).filter(Boolean)
  const sections = []
  let current = null

  for (const line of lines) {
    const isBullet = /^[-•*]/.test(line)
    // A heading is a short line (≤60 chars) that looks like a section title — not a full sentence
    const isHeading = !isBullet && line.length <= 60 &&
      (/^[A-Z][^.!?]*\s*\(\d+\)/.test(line) || /^(Pending Tasks|Upcoming Birthdays|Reminders|Notes|Tasks)\b/i.test(line))

    if (!isBullet && !isHeading && sections.length === 0 && !current) {
      // First non-bullet non-heading line is the intro greeting
      sections.push({ intro: line.replace(/:$/, ''), heading: null, icon: null, items: [] })
    } else if (isHeading) {
      current = { heading: line.replace(/\s*\(\d+\)\s*$/, '').replace(/:$/, ''), icon: getSectionIcon(line), intro: null, items: [] }
      sections.push(current)
    } else if (isBullet) {
      const text = line.replace(/^[-•*]\s*/, '')
      if (!current) { current = { heading: null, icon: null, intro: null, items: [] }; sections.push(current) }
      current.items.push(text)
    }
  }
  return sections
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(task) {
  if (!task.due_at || task.completed) return false
  return new Date(task.due_at) < new Date()
}

async function loadStats() {
  statsLoading.value = true
  try {
    const [tasksRes, notesRes, personsRes] = await Promise.all([
      api.get('/tasks'),
      api.get('/notes'),
      api.get('/persons')
    ])
    const td = tasksRes.data
    const tasks = Array.isArray(td) ? td : (td?.tasks || [])
    const notes = notesRes.data?.notes || notesRes.data || []
    const persons = personsRes.data?.persons || personsRes.data || []

    const byPriority = { High: 0, Medium: 0, Low: 0 }
    persons.forEach(p => { if (p.priority) byPriority[p.priority] = (byPriority[p.priority] || 0) + 1 })

    stats.value.totalTasks = tasks.length
    stats.value.completedTasks = tasks.filter(t => t.completed).length
    stats.value.pendingTasks = tasks.filter(t => !t.completed).length
    stats.value.totalNotes = notes.length
    stats.value.totalContacts = persons.length
    stats.value.contactsByPriority = byPriority

    upcomingTasks.value = tasks
      .filter(t => !t.completed)
      .sort((a, b) => new Date(a.due_at) - new Date(b.due_at))
      .slice(0, 5)
  } catch (e) {
    toastError('Failed to load dashboard data.')
  } finally {
    statsLoading.value = false
  }
}

onMounted(() => {
  loadStats()
  summaryStore.fetchSummary()
})
</script>

<style scoped>
.dashboard {
  max-width: 1100px;
}

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.header-date {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.greeting {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.name-highlight {
  color: #6366f1;
}

.ask-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transition: all 0.15s ease;
}

.ask-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.ask-icon {
  font-size: 16px;
}

/* ── Stat cards ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.skeleton-card {
  height: 110px;
  background: #f1f5f9;
  border-radius: 14px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.stat-card {
  border-radius: 14px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  display: block;
  transition: all 0.18s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  opacity: 0;
  transition: opacity 0.18s ease;
}

.stat-card:hover::after { opacity: 1; }
.stat-card:hover { transform: translateY(-2px); }

.indigo-card { background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border: 1px solid #c7d2fe; }
.indigo-card:hover { box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15); }

.emerald-card { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; }
.emerald-card:hover { box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15); }

.amber-card { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; }
.amber-card:hover { box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15); }

.stat-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.indigo-icon { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
.emerald-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.amber-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 34px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 4px;
  letter-spacing: -1px;
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.stat-trend {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  align-self: flex-end;
  white-space: nowrap;
}

/* ── Charts ── */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.2px;
}

.completion-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.completion-badge.green { background: #dcfce7; color: #16a34a; }
.completion-badge.amber { background: #fef9c3; color: #ca8a04; }
.completion-badge.red { background: #fee2e2; color: #dc2626; }

.card-link {
  font-size: 13px;
  color: #6366f1;
  text-decoration: none;
  font-weight: 600;
}

.card-link:hover { color: #4f46e5; }

.card-body {
  padding: 20px;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 80px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

.bar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bar-dot.green { background: #10b981; }
.bar-dot.amber { background: #f59e0b; }
.bar-dot.red { background: #ef4444; }

.bar-track {
  flex: 1;
  height: 10px;
  background: #f1f5f9;
  border-radius: 99px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 3px;
}

.bar-fill.green { background: linear-gradient(90deg, #34d399, #10b981); }
.bar-fill.amber { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
.bar-fill.red { background: linear-gradient(90deg, #f87171, #ef4444); }

.bar-value {
  width: 28px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  text-align: right;
  flex-shrink: 0;
}

/* ── Bottom two-col ── */
.two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 3px 10px;
  border-radius: 20px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.summary-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skel-line {
  height: 13px;
  background: #f1f5f9;
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skel-line.short { width: 70%; }
.skel-line.shorter { width: 50%; }

.skel-task {
  height: 52px;
  background: #f1f5f9;
  border-radius: 10px;
  margin-bottom: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}

.summary-structured {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary-intro {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  padding-bottom: 4px;
  border-bottom: 1px solid #f1f5f9;
}

.summary-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.1px;
  line-height: 1.4;
}

.summary-heading-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

.summary-items {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 4px;
}

.summary-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
  flex-shrink: 0;
  margin-top: 5px;
}

.empty-state {
  text-align: center;
  padding: 28px 16px;
}

.empty-state.compact {
  padding: 18px 16px;
}

.empty-icon {
  font-size: 30px;
  margin-bottom: 10px;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.empty-desc {
  font-size: 13px;
  color: #94a3b8;
}

.task-list {
  display: flex;
  flex-direction: column;
}

.task-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #f8fafc;
}

.task-row:last-child { border-bottom: none; padding-bottom: 0; }
.task-row:first-child { padding-top: 0; }

.task-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #c7d2fe;
  background: #eef2ff;
  flex-shrink: 0;
  margin-top: 2px;
}

.task-checkbox.overdue {
  border-color: #fca5a5;
  background: #fef2f2;
}

.task-info { flex: 1; min-width: 0; }

.task-title {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-due { display: flex; }

.badge-danger {
  font-size: 11px;
  font-weight: 600;
  color: #dc2626;
  background: #fee2e2;
  padding: 1px 8px;
  border-radius: 20px;
}

.badge-muted {
  font-size: 11px;
  color: #94a3b8;
}

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: 1fr; }
  .charts-grid { grid-template-columns: 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
}
</style>
