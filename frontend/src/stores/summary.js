import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/index.js'

const TTL_MS = 5 * 60 * 1000

export const useSummaryStore = defineStore('dashboardSummary', () => {
  const text = ref('')
  const fetchedAt = ref(0)
  const loading = ref(false)

  async function fetchSummary({ force = false } = {}) {
    const now = Date.now()
    if (!force && fetchedAt.value && now - fetchedAt.value < TTL_MS) {
      return text.value
    }
    loading.value = true
    try {
      const res = await api.get('/summary')
      text.value = res.data?.summary || res.data?.content || ''
      fetchedAt.value = Date.now()
      return text.value
    } catch {
      text.value = ''
      return ''
    } finally {
      loading.value = false
    }
  }

  function invalidate() {
    text.value = ''
    fetchedAt.value = 0
  }

  return { text, loading, fetchSummary, invalidate }
})
