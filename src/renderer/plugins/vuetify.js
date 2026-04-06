import '@mdi/font/css/materialdesignicons.css'
import en from 'vuetify/es5/locale/en'
import ru from 'vuetify/es5/locale/ru'

import Vue from 'vue'
import Vuetify from 'vuetify/lib'

import { DEFAULT_LOCALE } from '@shared/i18n/locales'

Vue.use(Vuetify)

const vuetify = new Vuetify({
  lang: {
    locales: { en, ru },
    current: DEFAULT_LOCALE
  },
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: '#fff',
        secondary: '#b32121'
      }
    }
  }
})

export function setVuetifyLocale (locale) {
  vuetify.framework.lang.current = locale || DEFAULT_LOCALE
}

export default vuetify
