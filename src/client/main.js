import axios from 'axios';
import vueaxios from 'vue-axios';
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).use(vueaxios,axios).mount('#app')
