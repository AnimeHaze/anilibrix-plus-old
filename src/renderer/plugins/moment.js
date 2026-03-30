import Vue from 'vue'
import moment from 'moment'

import 'moment/locale/ru'

import { DEFAULT_LOCALE } from '@shared/i18n/locales'

export function setMomentLocale (locale) {
  moment.locale(locale || DEFAULT_LOCALE)
}

setMomentLocale(DEFAULT_LOCALE)

Vue.prototype.$moment = moment
