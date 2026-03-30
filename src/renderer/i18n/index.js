import Vue from 'vue'

import en from '@shared/i18n/messages/en'
import ru from '@shared/i18n/messages/ru'
import { DEFAULT_LOCALE } from '@shared/i18n/locales'

const messages = { en, ru }
const state = Vue.observable({
  locale: DEFAULT_LOCALE
})

function getValue (source, path) {
  return path.split('.').reduce((value, key) => (value && value[key] !== undefined ? value[key] : undefined), source)
}

function interpolate (value, params = {}) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(/\{(\w+)\}/g, (match, key) => (params[key] !== undefined ? params[key] : match))
}

export function translate (key, params = {}, locale = state.locale) {
  const localized = getValue(messages[locale] || messages[DEFAULT_LOCALE], key)
  const fallback = localized !== undefined ? localized : getValue(messages[DEFAULT_LOCALE], key)

  if (fallback === undefined) {
    return key
  }

  return interpolate(fallback, params)
}

export function setLocale (locale) {
  state.locale = locale || DEFAULT_LOCALE
}

export function getLocale () {
  return state.locale
}

export function installI18n () {
  Vue.prototype.$t = function (key, params = {}) {
    return translate(key, params, state.locale)
  }

  Object.defineProperty(Vue.prototype, '$locale', {
    get () {
      return state.locale
    }
  })

  Vue.prototype.$setLocale = setLocale
}

export const i18nState = state
