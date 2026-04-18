import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import { useToast } from './composables/useToast.js'

const app = createApp(App)
app.use(createPinia())
app.use(router)

app.config.errorHandler = (err) => {
  console.error('[Vue]', err)
  useToast().error('Something went wrong. Please try again.')
}

app.mount('#app')
