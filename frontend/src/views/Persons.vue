<template>
  <AppLayout>
    <div class="persons-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Persons</h1>
          <p class="page-subtitle">Your personal network</p>
        </div>
        <button class="btn-primary" @click="openAddForm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Person
        </button>
      </div>

      <!-- Stats Strip -->
      <div class="stats-strip">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(251,113,133,0.12); color: #fb7185;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ persons.length }}</span>
            <span class="stat-label">Total Contacts</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(239,68,68,0.1); color: #ef4444;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ highPriorityCount }}</span>
            <span class="stat-label">High Priority</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(251,191,36,0.1); color: #f59e0b;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ upcomingBirthdays }}</span>
            <span class="stat-label">Upcoming Birthdays</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(16,185,129,0.1); color: #10b981;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ withFieldsCount }}</span>
            <span class="stat-label">With Details</span>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" type="text" placeholder="Search contacts…" />
        </div>
        <div class="priority-filters">
          <button
            v-for="opt in ['All', 'High', 'Medium', 'Low']"
            :key="opt"
            class="filter-pill"
            :class="[opt.toLowerCase(), { active: priorityFilter === opt }]"
            @click="priorityFilter = opt"
          >
            <span v-if="opt !== 'All'" class="filter-dot"></span>
            {{ opt }}
          </button>
        </div>
      </div>

      <!-- Modal -->
      <Teleport to="body">
        <div v-if="showForm" class="modal-backdrop" @click.self="cancelForm">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-header-left">
                <div class="modal-avatar" :style="{ background: form.name ? getAvatarColor(form.name) : '#fb7185' }">
                  {{ form.name ? form.name.charAt(0).toUpperCase() : '?' }}
                </div>
                <div>
                  <h3 class="modal-title">{{ editingId ? 'Edit Contact' : 'New Contact' }}</h3>
                  <p class="modal-subtitle">{{ editingId ? 'Update contact details' : 'Fill in the details below' }}</p>
                </div>
              </div>
              <button class="modal-close" @click="cancelForm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="modal-row">
                <div class="field">
                  <label>Full Name <span class="required">*</span></label>
                  <input v-model="form.name" type="text" placeholder="e.g. Jane Doe" autofocus />
                </div>
                <div class="field">
                  <label>Birthday</label>
                  <input v-model="form.birthday" type="date" />
                </div>
              </div>

              <div class="field">
                <label>Priority</label>
                <div class="priority-pills">
                  <button
                    v-for="opt in ['Low', 'Medium', 'High']"
                    :key="opt"
                    type="button"
                    class="priority-pill"
                    :class="[opt.toLowerCase(), { active: form.priority === opt }]"
                    @click="form.priority = form.priority === opt ? '' : opt"
                  >
                    <span class="pill-dot"></span>{{ opt }}
                  </button>
                </div>
              </div>

              <div class="field">
                <div class="cf-label-row">
                  <label>Custom Fields</label>
                  <button type="button" class="btn-add-field" @click="addCustomField">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Field
                  </button>
                </div>
                <div class="custom-fields-list">
                  <div v-for="(field, idx) in form.customFields" :key="idx" class="custom-field-row">
                    <input v-model="field.key" type="text" placeholder="Field name" class="cf-key" />
                    <input v-model="field.value" type="text" placeholder="Value" class="cf-val" />
                    <button type="button" class="remove-btn" @click="removeCustomField(idx)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div v-if="form.customFields.length === 0" class="no-fields">No custom fields yet</div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <div v-if="formError" class="error-msg">{{ formError }}</div>
              <div class="footer-actions">
                <button class="btn-ghost" @click="cancelForm">Cancel</button>
                <button class="btn-primary" @click="savePerson" :disabled="formLoading || !form.name">
                  <span v-if="formLoading" class="spinner"></span>
                  {{ formLoading ? 'Saving…' : (editingId ? 'Update Contact' : 'Add Contact') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-large"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="persons.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fda4af" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <p class="empty-title">No contacts yet</p>
        <p class="empty-desc">Add your first person to start building your network.</p>
        <button class="btn-primary" @click="openAddForm">+ Add Person</button>
      </div>

      <!-- No results -->
      <div v-else-if="filteredPersons.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <p class="empty-title">No matches found</p>
        <p class="empty-desc">Try adjusting your search or filter.</p>
      </div>

      <!-- Card Grid -->
      <div v-else class="card-grid">
        <div
          v-for="person in filteredPersons"
          :key="person.id"
          class="person-card"
          @mouseenter="hoveredId = person.id"
          @mouseleave="hoveredId = null"
        >
          <div class="card-top">
            <div class="card-avatar" :style="{ background: getAvatarColor(person.name) }">
              {{ person.name.charAt(0).toUpperCase() }}
            </div>
            <div class="card-actions" :class="{ visible: hoveredId === person.id }">
              <button class="action-btn edit" @click="startEdit(person)" title="Edit">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button v-if="!person.is_owner" class="action-btn delete" @click="deletePerson(person.id)" title="Delete">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </div>

          <div class="card-name-row">
            <span class="card-name">{{ person.name }}</span>
            <span v-if="person.is_owner" class="you-badge">You</span>
          </div>

          <div class="card-meta">
            <span v-if="person.priority" class="priority-badge" :class="person.priority.toLowerCase()">
              <span class="p-dot"></span>{{ person.priority }}
            </span>
            <span v-if="person.birthday" class="birthday-chip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ formatBirthday(person.birthday) }}
            </span>
          </div>

          <div v-if="hasCustomFields(person.custom_fields)" class="card-fields">
            <span v-for="(val, key) in parseCustomFields(person.custom_fields)" :key="key" class="cf-chip">
              <span class="cf-key-text">{{ key }}</span>
              <span class="cf-val-text">{{ val }}</span>
            </span>
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
import { useToast } from '../composables/useToast.js'

const persons = ref([])
const loading = ref(true)
const showForm = ref(false)
const formLoading = ref(false)
const formError = ref('')
const editingId = ref(null)
const hoveredId = ref(null)
const searchQuery = ref('')
const priorityFilter = ref('All')

const form = ref({ name: '', birthday: '', priority: '', customFields: [] })
const { error: toastError } = useToast()

const highPriorityCount = computed(() => persons.value.filter(p => p.priority === 'High').length)

const upcomingBirthdays = computed(() => {
  const now = new Date()
  const soon = new Date(now)
  soon.setDate(soon.getDate() + 30)
  return persons.value.filter(p => {
    if (!p.birthday) return false
    const bday = new Date(p.birthday)
    const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
    return thisYear >= now && thisYear <= soon
  }).length
})

const withFieldsCount = computed(() => persons.value.filter(p => hasCustomFields(p.custom_fields)).length)

const filteredPersons = computed(() => {
  let list = persons.value
  if (priorityFilter.value !== 'All') list = list.filter(p => p.priority === priorityFilter.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  return list
})

const avatarColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#fb7185']
function getAvatarColor(name) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length]
}

function formatBirthday(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function parseCustomFields(cf) {
  if (!cf) return {}
  if (typeof cf === 'object' && !Array.isArray(cf)) return cf
  try { return JSON.parse(cf) } catch { return {} }
}

function hasCustomFields(cf) {
  return Object.keys(parseCustomFields(cf)).length > 0
}

function addCustomField() {
  form.value.customFields.push({ key: '', value: '' })
}

function removeCustomField(idx) {
  form.value.customFields.splice(idx, 1)
}

function openAddForm() {
  editingId.value = null
  form.value = { name: '', birthday: '', priority: '', customFields: [] }
  formError.value = ''
  showForm.value = true
}

function startEdit(person) {
  editingId.value = person.id
  const cf = parseCustomFields(person.custom_fields)
  form.value = {
    name: person.name,
    birthday: person.birthday ? person.birthday.split('T')[0] : '',
    priority: person.priority || '',
    customFields: Object.entries(cf).map(([key, value]) => ({ key, value: String(value) }))
  }
  formError.value = ''
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  form.value = { name: '', birthday: '', priority: '', customFields: [] }
  formError.value = ''
}

async function loadPersons() {
  loading.value = true
  try {
    const res = await api.get('/persons')
    persons.value = res.data?.persons || res.data || []
  } catch (e) {
    toastError('Failed to load contacts.')
  } finally {
    loading.value = false
  }
}

async function savePerson() {
  formError.value = ''
  formLoading.value = true
  try {
    const customFields = {}
    form.value.customFields.forEach(({ key, value }) => {
      if (key.trim()) customFields[key.trim()] = value
    })

    const payload = {
      name: form.value.name,
      birthday: form.value.birthday || undefined,
      priority: form.value.priority || undefined,
      custom_fields: Object.keys(customFields).length ? customFields : undefined
    }

    let res
    if (editingId.value) {
      res = await api.patch(`/persons/${editingId.value}`, payload)
      const updated = res.data?.person || res.data
      const idx = persons.value.findIndex(p => p.id === editingId.value)
      if (idx !== -1) persons.value[idx] = { ...persons.value[idx], ...updated }
    } else {
      res = await api.post('/persons', payload)
      persons.value.unshift(res.data?.person || res.data)
    }
    cancelForm()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Failed to save contact.'
  } finally {
    formLoading.value = false
  }
}

async function deletePerson(id) {
  if (!confirm('Delete this contact?')) return
  try {
    await api.delete(`/persons/${id}`)
    persons.value = persons.value.filter(p => p.id !== id)
  } catch (e) {
    toastError(e.response?.data?.error || 'Failed to delete contact.')
  }
}

onMounted(() => loadPersons())
</script>

<style scoped>
.persons-page { max-width: 1200px; }

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.4px;
  margin-bottom: 2px;
}

.page-subtitle { font-size: 13px; color: #94a3b8; }

.btn-primary {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: #fb7185;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-primary:hover:not(:disabled) { background: #f43f5e; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

/* ── Stats Strip ── */
.stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Toolbar ── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 12px;
  flex: 1;
  max-width: 300px;
  transition: border-color 0.15s ease;
}
.search-box:focus-within { border-color: #fb7185; }
.search-box input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #0f172a;
  width: 100%;
  padding: 0;
  font-family: inherit;
}
.search-box input::placeholder { color: #94a3b8; }

.priority-filters {
  display: flex;
  gap: 6px;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.filter-pill.all.active { border-color: #fb7185; background: #fff1f2; color: #fb7185; }
.filter-pill.high.active, .filter-pill.high:hover { border-color: #fca5a5; background: #fef2f2; color: #ef4444; }
.filter-pill.medium.active, .filter-pill.medium:hover { border-color: #fde68a; background: #fffbeb; color: #f59e0b; }
.filter-pill.low.active, .filter-pill.low:hover { border-color: #a7f3d0; background: #ecfdf5; color: #10b981; }
.filter-pill:not(.active):hover { background: #f8fafc; }

/* ── Card Grid ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.person-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  cursor: default;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.person-card:hover {
  box-shadow: 0 8px 24px rgba(251,113,133,0.12);
  border-color: #fda4af;
  transform: translateY(-1px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.card-actions.visible { opacity: 1; }

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.action-btn.edit { background: #fff1f2; color: #fb7185; }
.action-btn.edit:hover { background: #ffe4e6; }
.action-btn.delete { background: #f8fafc; color: #94a3b8; }
.action-btn.delete:hover { background: #fef2f2; color: #ef4444; }

.card-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.you-badge {
  font-size: 10px;
  font-weight: 700;
  color: #fb7185;
  background: #fff1f2;
  padding: 2px 7px;
  border-radius: 10px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.p-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.priority-badge.high { background: #fef2f2; color: #ef4444; }
.priority-badge.medium { background: #fffbeb; color: #f59e0b; }
.priority-badge.low { background: #ecfdf5; color: #10b981; }

.birthday-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
}

.card-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding-top: 4px;
  border-top: 1px solid #f1f5f9;
}

.cf-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  max-width: 150px;
  overflow: hidden;
}
.cf-key-text { color: #94a3b8; font-weight: 600; white-space: nowrap; }
.cf-val-text { color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── States ── */
.loading-state { display: flex; justify-content: center; padding: 80px; }

.spinner-large {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #fb7185;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #fff1f2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.empty-title { font-size: 15px; font-weight: 600; color: #374151; }
.empty-desc { font-size: 13px; color: #94a3b8; margin-bottom: 12px; }

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  backdrop-filter: blur(3px);
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 540px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  animation: modalIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: 90vh;
  overflow: hidden;
}

@keyframes modalIn {
  from { transform: scale(0.92) translateY(12px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header-left { display: flex; align-items: center; gap: 14px; }

.modal-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: #fff;
  flex-shrink: 0;
}

.modal-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
.modal-subtitle { font-size: 12px; color: #94a3b8; }

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.modal-close:hover { background: #e2e8f0; color: #0f172a; }

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}

.modal-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.cf-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.cf-label-row label { margin-bottom: 0; }

.field { display: flex; flex-direction: column; gap: 6px; }

label { font-size: 13px; font-weight: 600; color: #374151; }
.required { color: #ef4444; }

input {
  padding: 9px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  font-family: inherit;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
input:focus {
  border-color: #fb7185;
  box-shadow: 0 0 0 3px rgba(251, 113, 133, 0.12);
}

.priority-pills { display: flex; gap: 8px; }

.priority-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s ease;
}
.priority-pill .pill-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.priority-pill.low:hover, .priority-pill.low.active { border-color: #a7f3d0; background: #ecfdf5; color: #10b981; }
.priority-pill.medium:hover, .priority-pill.medium.active { border-color: #fde68a; background: #fffbeb; color: #f59e0b; }
.priority-pill.high:hover, .priority-pill.high.active { border-color: #fca5a5; background: #fef2f2; color: #ef4444; }

.btn-add-field {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: #fff1f2;
  color: #fb7185;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-add-field:hover { background: #ffe4e6; }

.custom-fields-list { display: flex; flex-direction: column; gap: 8px; }
.custom-field-row { display: flex; gap: 8px; align-items: center; }
.cf-key { flex: 0 0 38%; }
.cf-val { flex: 1; }

.remove-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.remove-btn:hover { background: #fef2f2; color: #ef4444; }

.no-fields {
  font-size: 13px;
  color: #94a3b8;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
}

.error-msg { font-size: 13px; color: #ef4444; margin-bottom: 10px; }

.footer-actions { display: flex; justify-content: flex-end; gap: 10px; }

.btn-ghost {
  padding: 9px 18px;
  background: #fff;
  color: #475569;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-ghost:hover { background: #f8fafc; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@media (max-width: 900px) {
  .stats-strip { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .stats-strip { grid-template-columns: 1fr 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-box { max-width: 100%; }
  .modal { max-width: 100%; }
  .modal-row { grid-template-columns: 1fr; }
}
</style>
