import en from '@shared/i18n/messages/en'
import ru from '@shared/i18n/messages/ru'
import { DEFAULT_LOCALE } from '@shared/i18n/locales'

const messages = { en, ru }

let currentLocale = DEFAULT_LOCALE

function getValue (source, path) {
  return path.split('.').reduce((value, key) => (value && value[key] !== undefined ? value[key] : undefined), source)
}

function interpolate (value, params = {}) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(/\{(\w+)\}/g, (match, key) => (params[key] !== undefined ? params[key] : match))
}

export function setMainLocale (locale) {
  currentLocale = locale || DEFAULT_LOCALE
}

export function getMainLocale () {
  return currentLocale
}

export function t (key, params = {}, locale = currentLocale) {
  const localized = getValue(messages[locale] || messages[DEFAULT_LOCALE], key)
  const fallback = localized !== undefined ? localized : getValue(messages[DEFAULT_LOCALE], key)

  if (fallback === undefined) {
    return key
  }

  return interpolate(fallback, params)
}

export function getFacts (locale = currentLocale) {
  return messages[locale]?.facts || messages[DEFAULT_LOCALE].facts
}
