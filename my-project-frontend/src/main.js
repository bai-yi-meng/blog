import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from "axios";
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import 'element-plus/theme-chalk/dark/css-vars.css'

// 本地开发时指向本地后端，部署时可通过环境变量配置
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
axios.defaults.baseURL = isLocal ? 'http://localhost:8080' : ''
const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

app.mount('#app')
