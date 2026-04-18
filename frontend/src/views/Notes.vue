<template>
  <AppLayout>
    <div class="notes-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Notes</h1>
          <p class="page-subtitle">{{ notes.length }} note{{ notes.length !== 1 ? 's' : '' }}</p>
        </div>
        <div class="header-actions">
          <div class="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search notes..."
              @input="debouncedSearch"
            />
            <button v-if="searchQuery" class="search-clear" @click="clearSearch">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <button class="btn-primary" @click="openModal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Note
          </button>
        </div>
      </div>

      <!-- Modal -->
      <Teleport to="body">
        <div v-if="showForm" class="modal-backdrop" @click.self="closeModal">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-header-left">
                <div class="modal-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <h3 class="modal-title">{{ editingId ? 'Edit Note' : 'New Note' }}</h3>
                  <p class="modal-subtitle">{{ editingId ? 'Update note content' : 'Capture a thought, idea or reminder' }}</p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label>Content <span class="required">*</span></label>
                <textarea v-model="form.content" placeholder="Write your note..." rows="5" autofocus></textarea>
              </div>
              <div v-if="formError" class="error-msg">{{ formError }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="closeModal">Cancel</button>
              <button class="btn-primary" @click="saveNote" :disabled="formLoading || !form.content">
                <span v-if="formLoading" class="spinner"></span>
                {{ formLoading ? 'Saving…' : (editingId ? 'Update Note' : 'Save Note') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Loading -->
      <div v-if="loading" class="notes-grid">
        <div class="skeleton-note" v-for="i in 6" :key="i"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="notes.length === 0" class="empty-state">
        <div class="empty-illustration">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fde68a" stroke-width="1.2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <p class="empty-title">{{ searchQuery ? 'No matching notes' : 'No notes yet' }}</p>
        <p class="empty-desc">{{ searchQuery ? 'Try a different keyword.' : 'Capture your first thought.' }}</p>
        <button v-if="!searchQuery" class="btn-primary" @click="openModal">+ New Note</button>
      </div>

      <!-- Notes grid -->
      <div v-else class="notes-grid">
        <div v-for="note in notes" :key="note.id" class="note-card">
          <div class="note-body">
            <div class="note-content">{{ note.content }}</div>
          </div>
          <div class="note-footer">
            <span class="note-date">{{ formatDate(note.created_at) }}</span>
            <div class="note-actions">
              <button class="note-btn edit-btn" @click="openEditModal(note)" title="Edit">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="note-btn delete-btn" @click="deleteNote(note.id)" title="Delete">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/index.js'
import { useToast } from '../composables/useToast.js'

const notes = ref([])
const loading = ref(true)
const showForm = ref(false)
const formLoading = ref(false)
const formError = ref('')
const searchQuery = ref('')
const editingId = ref(null)
const form = ref({ content: '' })
const { error: toastError } = useToast()
let searchTimer = null

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function openModal() {
  editingId.value = null
  form.value = { content: '' }
  formError.value = ''
  showForm.value = true
}

function openEditModal(note) {
  editingId.value = note.id
  form.value = { content: note.content }
  formError.value = ''
  showForm.value = true
}

function closeModal() {
  showForm.value = false
  editingId.value = null
  formError.value = ''
}

async function loadNotes(keyword = '') {
  loading.value = true
  try {
    const params = keyword ? { keyword } : {}
    const res = await api.get('/notes', { params })
    notes.value = res.data?.notes || res.data || []
  } catch (e) {
    toastError('Failed to load notes.')
  } finally {
    loading.value = false
  }
}

function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadNotes(searchQuery.value), 400)
}

function clearSearch() {
  searchQuery.value = ''
  loadNotes()
}

async function saveNote() {
  formError.value = ''
  formLoading.value = true
  try {
    if (editingId.value) {
      const res = await api.patch(`/notes/${editingId.value}`, { content: form.value.content })
      const updated = res.data?.note || res.data
      const idx = notes.value.findIndex(n => n.id === editingId.value)
      if (idx !== -1) notes.value[idx] = { ...notes.value[idx], ...updated }
    } else {
      const res = await api.post('/notes', { content: form.value.content })
      notes.value.unshift(res.data?.note || res.data)
    }
    closeModal()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Failed to save note.'
  } finally {
    formLoading.value = false
  }
}

async function deleteNote(id) {
  if (!confirm('Delete this note?')) return
  try {
    await api.delete(`/notes/${id}`)
    notes.value = notes.value.filter(n => n.id !== id)
  } catch (e) {
    toastError('Failed to delete note.')
  }
}

onMounted(() => loadNotes())
</script>

<style scoped>
.notes-page { max-width: 1100px; }

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.4px;
  margin-bottom: 2px;
}

.page-subtitle { font-size: 13px; color: #94a3b8; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-wrap:focus-within {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
}

.search-input {
  border: none;
  outline: none;
  font-size: 14px;
  color: #0f172a;
  width: 200px;
  background: transparent;
  font-family: inherit;
  padding: 0;
}

.search-input::placeholder { color: #94a3b8; }

.search-clear {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s ease;
}
.search-clear:hover { color: #ef4444; }

.btn-primary {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
}
.btn-primary:hover:not(:disabled) { background: #d97706; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

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
  max-width: 520px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0,0,0,0.18);
  animation: modalIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
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

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fffbeb;
  color: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

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
  gap: 16px;
}

.field { display: flex; flex-direction: column; gap: 6px; }

label { font-size: 13px; font-weight: 600; color: #374151; }
.required { color: #ef4444; }

input, textarea {
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
input:focus, textarea:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}
textarea { resize: vertical; line-height: 1.6; }

.error-msg { font-size: 13px; color: #ef4444; }

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
  border-radius: 0 0 16px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

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

/* ── Notes grid ── */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.skeleton-note {
  height: 180px;
  background: #f1f5f9;
  border-radius: 14px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

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

.empty-illustration { margin-bottom: 8px; }
.empty-title { font-size: 15px; font-weight: 600; color: #374151; }
.empty-desc { font-size: 13px; color: #94a3b8; margin-bottom: 12px; }

/* Note card */
.note-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition: all 0.18s ease;
  overflow: hidden;
}

.note-card:hover {
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.1);
  transform: translateY(-2px);
  border-color: #fde68a;
}

.note-body {
  padding: 18px 18px 12px;
  flex: 1;
}

.note-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-footer {
  padding: 10px 14px;
  border-top: 1px solid #f1f5f9;
  background: #fafbff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.note-date {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.note-card:hover .note-actions { opacity: 1; }

.note-btn {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: none;
  background: none;
  color: #cbd5e1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.edit-btn:hover { background: #fffbeb; color: #f59e0b; }
.delete-btn:hover { background: #fef2f2; color: #ef4444; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .search-input { width: 140px; }
  .modal { max-width: 100%; }
}
</style>
