<template>
  <AppLayout>
    <div class="settings-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Configure your Zappy assistant preferences</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner-large"></div>
      </div>

      <div v-else class="settings-stack">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Assistant Preferences</h2>
              <p class="card-desc">Configure your daily summary and birthday reminder settings</p>
            </div>
          </div>
          <div class="card-body">
            <div class="section-label">Daily Summary</div>
            <div class="time-field">
              <div class="field-info">
                <label for="summary-time">Summary Time</label>
                <p class="field-desc">You'll receive a WhatsApp summary at this time every day</p>
              </div>
              <input
                id="summary-time"
                v-model="form.summary_time"
                type="time"
                class="time-input"
              />
            </div>

            <div class="divider"></div>

            <div class="section-label">Birthday Reminders</div>
            <p class="section-desc">Days in advance to remind you, based on contact priority</p>
            <div class="birthday-grid">
              <div class="priority-col">
                <div class="priority-header high">
                  <span class="priority-dot"></span>
                  High Priority
                </div>
                <div class="field">
                  <label>Days before birthday</label>
                  <input
                    v-model.number="form.birthday_lead_times.high"
                    type="number"
                    min="0"
                    max="365"
                    class="days-input"
                  />
                </div>
              </div>
              <div class="priority-col">
                <div class="priority-header medium">
                  <span class="priority-dot"></span>
                  Medium Priority
                </div>
                <div class="field">
                  <label>Days before birthday</label>
                  <input
                    v-model.number="form.birthday_lead_times.medium"
                    type="number"
                    min="0"
                    max="365"
                    class="days-input"
                  />
                </div>
              </div>
              <div class="priority-col">
                <div class="priority-header low">
                  <span class="priority-dot"></span>
                  Low Priority
                </div>
                <div class="field">
                  <label>Days before birthday</label>
                  <input
                    v-model.number="form.birthday_lead_times.low"
                    type="number"
                    min="0"
                    max="365"
                    class="days-input"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <div v-if="error" class="inline-error"><span>⚠</span> {{ error }}</div>
            <button class="btn-primary" @click="saveSettings" :disabled="saving || !isDirty">
              <span v-if="saving" class="spinner"></span>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="successMsg" class="toast" :class="{ visible: !!successMsg }">
        <span class="toast-icon">✓</span>
        {{ successMsg }}
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/index.js'
import { useToast } from '../composables/useToast.js'

const { error: toastError } = useToast()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const successMsg = ref('')

const original = ref(null)

const form = ref({
  summary_time: '08:00',
  birthday_lead_times: {
    high: 7,
    medium: 3,
    low: 1
  }
})

const isDirty = computed(() => {
  if (!original.value) return false
  return (
    form.value.summary_time !== original.value.summary_time ||
    form.value.birthday_lead_times.high !== original.value.birthday_lead_times.high ||
    form.value.birthday_lead_times.medium !== original.value.birthday_lead_times.medium ||
    form.value.birthday_lead_times.low !== original.value.birthday_lead_times.low
  )
})

async function loadSettings() {
  loading.value = true
  try {
    const res = await api.get('/settings')
    const data = res.data?.settings || res.data || {}
    const loaded = {
      summary_time: data.summary_time || '08:00',
      birthday_lead_times: {
        high: data.birthday_lead_times?.high ?? 7,
        medium: data.birthday_lead_times?.medium ?? 3,
        low: data.birthday_lead_times?.low ?? 1
      }
    }
    form.value = JSON.parse(JSON.stringify(loaded))
    original.value = JSON.parse(JSON.stringify(loaded))
  } catch (e) {
    toastError('Failed to load settings.')
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  error.value = ''
  successMsg.value = ''
  saving.value = true
  try {
    await api.patch('/settings', {
      settings: {
        summary_time: form.value.summary_time,
        birthday_lead_times: form.value.birthday_lead_times
      }
    })
    original.value = JSON.parse(JSON.stringify(form.value))
    successMsg.value = 'Settings saved successfully!'
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to save settings.'
  } finally {
    saving.value = false
  }
}

onMounted(() => loadSettings())
</script>

<style scoped>
.settings-page {
  max-width: 700px;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #94a3b8;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px;
}

.spinner-large {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 3px;
}

.card-desc {
  font-size: 13px;
  color: #94a3b8;
}

.card-body {
  padding: 24px;
}

.card-footer {
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  background: #fafafa;
}

.time-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.field-info {
  flex: 1;
}

.field-info label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}

.field-desc {
  font-size: 13px;
  color: #94a3b8;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.section-desc {
  font-size: 13px;
  color: #94a3b8;
  margin-top: -10px;
  margin-bottom: 16px;
}

.divider {
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 24px 0;
}

.time-input {
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 15px;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;
  width: 160px;
  flex-shrink: 0;
}

.time-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.birthday-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.priority-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.priority-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 8px;
}

.priority-header.high {
  background: #fef2f2;
  color: #ef4444;
}

.priority-header.medium {
  background: #fffbeb;
  color: #f59e0b;
}

.priority-header.low {
  background: #ecfdf5;
  color: #10b981;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.days-input {
  padding: 10px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;
  width: 100%;
  text-align: center;
}

.days-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.inline-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 13px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
}

.btn-primary {
  padding: 9px 20px;
  background: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #0284c7;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  background: #0f172a;
  color: #ffffff;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
  z-index: 1000;
}

.toast.visible {
  opacity: 1;
  transform: translateY(0);
}

.toast-icon {
  width: 20px;
  height: 20px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .birthday-grid {
    grid-template-columns: 1fr;
  }
  .time-field {
    flex-direction: column;
    align-items: flex-start;
  }
  .time-input {
    width: 100%;
  }
}
</style>
