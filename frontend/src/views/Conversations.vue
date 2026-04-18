<template>
  <AppLayout>
    <div class="conversations-page">
      <section class="chat-panel" aria-label="Chat with Zappy">
        <header class="chat-header">
          <div class="chat-header-left">
            <div class="brand-glyph" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div class="chat-header-text">
              <h1 class="chat-title">Zappy</h1>
              <p class="chat-sub">Tasks · notes · people — same thread as WhatsApp</p>
            </div>
          </div>
          <div class="chat-header-right">
            <button class="clear-btn" @click="clearConversation" :disabled="clearing || conversations.length === 0" title="Clear conversation">
              <svg v-if="!clearing" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              <span v-else class="spinner gray"></span>
              Clear
            </button>
            <span class="status-pill" title="Assistant ready">
              <span class="status-dot"></span>
              Ready
            </span>
          </div>
        </header>

        <div class="chat-body">
          <div class="chat-messages" ref="messagesContainer">
            <div v-if="loading" class="loading-state">
              <div class="spinner-large" aria-hidden="true"></div>
              <p class="loading-label">Loading messages…</p>
            </div>

            <template v-else>
              <div v-if="hasMore" class="load-more-wrap">
                <button type="button" class="load-more-btn" @click="loadMore" :disabled="loadingMore">
                  <span v-if="loadingMore" class="spinner gray"></span>
                  <template v-else>
                    <svg class="load-more-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </template>
                  {{ loadingMore ? 'Loading…' : 'Load earlier' }}
                </button>
              </div>

              <div v-if="conversations.length === 0" class="empty-chat">
                <div class="empty-visual">
                  <div class="empty-orbit"></div>
                  <div class="empty-icon-wrap">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                </div>
                <h2 class="empty-title">Start the thread</h2>
                <p class="empty-desc">Ask for your tasks, jot a note, or add someone’s birthday — Zappy uses your real data.</p>
              </div>

              <div
                v-for="msg in conversations"
                :key="msg.id"
                class="msg-block"
                :class="msg.role"
              >
                <template v-if="msg.role === 'assistant'">
                  <div class="msg-avatar" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                </template>
                <div class="msg-stack">
                  <div class="bubble" :class="msg.role">
                    <div class="bubble-inner">
                      <p class="msg-text">{{ msg.content }}</p>
                    </div>
                    <time class="msg-meta">{{ formatTime(msg.created_at) }}</time>
                  </div>
                </div>
              </div>

              <div v-if="sending" class="msg-block assistant sending-block">
                <div class="msg-avatar" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div class="msg-stack">
                  <div class="bubble assistant typing">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
              </div>
              <div ref="scrollAnchor" class="chat-scroll-anchor" aria-hidden="true" />
            </template>
          </div>

          <footer class="chat-composer">
            <div v-if="sendError" class="send-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ sendError }}
            </div>
            <form @submit.prevent="sendMessage" class="composer-grid">
              <div class="composer-field">
                <textarea
                  v-model="newMessage"
                  placeholder="Message Zappy…"
                  rows="1"
                  @keydown.enter.exact.prevent="sendMessage"
                  @input="autoResize"
                  ref="inputRef"
                  :disabled="sending"
                  autocomplete="off"
                ></textarea>
              </div>
              <button type="submit" class="send-btn" :disabled="sending || !newMessage.trim()" title="Send">
                <span v-if="sending" class="spinner white"></span>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
              <p class="composer-hint">
                <kbd>Enter</kbd> send · <kbd>Shift</kbd><kbd>Enter</kbd> new line
              </p>
            </form>
          </footer>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/index.js'

const conversations = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const sending = ref(false)
const clearing = ref(false)
const sendError = ref('')
const newMessage = ref('')
const messagesContainer = ref(null)
const scrollAnchor = ref(null)
const inputRef = ref(null)
const hasMore = ref(false)
const PAGE_SIZE = 30
const suppressAutoScroll = ref(false)

function mapRow(m) {
  return {
    ...m,
    content: m.message ?? m.content,
  }
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  })
}

