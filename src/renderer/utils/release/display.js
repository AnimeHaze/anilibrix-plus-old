import get from 'lodash/get'
import { getLocale } from '@/renderer/i18n'

const normalizeText = value => {
  if (value === null || value === undefined) return null

  const text = `${value}`.trim()
  return text.length > 0 ? text : null
}

const pickText = (...values) => {
  for (const value of values) {
    const text = normalizeText(value)
    if (text) return text
  }

  return null
}

const normalizeList = value => {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean)
  }

  const text = normalizeText(value)
  return text ? [text] : []
}

const isRuLocale = locale => (locale || getLocale()) === 'ru'

export const resolveReleaseTitle = (release, locale = getLocale()) => {
  const names = get(release, 'names', {})

  return isRuLocale(locale)
    ? pickText(
      get(names, 'ru'),
      get(release, 'displayTitle'),
      get(names, 'original'),
      get(names, 'en')
    )
    : pickText(
      get(release, 'displayTitle'),
      get(names, 'en'),
      get(names, 'original'),
      get(names, 'ru')
    )
}

export const resolveReleaseSubtitle = (release, locale = getLocale()) => {
  const names = get(release, 'names', {})

  return isRuLocale(locale)
    ? pickText(
      get(names, 'original'),
      get(release, 'displaySubtitle'),
      get(names, 'en'),
      get(names, 'ru')
    )
    : pickText(
      get(release, 'displaySubtitle'),
      get(names, 'original'),
      get(names, 'en'),
      get(names, 'ru')
    )
}

export const resolveReleaseGenres = (release, locale = getLocale()) => {
  const rawGenres = normalizeList(get(release, 'genres'))
  const localizedGenres = normalizeList(get(release, 'genresLocalized'))

  const genres = isRuLocale(locale)
    ? (rawGenres.length > 0 ? rawGenres : localizedGenres)
    : (localizedGenres.length > 0 ? localizedGenres : rawGenres)

  return genres
}

export const resolveReleaseGenresText = (release, locale = getLocale()) =>
  resolveReleaseGenres(release, locale).join(' | ')

export const resolveReleaseDescription = (release, locale = getLocale()) => {
  return isRuLocale(locale)
    ? pickText(
      get(release, 'description'),
      get(release, 'displayDescription')
    )
    : pickText(
      get(release, 'displayDescription'),
      get(release, 'description')
    )
}

export const resolveReleaseStatus = (release, locale = getLocale()) => {
  return isRuLocale(locale)
    ? pickText(
      get(release, 'status'),
      get(release, 'statusLocalized')
    )
    : pickText(
      get(release, 'statusLocalized'),
      get(release, 'status')
    )
}

export const resolveReleaseType = (release, locale = getLocale()) => {
  return isRuLocale(locale)
    ? pickText(
      get(release, 'type'),
      get(release, 'typeLocalized')
    )
    : pickText(
      get(release, 'typeLocalized'),
      get(release, 'type')
    )
}

export const resolveEpisodeName = (episode, locale = getLocale()) => {
  return isRuLocale(locale)
    ? pickText(
      get(episode, 'name'),
      get(episode, 'nameLocalized'),
      get(episode, 'displayName')
    )
    : pickText(
      get(episode, 'nameLocalized'),
      get(episode, 'displayName'),
      get(episode, 'name')
    )
}

export const resolveEpisodeTitle = (episode, locale = getLocale()) => {
  const title = pickText(get(episode, 'title'))
  const name = resolveEpisodeName(episode, locale)
  const rutube = get(episode, 'sources', []).find(source => get(source, 'payload.playlist', '').includes('/rutube/'))
  const rutubeSuffix = rutube ? ' [RUTUBE] ' : ''

  return [title || '', rutubeSuffix, name ? ` — ${name}` : ''].join('').trim() || null
}
