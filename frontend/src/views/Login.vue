<template>
  <div class="login-page">
    <div class="login-left">
      <div class="left-content">
        <div class="left-brand">
          <span class="left-brand-icon">⚡</span>
          <span class="left-brand-name">Zappy</span>
        </div>
        <p class="left-tagline">Your AI-powered WhatsApp personal assistant</p>
        <ul class="left-features">
          <li>
            <span class="feature-check">✓</span>
            <span>AI-powered assistant that understands you</span>
          </li>
          <li>
            <span class="feature-check">✓</span>
            <span>WhatsApp integration — chat naturally</span>
          </li>
          <li>
            <span class="feature-check">✓</span>
            <span>Smart reminders and task management</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="login-right">
      <div class="login-card">

        <!-- Step indicator -->
        <div class="steps-indicator">
          <div class="step-dot" :class="{ active: step >= 1, done: step > 1 }">1</div>
          <div class="step-line" :class="{ done: step > 1 }"></div>
          <div class="step-dot" :class="{ active: step >= 2, done: step > 2 }">2</div>
          <div class="step-line" :class="{ done: step > 2 }"></div>
          <div class="step-dot" :class="{ active: step >= 3 }">3</div>
        </div>

        <!-- Step 1: Mobile number -->
        <div v-if="step === 1">
          <div class="card-header">
            <h1>Welcome to Zappy</h1>
            <p class="card-subtitle">Enter your WhatsApp number to get started</p>
          </div>
          <form @submit.prevent="requestOtp">
            <div class="field">
              <label>Mobile Number</label>
              <input
                v-model="mobile"
                type="tel"
                placeholder="+1 234 567 8900"
                :disabled="loading"
                required
                autofocus
              />
              <p class="field-hint">Include country code, e.g. +91 for India</p>
            </div>
            <div v-if="error" class="error-msg">{{ error }}</div>
            <button type="submit" :disabled="loading || !mobile" class="btn-primary">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Sending OTP...' : 'Send OTP →' }}
            </button>
          </form>
        </div>

        <!-- Step 2: OTP verification -->
        <div v-if="step === 2">
          <div class="card-header">
            <h1>Verify your number</h1>
            <p class="card-subtitle">Enter the code sent to <strong>{{ mobile }}</strong></p>
          </div>
          <form @submit.prevent="verifyOtp">
            <div class="otp-target">
              OTP sent via WhatsApp · <span class="demo-hint">Demo: check backend terminal</span>
            </div>
            <div class="field">
              <label>OTP Code</label>
              <input
                v-model="otp"
                type="text"
                placeholder="Enter 6-digit code"
                :disabled="loading"
                required
                autofocus
                maxlength="6"
                class="otp-input"
              />
            </div>
            <div v-if="error" class="error-msg">{{ error }}</div>
            <button type="submit" :disabled="loading || otp.length < 6" class="btn-primary">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Verifying...' : 'Verify & Continue →' }}
            </button>
            <button type="button" class="btn-ghost" @click="resetStep" :disabled="loading">
              ← Use a different number
            </button>
          </form>
        </div>

        <!-- Step 3: Name setup (new users only) -->
        <div v-if="step === 3">
          <div class="card-header">
            <h1>What's your name?</h1>
            <p class="card-subtitle">One last thing to personalise your experience</p>
          </div>
          <form @submit.prevent="completeProfile">
            <div class="field">
              <label>Your Name <span class="required">*</span></label>
              <input
                v-model="name"
                type="text"
                placeholder="e.g. Alex Johnson"
                :disabled="loading"
                required
                autofocus
              />
            </div>
            <div v-if="error" class="error-msg">{{ error }}</div>
            <button type="submit" :disabled="loading || !name" class="btn-primary">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Setting up...' : 'Get Started →' }}
            </button>
          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index.js'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const step = ref(1)
const mobile = ref('')
const otp = ref('')
const name = ref('')
const loading = ref(false)
const error = ref('')
const pendingToken = ref(null) // hold token until profile is complete

async function requestOtp() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/auth/request-otp', { mobile_number: mobile.value })
    step.value = 2
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to send OTP. Please try again.'
  } finally {
    loading.value = false
  }
}

async function verifyOtp() {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/auth/verify-otp', { mobile_number: mobile.value, code: otp.value })
    const { token, name: userName, is_new_user } = res.data

    if (is_new_user) {
      // Hold token in memory — don't store in localStorage yet or the router
      // guard will redirect /login → /dashboard before step 3 renders
      pendingToken.value = token
      step.value = 3
    } else {
      authStore.login(token, { mobile: mobile.value, name: userName })
      router.push('/dashboard')
    }
  } catch (e) {
    error.value = e.response?.data?.error || 'Invalid OTP. Please try again.'
  } finally {
    loading.value = false
  }
}

async function completeProfile() {
  error.value = ''
  loading.value = true
  try {
    const headers = { Authorization: `Bearer ${pendingToken.value}` }

    await api.patch('/settings', { name: name.value }, { headers })

    // Now commit token to store/localStorage — router guard won't fire until push
    authStore.login(pendingToken.value, { mobile: mobile.value, name: name.value })
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to save profile. Please try again.'
  } finally {
    loading.value = false
  }
}

function resetStep() {
  step.value = 1
  otp.value = ''
  error.value = ''
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
}

.login-left {
  width: 45%;
  background: linear-gradient(145deg, #4f46e5 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.left-content {
  max-width: 360px;
}

.left-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.left-brand-icon {
  font-size: 32px;
  line-height: 1;
}

.left-brand-name {
  font-size: 36px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -1px;
}

.left-tagline {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin-bottom: 36px;
  font-weight: 400;
}

.left-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.left-features li {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
}

.feature-check {
  width: 22px;
  height: 22px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  color: #ffffff;
}

.login-right {
  width: 55%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: #ffffff;
}

.login-card {
  width: 100%;
  max-width: 440px;
}

/* Step indicator */
.steps-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.step-dot.active {
  background: #6366f1;
  color: #fff;
}

.step-dot.done {
  background: #10b981;
  color: #fff;
}

.step-dot.done::after {
  content: '✓';
  font-size: 12px;
}

.step-dot.done {
  font-size: 0;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  transition: background 0.2s ease;
}

.step-line.done {
  background: #10b981;
}

.card-header {
  margin-bottom: 28px;
}

.card-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.5px;
  margin-bottom: 6px;
}

.card-subtitle {
  font-size: 15px;
  color: #475569;
}

.card-subtitle strong {
  color: #0f172a;
}

.otp-target {
  font-size: 13px;
  color: #475569;
  margin-bottom: 20px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.demo-hint {
  color: #6366f1;
  font-weight: 500;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.required {
  color: #ef4444;
}

.optional {
  color: #94a3b8;
  font-weight: 400;
}

input {
  padding: 11px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
  font-family: inherit;
  background: #ffffff;
}

input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

input:disabled {
  background: #f8fafc;
  color: #94a3b8;
}

.otp-input {
  font-size: 22px;
  letter-spacing: 0.2em;
  font-weight: 600;
  text-align: center;
}

.field-hint {
  font-size: 12px;
  color: #94a3b8;
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-msg::before {
  content: '⚠';
  font-size: 14px;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s ease, transform 0.1s ease;
  margin-bottom: 12px;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.99);
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-ghost {
  width: 100%;
  padding: 10px;
  background: none;
  border: none;
  color: #6366f1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: color 0.15s ease;
}

.btn-ghost:hover:not(:disabled) {
  color: #4f46e5;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .login-left { display: none; }
  .login-right { width: 100%; padding: 32px 24px; }
}
</style>
