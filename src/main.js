import { createApp } from 'vue'
import store from './store'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Antd from 'ant-design-vue';

import 'ant-design-vue/dist/antd.css';
import App from './App.vue'

import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */

import { faPause } from '@fortawesome/free-solid-svg-icons'
import { faPlay } from '@fortawesome/free-solid-svg-icons'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { faMinus } from '@fortawesome/free-solid-svg-icons'
import { faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons'
// import { faSpinner} from '@fortawesome/free-solid-svg-icons'


library.add(faPause, faPlay, faMagnifyingGlass, faPlus, faMinus)


const app = createApp(App)

app.use(store).use(ElementPlus)
.use(Antd)
.component('font-awesome-icon', FontAwesomeIcon).mount('#app')
