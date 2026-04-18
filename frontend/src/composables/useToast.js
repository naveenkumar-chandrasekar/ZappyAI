import { reactive } from 'vue'

const toasts = reactive([])
let _id = 0

export function useToast() {
  function show(message, type = 'error', duration = 4000) {
    const id = ++_id
    toasts.push({ id, message, type })
    setTimeout(() => {
      const idx = toasts.findIndex(t => t.id === id)
      if (idx !== -1) toasts.splice(idx, 1)
    }, duration)
  }

  function error(message) { show(message, 'error') }
  function success(message) { show(message, 'success') }

  return { toasts, show, error, success }
}
