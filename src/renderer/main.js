import Vue from 'vue'

import router from '@router'
import store from '@store'

import vuetify, { setVuetifyLocale } from '@plugins/vuetify'
import { setMomentLocale } from '@plugins/moment'

import '@plugins/plyr'
import '@plugins/moment'
import '@plugins/lodash'
import '@plugins/vue-meta'
import '@plugins/vuelidate'
import '@plugins/vue-toasted'
import '@plugins/vue-electron'

import '@assets/scss/style.scss'

import App from './App'

import { installI18n, setLocale } from './i18n'
import { resolveAppLocale } from '@shared/i18n/resolveLocale'
import { invokeGetSystemLocale, invokeSetAppLocale } from '@main/handlers/app/app-handlers'

Vue.config.productionTip = false

installI18n()

async function bootstrapLocale () {
  const storedLocale = store.state.app.settings.system.language
  const rendererLocale = navigator.language || (navigator.languages && navigator.languages[0])

  let systemLocale = null

  try {
    systemLocale = await invokeGetSystemLocale()
  } catch (error) {
    console.error('Failed to resolve system locale', error)
  }

  const locale = resolveAppLocale({
    storedLocale,
    systemLocale,
    rendererLocale
  })

  setLocale(locale)
  setVuetifyLocale(locale)
  setMomentLocale(locale)

  try {
    await invokeSetAppLocale(locale)
  } catch (error) {
    console.error('Failed to sync app locale', error)
  }
}

async function startApp () {
  await bootstrapLocale()

  const app = new Vue({
    store,
    router,
    vuetify,
    template: '<App/>',
    components: { App }
  })

  app.$mount('#anilibrix')
}

startApp()