async function loadConversations({ prepend = false } = {}) {
  if (!prepend) loading.value = true
  else loadingMore.value = true

  try {
    const params = { limit: PAGE_SIZE }
    if (prepend && conversations.value.length) {
      const oldest = conversations.value[0]
      const before = oldest.created_at
      if (before) params.before = typeof before === 'string' ? before : new Date(before).toISOString()
    }

    const res = await api.get('/conversations', { params })
    const raw = res.data?.data || []
    const data = raw.map(mapRow)

    if (prepend) {
      suppressAutoScroll.value = true
      try {
        const el = messagesContainer.value
        const prevScrollHeight = el ? el.scrollHeight : 0
        conversations.value = [...data, ...conversations.value]
        hasMore.value = !!res.data?.has_more
        await nextTick()
        if (el) el.scrollTop = el.scrollHeight - prevScrollHeight
        await nextTick()
      } finally {
        suppressAutoScroll.value = false
      }
    } else {
      conversations.value = data
      hasMore.value = !!res.data?.has_more
      await nextTick()
      scrollToBottom()
    }
  } catch (e) {
    console.error('Failed to load conversations', e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  await loadConversations({ prepend: true })
}

async function sendMessage() {
  const content = newMessage.value.trim()
  if (!content || sending.value) return

  sendError.value = ''
  sending.value = true

  const userMsg = {
    id: `temp-${Date.now()}`,
    role: 'user',
    content,
    created_at: new Date().toISOString(),
  }
  conversations.value.push(userMsg)
  newMessage.value = ''
  if (inputRef.value) inputRef.value.style.height = 'auto'

  await nextTick()
  scrollToBottom()

  try {
    const res = await api.post('/conversations/messages', { message: content })
    const serverMsgs = (res.data?.messages || []).map(mapRow)
    const idx = conversations.value.findIndex(m => m.id === userMsg.id)
    if (serverMsgs.length >= 2 && idx !== -1) {
      conversations.value.splice(idx, 1, ...serverMsgs)
    } else if (idx !== -1) {
      conversations.value.splice(idx, 1)
      const reply = res.data?.reply
      const text = typeof reply === 'string' ? reply : JSON.stringify(reply)
      conversations.value.push(
        { ...userMsg },
        {
          id: `temp-reply-${Date.now()}`,
          role: 'assistant',
          content: text,
          created_at: new Date().toISOString(),
        }
      )
    }
    await nextTick()
    scrollToBottom()
    inputRef.value?.focus()
  } catch (e) {
    sendError.value = e.response?.data?.error || e.response?.data?.message || 'Failed to send message.'
    conversations.value = conversations.value.filter(m => m.id !== userMsg.id)
  } finally {
    sending.value = false
  }
}

async function clearConversation() {
  if (!confirm('Clear all conversation history?')) return
  clearing.value = true
  try {
    await api.delete('/conversations')
    conversations.value = []
    hasMore.value = false
  } catch (e) {
    console.error('Failed to clear conversation', e)
  } finally {
    clearing.value = false
  }
}

function scrollToBottom() {
  const run = () => {
    const box = messagesContainer.value
    if (box) {
      box.scrollTop = box.scrollHeight
    }
    scrollAnchor.value?.scrollIntoView({ block: 'end', behavior: 'auto' })
  }
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(run)
    })
  })
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  scrollToBottom()
}

watch(
  [() => conversations.value, () => sending.value],
  () => {
    if (loading.value || suppressAutoScroll.value) return
    scrollToBottom()
  },
  { deep: true, flush: 'post' }
)

watch(loading, (v) => {
  if (!v) scrollToBottom()
})

onMounted(() => {
  loadConversations()
  inputRef.value?.focus()
})
</script>

<style scoped>
.conversations-page {
  --font-display: 'Outfit', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --ink: #0c1222;
  --ink-muted: #5c6578;
  --line: rgba(15, 23, 42, 0.08);
  --violet: #7c3aed;
  --violet-soft: #ede9fe;
  --surface: #ffffff;
  --sheet: #f4f6fa;

  max-width: 820px;
  margin: 0 auto;
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 80px);
  max-height: calc(100dvh - 80px);
  min-height: 0;
  font-family: var(--font-body);
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--surface);
  border-radius: 20px;
  border: 1px solid var(--line);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.6) inset,
    0 2px 4px rgba(15, 23, 42, 0.04),
    0 24px 48px -12px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.chat-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  background: linear-gradient(135deg, #fafbfc 0%, #fff 50%, #f8fafc 100%);
  border-bottom: 1px solid var(--line);
  position: relative;
}

.chat-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.15), transparent);
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-glyph {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(145deg, #6366f1 0%, #7c3aed 55%, #5b21b6 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow:
    0 8px 20px rgba(99, 102, 241, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

.chat-header-text {
  min-width: 0;
}

.chat-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ink);
  margin: 0;
  line-height: 1.15;
}

.chat-sub {
  margin: 4px 0 0;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.clear-btn:hover:not(:disabled) {
  color: #ef4444;
  border-color: #fca5a5;
  background: #fef2f2;
}
.clear-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #15803d;
  background: rgba(22, 163, 74, 0.08);
  border: 1px solid rgba(22, 163, 74, 0.2);
  border-radius: 999px;
  flex-shrink: 0;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
  animation: pulse-dot 2.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.65;
  }
}

.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--sheet);
}

.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 20px 18px 28px;
  scroll-behavior: smooth;
  background-color: var(--sheet);
  background-image:
    radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.06) 1px, transparent 0);
  background-size: 20px 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 72px 20px;
}

.loading-label {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ink-muted);
}

