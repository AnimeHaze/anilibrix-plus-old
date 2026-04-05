import Vue from 'vue'

// Import plugins
import router from '@router'
import store from '@store'

// Import vendor plugins
import vuetify from '@plugins/vuetify'

// Import plugins
import '@plugins/plyr'
import '@plugins/moment'
import '@plugins/lodash'
import '@plugins/vue-meta'
import '@plugins/vuelidate'
import '@plugins/vue-toasted'
import '@plugins/vue-electron'

// Import styles
import '@assets/scss/style.scss'

// Import entry component
import App from './App'
import axios from 'axios'
Vue.config.productionTip = false

/* eslint-disable no-new */
const app = new Vue({
  store,
  router,
  vuetify,
  template: '<App/>',
  components: { App }
})

// Mount app to html
app.$mount('#anilibrix')
