<template>
  <AppLayout>
    <div class="tasks-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Tasks</h1>
          <p class="page-subtitle">{{ tasks.length }} task{{ tasks.length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-new" @click="openCreateModal()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Task
        </button>
      </div>

      <!-- Kanban board -->
      <div v-if="loading" class="board">
        <div v-for="col in columns" :key="col.key" class="column">
          <div class="col-header">
            <div class="col-title-row">
              <span class="col-dot" :style="{ background: col.color }"></span>
              <span class="col-name">{{ col.label }}</span>
              <span class="col-count skel-badge"></span>
            </div>
          </div>
          <div class="col-body">
            <div class="task-card skeleton-card" v-for="i in 2" :key="i">
              <div class="skel skel-line w80"></div>
              <div class="skel skel-line w50" style="margin-top:8px"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="board">
        <div v-for="col in columns" :key="col.key" class="column">
          <!-- Column header -->
          <div class="col-header">
            <div class="col-title-row">
              <span class="col-dot" :style="{ background: col.color }"></span>
              <span class="col-name">{{ col.label }}</span>
              <span class="col-count" :style="{ background: col.countBg, color: col.color }">
                {{ tasksByStatus(col.key).length }}
              </span>
            </div>
          </div>

          <!-- Cards -->
          <div
            class="col-body"
            :class="{ 'drop-target': dragOverCol === col.key && col.key !== 'Overdue' }"
            @dragover.prevent="col.key !== 'Overdue' && onDragOver(col.key)"
            @dragleave="onDragLeave(col.key)"
            @drop.prevent="col.key !== 'Overdue' && onDrop(col.key)"
          >
            <div v-if="tasksByStatus(col.key).length === 0 && dragOverCol !== col.key" class="col-empty">
              {{ col.key === 'Overdue' ? 'Nothing overdue' : 'No tasks here' }}
            </div>

            <div
              v-for="task in tasksByStatus(col.key)"
              :key="task.id"
              class="task-card"
              :class="{ 'card-done': task.status === 'Completed', 'card-overdue': col.key === 'Overdue', 'card-dragging': draggingId === task.id }"
              draggable="true"
              @dragstart="onDragStart(task, $event)"
              @dragend="onDragEnd"
            >
              <!-- Card top bar -->
              <div class="card-topbar" :style="{ background: col.barColor }"></div>

              <!-- Card body -->
              <div class="card-content">
                <div class="card-title" :class="{ strikethrough: task.status === 'Completed' }">
                  {{ task.title }}
                </div>
                <div v-if="task.description" class="card-desc">{{ task.description }}</div>

                <!-- Meta row -->
                <div class="card-meta">
                  <span v-if="task.person_name" class="meta-chip">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {{ task.person_name }}
                  </span>
                  <span v-if="task.due_at" class="meta-chip" :class="{ 'chip-overdue': isOverdue(task) }">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {{ formatDate(task.due_at) }}
                    <span v-if="isOverdue(task)" class="overdue-tag">Overdue</span>
                    <span v-else-if="isDueSoon(task)" class="soon-tag">Soon</span>
                  </span>
                </div>

                <!-- Card actions -->
                <div class="card-actions">
                  <!-- Move to Pending (from Completed only) -->
                  <button
                    v-if="task.status === 'Completed'"
                    class="move-btn"
                    @click="moveTask(task, 'Pending')"
                    title="Move to Pending"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <!-- Move to Completed (from Pending or Overdue) -->
                  <button
                    v-if="task.status !== 'Completed'"
                    class="move-btn move-btn-fwd"
                    @click="moveTask(task, 'Completed')"
                    title="Mark Completed"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <div style="flex:1"></div>
                  <button class="icon-btn btn-view" @click.stop="openDetailModal(task)" title="Details">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  </button>
                  <button class="icon-btn btn-edit" @click="openEditModal(task)" title="Edit">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="icon-btn btn-delete" @click="deleteTask(task.id)" title="Delete">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <Teleport to="body">
        <div v-if="showForm" class="modal-backdrop" @click.self="closeModal">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-header-left">
                <div class="modal-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <h3 class="modal-title">{{ editingTask ? 'Edit Task' : 'New Task' }}</h3>
                  <p class="modal-subtitle">{{ editingTask ? 'Update task details' : 'Add something to your to-do list' }}</p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label>Title <span class="required">*</span></label>
                <input v-model="form.title" type="text" placeholder="What needs to be done?" />
              </div>
              <div class="form-row">
                <div class="field">
                  <label>Status</label>
                  <select v-model="form.status">
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div class="field">
                  <label>Related to</label>
                  <select v-model="form.person_id">
                    <option value="">— None —</option>
                    <option v-for="p in persons" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Due Date</label>
                <input v-model="form.due_at" type="datetime-local" />
              </div>
              <div class="field">
                <label>Description</label>
                <textarea v-model="form.description" placeholder="Add details..." rows="3"></textarea>
              </div>
              <div v-if="formError" class="error-msg">{{ formError }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="closeModal">Cancel</button>
              <button class="btn-save" @click="editingTask ? updateTask() : createTask()" :disabled="formLoading || !form.title">
                <span v-if="formLoading" class="spinner"></span>
                {{ formLoading ? 'Saving...' : (editingTask ? 'Save Changes' : 'Create Task') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="detailTask" class="modal-backdrop" @click.self="closeDetailModal">
          <div class="modal detail-modal">
            <div class="modal-header">
              <div class="modal-header-left">
                <div class="modal-icon detail-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <h3 class="modal-title">Task details</h3>
                  <p class="modal-subtitle">Full info and linked contact</p>
                </div>
              </div>
              <button class="modal-close" type="button" @click="closeDetailModal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body detail-body">
              <p v-if="detailLoading" class="detail-muted">Loading…</p>
              <template v-else>
                <h4 class="detail-title">{{ detailTask.title }}</h4>
                <p v-if="detailTask.description" class="detail-desc">{{ detailTask.description }}</p>
                <dl class="detail-dl">
                  <div><dt>Status</dt><dd>{{ detailTask.status }}</dd></div>
                  <div><dt>Due</dt><dd>{{ detailTask.due_at ? formatDate(detailTask.due_at) : 'Not set' }}</dd></div>
                  <div v-if="detailTask.created_at"><dt>Created</dt><dd>{{ formatDate(detailTask.created_at) }}</dd></div>
                </dl>
                <div class="detail-contact-block">
                  <p class="detail-contact-label">Linked contact</p>
                  <template v-if="detailTask.person && detailTask.person_id">
                    <p class="detail-contact-name">{{ detailTask.person.name }}</p>
                    <p v-if="detailTask.person.birthday" class="detail-muted">Birthday: {{ formatPersonDate(detailTask.person.birthday) }}</p>
                    <p v-if="detailTask.person.priority" class="detail-muted">Priority: {{ detailTask.person.priority }}</p>
                  </template>
                  <p v-else class="detail-muted">No contact linked. Edit the task to choose someone under “Related to”.</p>
                </div>
              </template>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" type="button" @click="closeDetailModal">Close</button>
              <button class="btn-save" type="button" @click="openEditFromDetail">Edit task</button>
            </div>
          </div>
        </div>
      </Teleport>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/index.js'
import { useToast } from '../composables/useToast.js'

const route = useRoute()
const { error: toastError } = useToast()

const tasks = ref([])
const persons = ref([])
const loading = ref(true)
const showForm = ref(false)
const formLoading = ref(false)
const formError = ref('')
const editingTask = ref(null)
const detailTask = ref(null)
const detailLoading = ref(false)

// Drag state
const draggingId = ref(null)
const draggingTask = ref(null)
const dragOverCol = ref(null)

function onDragStart(task, event) {
  draggingId.value = task.id
  draggingTask.value = task
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', task.id)
}

function onDragOver(status) {
  dragOverCol.value = status
}

function onDragLeave(status) {
  if (dragOverCol.value === status) dragOverCol.value = null
}

async function onDrop(status) {
  dragOverCol.value = null
  const task = draggingTask.value
  draggingId.value = null
  draggingTask.value = null
  if (!task || task.status === status) return
  await moveTask(task, status)
}

function onDragEnd() {
  draggingId.value = null
  draggingTask.value = null
  dragOverCol.value = null
}

const form = ref({ title: '', description: '', due_at: '', person_id: '', status: 'Pending' })

const columns = [
  { key: 'Pending',   label: 'Pending',   color: '#f59e0b', countBg: '#fffbeb', barColor: '#fef3c7' },
  { key: 'Overdue',   label: 'Overdue',   color: '#ef4444', countBg: '#fef2f2', barColor: '#fee2e2' },
  { key: 'Completed', label: 'Completed', color: '#10b981', countBg: '#ecfdf5', barColor: '#d1fae5' },
]

// Overdue is computed — pending tasks past due date
const tasksByStatus = key => {
  if (key === 'Overdue')   return tasks.value.filter(t => t.status === 'Pending' && isOverdue(t))
  if (key === 'Pending')   return tasks.value.filter(t => t.status === 'Pending' && !isOverdue(t))
  if (key === 'Completed') return tasks.value.filter(t => t.status === 'Completed')
  return []
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatPersonDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function openDetailModal(task) {
  detailTask.value = { ...task }
  detailLoading.value = true
  try {
    const res = await api.get(`/tasks/${task.id}`)
    const t = res.data?.task || res.data
    if (t) detailTask.value = t
  } catch (e) {
    toastError('Failed to load task details.')
  } finally {
    detailLoading.value = false
  }
}

function closeDetailModal() {
  detailTask.value = null
}

function openEditFromDetail() {
  const t = detailTask.value
  closeDetailModal()
  if (t) openEditModal(t)
}

function toLocalInput(d) {
  if (!d) return ''
  const dt = new Date(d)
  const p = n => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`
}

function isOverdue(task) {
  return task.status !== 'Completed' && !!task.due_at && new Date(task.due_at) < new Date()
}

function isDueSoon(task) {
  if (!task.due_at || task.status === 'Completed') return false
  const diff = new Date(task.due_at) - new Date()
  return diff > 0 && diff < 86400000
}

function openCreateModal(status = 'Pending') {
  editingTask.value = null
  // Overdue is computed, map to Pending
  const s = (status === 'Overdue') ? 'Pending' : status
  form.value = { title: '', description: '', due_at: '', person_id: '', status: s }
  formError.value = ''
  showForm.value = true
}

function openEditModal(task) {
  editingTask.value = task
  form.value = {
    title: task.title,
    description: task.description || '',
    due_at: toLocalInput(task.due_at),
    person_id: task.person_id || '',
    status: task.status || 'Pending',
  }
  formError.value = ''
  showForm.value = true
}

function closeModal() {
  showForm.value = false
  editingTask.value = null
  formError.value = ''
}

function extractTaskList(res) {
  const d = res?.data
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.tasks)) return d.tasks
  return []
}

async function loadTasks() {
  loading.value = true
  try {
    const res = await api.get('/tasks')
    tasks.value = extractTaskList(res)
  } catch (e) { toastError('Failed to load tasks.') }
  finally { loading.value = false }
}

async function loadPersons() {
  try {
    const res = await api.get('/persons')
    persons.value = res.data?.persons || res.data || []
  } catch (e) { toastError('Failed to load contacts.') }
}

async function createTask() {
  formError.value = ''
  formLoading.value = true
  try {
    const res = await api.post('/tasks', {
      title: form.value.title,
      description: form.value.description || undefined,
      due_at: form.value.due_at || undefined,
      person_id: form.value.person_id || undefined,
    })
    const t = res.data?.task || res.data
    t.status = form.value.status
    if (t.person_id) t.person_name = persons.value.find(p => p.id === t.person_id)?.name || null
    // patch status if not Pending
    if (form.value.status !== 'Pending') {
      await api.patch(`/tasks/${t.id}`, { status: form.value.status })
      t.status = form.value.status
    }
    tasks.value.unshift(t)
    closeModal()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Failed to create task.'
  } finally { formLoading.value = false }
}

async function updateTask() {
  formError.value = ''
  formLoading.value = true
  try {
    const res = await api.patch(`/tasks/${editingTask.value.id}`, {
      title: form.value.title,
      description: form.value.description || undefined,
      due_at: form.value.due_at || null,
      person_id: form.value.person_id || null,
      status: form.value.status,
    })
    const updated = res.data?.task || res.data
    updated.person_name = updated.person_id ? persons.value.find(p => p.id === updated.person_id)?.name || null : null
    const idx = tasks.value.findIndex(t => t.id === editingTask.value.id)
    if (idx !== -1) tasks.value[idx] = updated
    closeModal()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Failed to update task.'
  } finally { formLoading.value = false }
}

async function moveTask(task, newStatus) {
  if (!newStatus) return
  try {
    const res = await api.patch(`/tasks/${task.id}`, { status: newStatus })
    const updated = res.data?.task || res.data
    const idx = tasks.value.findIndex(t => t.id === task.id)
    if (idx !== -1) tasks.value[idx] = updated
  } catch (e) { toastError('Failed to move task.') }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return
  try {
    await api.delete(`/tasks/${id}`)
    tasks.value = tasks.value.filter(t => t.id !== id)
    if (detailTask.value?.id === id) closeDetailModal()
  } catch (e) { toastError('Failed to delete task.') }
}

watch(
  () => route.path,
  (path) => {
    if (path === '/tasks') loadTasks()
  },
  { immediate: true }
)

onMounted(() => loadPersons())
</script>

<style scoped>
.tasks-page { max-width: 1100px; }

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 2px; }
.page-subtitle { font-size: 13px; color: #94a3b8; }

.btn-new {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-new:hover { background: #059669; }

/* ── Board ── */
.board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: start;
}

/* ── Column ── */
.column {
  background: #f1f5f9;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 12px;
  background: #f1f5f9;
}

.col-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.col-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.col-name {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.1px;
}

.col-count {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 20px;
  min-width: 22px;
  text-align: center;
}


.col-body {
  padding: 4px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
}

.col-empty {
  text-align: center;
  font-size: 12px;
  color: #cbd5e1;
  padding: 20px 0;
}

/* ── Task card ── */
.task-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: box-shadow 0.15s, transform 0.15s;
  cursor: default;
}

.task-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.task-card[draggable="true"] { cursor: grab; }
.task-card[draggable="true"]:active { cursor: grabbing; }

.card-dragging {
  opacity: 0.35;
  transform: scale(0.97);
  box-shadow: none !important;
}

.drop-target {
  background: rgba(16, 185, 129, 0.06);
  outline: 2px dashed #10b981;
  outline-offset: -4px;
  border-radius: 10px;
  min-height: 80px;
}

.card-done { opacity: 0.6; }
.card-overdue { border-color: #fca5a5; }

.card-topbar {
  height: 3px;
  width: 100%;
}

.card-content {
  padding: 12px 12px 10px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
  margin-bottom: 4px;
}
.card-title.strikethrough {
  text-decoration: line-through;
  color: #94a3b8;
}

.card-desc {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.chip-overdue { background: #fef2f2; border-color: #fca5a5; color: #ef4444; }

.overdue-tag {
  background: #ef4444;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 10px;
  margin-left: 2px;
  letter-spacing: 0.02em;
}
.soon-tag {
  background: #f59e0b;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 10px;
  margin-left: 2px;
}

/* Card actions row */
.card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  border-top: 1px solid #f1f5f9;
  padding-top: 8px;
  margin-top: 4px;
}

.move-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  flex-shrink: 0;
}
.move-btn:hover { background: #e2e8f0; color: #0f172a; }
.move-btn-fwd { border-color: #bfdbfe; background: #eff6ff; color: #3b82f6; }
.move-btn-fwd:hover { background: #dbeafe; }

.icon-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  color: #cbd5e1;
}
.btn-view:hover { background: #eff6ff; color: #3b82f6; }
.btn-edit:hover { background: #ecfdf5; color: #10b981; }
.btn-delete:hover { background: #fef2f2; color: #ef4444; }

.detail-modal { max-width: 440px; }
.detail-icon { background: #eff6ff; color: #3b82f6; }
.detail-body { padding-top: 4px; }
.detail-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
  line-height: 1.35;
}
.detail-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 16px;
}
.detail-dl {
  margin: 0 0 16px;
  font-size: 13px;
}
.detail-dl > div {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}
.detail-dl dt { color: #94a3b8; font-weight: 500; }
.detail-dl dd { margin: 0; color: #0f172a; }
.detail-contact-block {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
}
.detail-contact-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  margin-bottom: 8px;
}
.detail-contact-name { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
.detail-muted { font-size: 12px; color: #64748b; margin: 0; }


/* Skeleton */
.skeleton-card {
  padding: 14px;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.skel { background: #e2e8f0; border-radius: 6px; animation: pulse 1.4s ease-in-out infinite; }
.skel-line { height: 12px; }
.skel-badge { width: 28px; height: 18px; border-radius: 20px; }
.w80 { width: 80%; }
.w50 { width: 50%; }

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.45);
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
  max-width: 480px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.16);
  animation: modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes modalIn {
  from { transform: scale(0.93) translateY(10px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f1f5f9;
}
.modal-header-left { display: flex; align-items: center; gap: 12px; }
.modal-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #ecfdf5;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.modal-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 1px; }
.modal-subtitle { font-size: 11px; color: #94a3b8; }
.modal-close {
  width: 28px; height: 28px;
  border-radius: 7px; border: none;
  background: #f1f5f9; color: #64748b;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.12s;
}
.modal-close:hover { background: #e2e8f0; color: #0f172a; }
.modal-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
label { font-size: 12px; font-weight: 600; color: #374151; }
.required { color: #ef4444; }
input, textarea, select {
  padding: 8px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 7px;
  font-size: 13px;
  color: #0f172a;
  outline: none;
  font-family: inherit;
  background: #fff;
  transition: border-color 0.12s, box-shadow 0.12s;
}
input:focus, textarea:focus, select:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
}
textarea { resize: vertical; line-height: 1.6; }
.error-msg { font-size: 12px; color: #ef4444; }
.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
  border-radius: 0 0 16px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.btn-ghost {
  padding: 7px 14px;
  background: #fff;
  color: #475569;
  border: 1.5px solid #e5e7eb;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}
.btn-ghost:hover { background: #f8fafc; }
.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-save:hover:not(:disabled) { background: #059669; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .board { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