.spinner-large {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(124, 58, 237, 0.15);
  border-top-color: var(--violet);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink-muted);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.load-more-btn:hover:not(:disabled) {
  color: var(--violet);
  border-color: rgba(124, 58, 237, 0.35);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.08);
}

.load-more-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.load-more-icon {
  opacity: 0.85;
}

.empty-chat {
  text-align: center;
  padding: 48px 24px 56px;
  max-width: 340px;
  margin: 0 auto;
}

.empty-visual {
  position: relative;
  width: 88px;
  height: 88px;
  margin: 0 auto 20px;
}

.empty-orbit {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px dashed rgba(124, 58, 237, 0.25);
  animation: orbit-spin 24s linear infinite;
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background: linear-gradient(160deg, #fff 0%, var(--violet-soft) 100%);
  color: var(--violet);
  box-shadow:
    0 8px 24px rgba(124, 58, 237, 0.14),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.empty-desc {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--ink-muted);
}

.msg-block {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: flex-end;
}

.msg-block.user {
  flex-direction: row-reverse;
}

.msg-block.assistant {
  flex-direction: row;
}

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--violet);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.msg-stack {
  max-width: min(82%, 520px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.msg-block.user .msg-stack {
  align-items: flex-end;
}

.bubble {
  position: relative;
  border-radius: 18px;
  width: fit-content;
  max-width: 100%;
}

.bubble.user .bubble-inner {
  background: linear-gradient(145deg, #4f46e5 0%, #6d28d9 100%);
  color: #fff;
  padding: 12px 16px 10px;
  border-radius: 18px 18px 4px 18px;
  box-shadow:
    0 4px 16px rgba(79, 70, 229, 0.28),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.bubble.assistant .bubble-inner {
  background: var(--surface);
  color: var(--ink);
  padding: 12px 16px 10px;
  border-radius: 18px 18px 18px 4px;
  border: 1px solid var(--line);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  border-left: 3px solid var(--violet);
}

.msg-text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.58;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-meta {
  display: block;
  margin-top: 6px;
  padding: 0 4px;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--ink-muted);
  opacity: 0.85;
}

.msg-block.user .msg-meta {
  text-align: right;
  align-self: flex-end;
}

.bubble.typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 16px 20px;
  min-height: 48px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px 18px 18px 4px;
  border-left: 3px solid var(--violet);
}

.dot {
  width: 7px;
  height: 7px;
  background: #94a3b8;
  border-radius: 50%;
  animation: bounce 1.35s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.15s;
}
.dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

.sending-block {
  margin-bottom: 0;
}

.chat-scroll-anchor {
  height: 1px;
  width: 100%;
  overflow: hidden;
  pointer-events: none;
}

.chat-composer {
  flex-shrink: 0;
  padding: 16px 18px 22px;
  background: var(--surface);
  border-top: 1px solid var(--line);
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.04);
}

.send-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px 12px;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
}

.send-error svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.composer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px;
  grid-template-rows: auto auto;
  column-gap: 10px;
  row-gap: 8px;
  align-items: end;
}

.composer-field {
  grid-column: 1;
  grid-row: 1;
  border-radius: 14px;
  background: var(--sheet);
  border: 1.5px solid var(--line);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.composer-field:focus-within {
  border-color: rgba(124, 58, 237, 0.45);
  box-shadow:
    0 0 0 4px rgba(124, 58, 237, 0.1),
    0 2px 8px rgba(124, 58, 237, 0.06);
  background: var(--surface);
}

.composer-grid .send-btn {
  grid-column: 2;
  grid-row: 1;
}

.composer-field textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: none;
  background: transparent;
  border-radius: 14px;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  line-height: 1.45;
  color: var(--ink);
  caret-color: #7c3aed;
  outline: none;
  resize: none;
  max-height: 120px;
  min-height: 42px;
}

.composer-field textarea::placeholder {
  color: #94a3b8;
}

.composer-field textarea:disabled {
  opacity: 0.75;
}

.send-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  background: linear-gradient(145deg, #6366f1 0%, #7c3aed 100%);
  box-shadow:
    0 4px 16px rgba(99, 102, 241, 0.32),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  transition:
    transform 0.12s ease,
    filter 0.15s ease,
    box-shadow 0.15s ease;
}

.send-btn:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.composer-hint {
  grid-column: 1;
  grid-row: 2;
  margin: 0;
  padding-left: 2px;
  text-align: left;
  font-size: 0.6875rem;
  color: var(--ink-muted);
  line-height: 1.4;
}

.composer-hint kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 600;
  color: #64748b;
  background: var(--sheet);
  border: 1px solid var(--line);
  border-radius: 4px;
  margin: 0 1px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spinner.white {
  border-color: rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
}

.spinner.gray {
  border-color: rgba(100, 116, 139, 0.2);
  border-top-color: #64748b;
}
</style>
