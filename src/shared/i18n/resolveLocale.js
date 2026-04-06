import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales'

export function normalizeLocale (input) {
  if (typeof input !== 'string' || input.trim() === '') {
    return DEFAULT_LOCALE
  }

  const normalized = input.trim().toLowerCase().replace(/_/g, '-')

  if (normalized.startsWith('ru')) {
    return 'ru'
  }

  return SUPPORTED_LOCALES.includes(normalized) ? normalized : DEFAULT_LOCALE
}

export function resolveAppLocale ({ storedLocale, systemLocale, rendererLocale } = {}) {
  if (storedLocale) {
    return normalizeLocale(storedLocale)
  }

  if (systemLocale) {
    return normalizeLocale(systemLocale)
  }

  if (rendererLocale) {
    return normalizeLocale(rendererLocale)
  }

  return DEFAULT_LOCALE
}
