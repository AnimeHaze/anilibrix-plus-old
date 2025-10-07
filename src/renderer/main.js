import Vue from 'vue'

// Import plugins
import router from '@router'
import store from '@store'

// Import vendor plugins
import yandex from '@plugins/vue-yandex-metrika'
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
import axiosRetry from 'axios-retry';
axiosRetry(axios, {
  retryDelay: 1500,
  retries: 10,
  retryCondition: function (response) {
    if (response.status === 404) return false
    if (response.status === 401) return false

    return true
    // return axiosRetry.isNetworkOrIdempotentRequestError(response)
  }
})
Vue.config.productionTip = false

// Initialize yandex metrika
Vue.use(yandex, {
  id: process.env.YANDEX_TRACKING_ID,
  store,
  router
})

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
