import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { app } from 'electron'
import { catGirlFetch } from '@utils/fetch'

const LOCALIZATION_CACHE_FILE = 'release-localization-cache.json'
const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
const JIKAN_SEARCH_ENDPOINT = 'https://api.jikan.moe/v4/anime'
const GOOGLE_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single'
const STRONG_MATCH_THRESHOLD = 0.72
const MAX_EXTERNAL_RESULTS = 5
const PROVIDER_COOLDOWN_MS = 5 * 60 * 1000

function createEmptyCache () {
  return {
    releases: {},
    translations: {},
    jikanEpisodes: {}
  }
}

const ANILIST_QUERY = `
query ($search: String) {
  Page(perPage: 5) {
    media(search: $search, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      synonyms
      startDate {
        year
      }
      format
    }
  }
}
`

function stripHtml (value) {
  if (typeof value !== 'string') {
    return value || null
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || null
}

function normalizeWhitespace (value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.replace(/\s+/g, ' ').trim()
}

function normalizeTitle (value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[()[\]{}'"`.,!?/\\|:;~@#$%^&*_+=-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeTitle (value) {
  const normalized = normalizeTitle(value)
  return normalized ? normalized.split(' ').filter(Boolean) : []
}

function bigrams (value) {
  const normalized = normalizeTitle(value).replace(/\s/g, '')

  if (normalized.length < 2) {
    return normalized ? [normalized] : []
  }

  const pairs = []
  for (let index = 0; index < normalized.length - 1; index++) {
    pairs.push(normalized.slice(index, index + 2))
  }

  return pairs
}

function diceCoefficient (left, right) {
  const leftPairs = bigrams(left)
  const rightPairs = bigrams(right)

  if (!leftPairs.length || !rightPairs.length) {
    return 0
  }

  const rightCounts = new Map()
  rightPairs.forEach(pair => {
    rightCounts.set(pair, (rightCounts.get(pair) || 0) + 1)
  })

  let matches = 0
  leftPairs.forEach(pair => {
    const count = rightCounts.get(pair) || 0
    if (count > 0) {
      matches += 1
      rightCounts.set(pair, count - 1)
    }
  })

  return (2 * matches) / (leftPairs.length + rightPairs.length)
}

function tokenOverlap (left, right) {
  const leftTokens = new Set(tokenizeTitle(left))
  const rightTokens = new Set(tokenizeTitle(right))

  if (!leftTokens.size || !rightTokens.size) {
    return 0
  }

  let matches = 0
  leftTokens.forEach(token => {
    if (rightTokens.has(token)) {
      matches += 1
    }
  })

  return matches / Math.max(leftTokens.size, rightTokens.size)
}

function bestTitleSimilarity (inputs, candidates) {
  let bestScore = 0

  inputs.filter(Boolean).forEach(input => {
    candidates.filter(Boolean).forEach(candidate => {
      const normalizedInput = normalizeTitle(input)
      const normalizedCandidate = normalizeTitle(candidate)

      if (!normalizedInput || !normalizedCandidate) {
        return
      }

      if (normalizedInput === normalizedCandidate) {
        bestScore = Math.max(bestScore, 1)
        return
      }

      if (
        normalizedInput.includes(normalizedCandidate) ||
        normalizedCandidate.includes(normalizedInput)
      ) {
        bestScore = Math.max(bestScore, 0.92)
      }

      bestScore = Math.max(
        bestScore,
        diceCoefficient(input, candidate),
        tokenOverlap(input, candidate)
      )
    })
  })

  return bestScore
}

function hasCyrillic (value) {
  return /[А-Яа-яЁё]/.test(value || '')
}

function uniqueStrings (values) {
  return [...new Set(
    (values || [])
      .filter(value => typeof value === 'string')
      .map(value => normalizeWhitespace(value))
      .filter(Boolean)
  )]
}

function cleanSynopsis (value) {
  return stripHtml(value)?.replace(/\[Written by MAL Rewrite\]/gi, '').trim() || null
}

function scoreYear (releaseYear, candidateYear) {
  if (!releaseYear || !candidateYear) {
    return 0
  }

  return Number(releaseYear) === Number(candidateYear) ? 0.05 : -0.08
}

function buildTranslationKey (text, from, to) {
  return `${from}:${to}:${text}`
}

export class ReleaseLocalizationService {
  constructor () {
    this.filePath = path.join(app.getPath('userData'), LOCALIZATION_CACHE_FILE)
    this.cache = createEmptyCache()
    this.loaded = false
    this.savePromise = Promise.resolve()
    this.inflightReleaseRequests = new Map()
    this.inflightTranslationRequests = new Map()
    this.providerCooldowns = {
      anilist: 0,
      jikan: 0,
      translate: 0
    }
  }

  async ensureLoaded () {
    if (this.loaded) {
      return
    }

    try {
      const raw = await fs.readFile(this.filePath, 'utf8')
      const parsed = JSON.parse(raw)
      this.cache = {
        releases: parsed.releases || {},
        translations: parsed.translations || {},
        jikanEpisodes: parsed.jikanEpisodes || {}
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load localization cache', error)
      }
      this.cache = createEmptyCache()
    }

    this.loaded = true
  }

  persist () {
    const payload = JSON.stringify(this.cache)
    this.savePromise = this.savePromise
      .catch(() => {})
      .then(() => fs.writeFile(this.filePath, payload))
      .catch(error => {
        console.error('Failed to persist localization cache', error)
      })

    return this.savePromise
  }

  buildFingerprint (release, episodes = []) {
    const hash = crypto.createHash('sha1')
    hash.update(JSON.stringify({
      title: release?.title || null,
      originalName: release?.originalName || null,
      year: release?.year || null,
      episodeNames: (episodes || []).map(episode => ({
        ordinal: episode.ordinal,
        name: episode.name || null
      }))
    }))
    return hash.digest('hex')
  }

  getCachedReleaseLocalization (release, episodes = []) {
    const cached = this.cache.releases[String(release.id)]
    const fingerprint = this.buildFingerprint(release, episodes)

    if (cached && cached.fingerprint === fingerprint) {
      return cached.localized
    }

    return null
  }

  applyCachedMetadataToRelease (release, episodes = []) {
    const localized = this.getCachedReleaseLocalization(release, episodes)
    if (!localized) {
      return null
    }

    release.localizedTitle = localized.names?.en || null
    release.localizedDescription = localized.descriptionLocalized || null
    release.searchAliases = localized.searchAliases || []

    return localized
  }

  async localizeRelease (release, episodes = [], locale = 'en', { fetchLive = true } = {}) {
    if (!release || locale !== 'en') {
      return null
    }

    await this.ensureLoaded()

    const cacheKey = String(release.id)
    const cached = this.getCachedReleaseLocalization(release, episodes)
    if (cached) {
      this.applyCachedMetadataToRelease(release, episodes)
      return cached
    }

    if (!fetchLive) {
      return null
    }

    if (this.inflightReleaseRequests.has(cacheKey)) {
      return this.inflightReleaseRequests.get(cacheKey)
    }

    const request = this.resolveLocalization(release, episodes)
      .finally(() => {
        this.inflightReleaseRequests.delete(cacheKey)
      })

    this.inflightReleaseRequests.set(cacheKey, request)
    return request
  }

  async resolveLocalization (release, episodes = []) {
    const fingerprint = this.buildFingerprint(release, episodes)
    const external = await this.matchReleaseMetadata(release)
    const episodeNamesByOrdinal = await this.resolveEpisodeTitles(external, episodes)
    const localized = await this.buildLocalizedPayload(release, episodes, external, episodeNamesByOrdinal)

    this.cache.releases[String(release.id)] = {
      fingerprint,
      localized
    }

    this.applyCachedMetadataToRelease(release, episodes)
    await this.persist()

    return localized
  }

  async matchReleaseMetadata (release) {
    const queries = uniqueStrings([release?.originalName, release?.title])

    for (const query of queries) {
      const aniListMatch = await this.findAniListMatch(query, release)
      if (aniListMatch) {
        return aniListMatch
      }
    }

    for (const query of queries) {
      const jikanMatch = await this.findJikanMatch(query, release)
      if (jikanMatch) {
        return jikanMatch
      }
    }

    return null
  }

  async findAniListMatch (query, release) {
    if (this.isProviderCoolingDown('anilist')) {
      return null
    }

    const body = JSON.stringify({
      query: ANILIST_QUERY,
      variables: { search: query }
    })

    try {
      const response = await this.fetchJson(ANILIST_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body
      })

      const media = response?.data?.Page?.media || []
      const best = this.pickBestMatch(
        release,
        media.map(item => ({
          provider: 'anilist',
          externalId: item.id,
          titleEn: item.title?.english || item.title?.romaji || null,
          titles: uniqueStrings([
            item.title?.english,
            item.title?.romaji,
            item.title?.native,
            ...(item.synonyms || [])
          ]),
          synopsis: cleanSynopsis(item.description),
          year: item.startDate?.year || null,
          format: item.format || null
        }))
      )

      return best
    } catch (error) {
      this.maybeCooldownProvider('anilist', error)
      console.error('AniList lookup failed', query, error.message)
      return null
    }
  }

  async findJikanMatch (query, release) {
    if (this.isProviderCoolingDown('jikan')) {
      return null
    }

    try {
      const url = `${JIKAN_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&limit=${MAX_EXTERNAL_RESULTS}`
      const response = await this.fetchJson(url)
      const data = response?.data || []

      const best = this.pickBestMatch(
        release,
        data.map(item => ({
          provider: 'jikan',
          externalId: item.mal_id,
          titleEn: item.title_english || item.title || null,
          titles: uniqueStrings([
            item.title_english,
            item.title,
            item.title_japanese,
            ...(item.title_synonyms || []),
            ...(item.titles || []).map(title => title.title)
          ]),
          synopsis: cleanSynopsis(item.synopsis),
          year: item.year || item.aired?.prop?.from?.year || null,
          format: item.type || null,
          genres: uniqueStrings([
            ...(item.genres || []).map(genre => genre.name),
            ...(item.themes || []).map(theme => theme.name),
            ...(item.demographics || []).map(demographic => demographic.name)
          ]),
          status: item.status || null
        }))
      )

      return best
    } catch (error) {
      this.maybeCooldownProvider('jikan', error)
      console.error('Jikan lookup failed', query, error.message)
      return null
    }
  }

  pickBestMatch (release, candidates = []) {
    const inputs = uniqueStrings([release?.originalName, release?.title])

    const ranked = candidates
      .map(candidate => ({
        candidate,
        score: bestTitleSimilarity(inputs, candidate.titles) + scoreYear(release?.year, candidate.year)
      }))
      .sort((left, right) => right.score - left.score)

    const best = ranked[0]
    if (!best || best.score < STRONG_MATCH_THRESHOLD) {
      return null
    }

    return {
      ...best.candidate,
      matchScore: best.score
    }
  }

  async resolveEpisodeTitles (externalMatch, episodes = []) {
    if (!externalMatch || externalMatch.provider !== 'jikan' || !externalMatch.externalId) {
      return {}
    }

    if (this.isProviderCoolingDown('jikan')) {
      return {}
    }

    const cacheKey = String(externalMatch.externalId)
    if (this.cache.jikanEpisodes[cacheKey]) {
      return this.cache.jikanEpisodes[cacheKey]
    }

    try {
      const titles = {}
      let page = 1
      let hasNextPage = true

      while (hasNextPage) {
        const url = `https://api.jikan.moe/v4/anime/${externalMatch.externalId}/episodes?page=${page}`
        const response = await this.fetchJson(url)
        const items = response?.data || []

        items.forEach(item => {
          if (item?.mal_id) {
            titles[item.mal_id] = normalizeWhitespace(item.title)
          }
        })

        hasNextPage = Boolean(response?.pagination?.has_next_page)
        page += 1

        if (page > 20) {
          break
        }
      }

      this.cache.jikanEpisodes[cacheKey] = titles
      await this.persist()

      return titles
    } catch (error) {
      this.maybeCooldownProvider('jikan', error)
      console.error('Failed to fetch Jikan episode titles', externalMatch.externalId, error.message)
      return {}
    }
  }

  async buildLocalizedPayload (release, episodes = [], externalMatch, episodeNamesByOrdinal = {}) {
    const translatedTitle = await this.translateMaybe(release?.title)
    const translatedDescription = await this.translateMaybe(stripHtml(release?.description))
    const translatedGenres = await Promise.all((release?.genres || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .map(value => this.translateMaybe(value)))
    const translatedStatus = await this.translateMaybe(release?.status)
    const translatedType = await this.translateMaybe(release?.type)

    const displayTitle = externalMatch?.titleEn || translatedTitle || release?.originalName || release?.title || null
    const displaySubtitle = release?.originalName || release?.title || displayTitle
    const displayDescription = externalMatch?.synopsis || translatedDescription || stripHtml(release?.description) || null
    const genresLocalized = externalMatch?.genres?.length
      ? externalMatch.genres
      : uniqueStrings(translatedGenres.length ? translatedGenres : (release?.genres || '').split(','))
    const statusLocalized = externalMatch?.status || translatedStatus || release?.status || null
    const typeLocalized = externalMatch?.format || translatedType || release?.type || null
    const localizedEpisodeNames = {}

    for (const episode of episodes || []) {
      const ordinal = episode.ordinal
      localizedEpisodeNames[ordinal] = episodeNamesByOrdinal[ordinal] ||
        await this.translateMaybe(episode.name) ||
        episode.name ||
        null
    }

    const searchAliases = uniqueStrings([
      displayTitle,
      displaySubtitle,
      externalMatch?.titleEn,
      ...(externalMatch?.titles || []),
      release?.title,
      release?.originalName
    ])

    return {
      names: {
        en: externalMatch?.titleEn || translatedTitle || null
      },
      displayTitle,
      displaySubtitle,
      descriptionLocalized: displayDescription,
      displayDescription,
      genresLocalized,
      statusLocalized,
      typeLocalized,
      episodeNamesByOrdinal: localizedEpisodeNames,
      searchAliases
    }
  }

  async translateMaybe (text, from = 'ru', to = 'en') {
    if (typeof text !== 'string') {
      return null
    }

    const cleaned = normalizeWhitespace(text)
    if (!cleaned || !hasCyrillic(cleaned)) {
      return cleaned || null
    }

    return this.translateText(cleaned, from, to)
  }

  async translateText (text, from = 'ru', to = 'en') {
    const cacheKey = buildTranslationKey(text, from, to)

    await this.ensureLoaded()

    if (Object.prototype.hasOwnProperty.call(this.cache.translations, cacheKey)) {
      return this.cache.translations[cacheKey]
    }

    if (this.inflightTranslationRequests.has(cacheKey)) {
      return this.inflightTranslationRequests.get(cacheKey)
    }

    const request = this.fetchTranslation(text, from, to)
      .then(async translation => {
        this.cache.translations[cacheKey] = translation
        await this.persist()
        return translation
      })
      .finally(() => {
        this.inflightTranslationRequests.delete(cacheKey)
      })

    this.inflightTranslationRequests.set(cacheKey, request)
    return request
  }

  async fetchTranslation (text, from, to) {
    if (this.isProviderCoolingDown('translate')) {
      return text
    }

    try {
      const url = `${GOOGLE_TRANSLATE_ENDPOINT}?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`
      const response = await this.fetchJson(url)
      const chunks = Array.isArray(response?.[0]) ? response[0] : []
      const translated = chunks
        .map(chunk => Array.isArray(chunk) ? chunk[0] : null)
        .filter(Boolean)
        .join('')
        .trim()

      return translated || text
    } catch (error) {
      this.maybeCooldownProvider('translate', error)
      console.error('Translation failed', text, error.message)
      return text
    }
  }

  async searchCachedTitles (query, releases = []) {
    const normalizedQuery = normalizeTitle(query)
    if (!normalizedQuery) {
      return []
    }

    await this.ensureLoaded()

    return releases
      .map(release => {
        const cached = this.cache.releases[String(release.id)]?.localized
        const aliases = cached?.searchAliases || []
        const score = bestTitleSimilarity([normalizedQuery], aliases)

        return { release, score }
      })
      .filter(item => item.score >= 0.72)
      .sort((left, right) => right.score - left.score)
      .map(item => item.release)
  }

  async searchExternalQuery (query, releases = []) {
    if (this.isProviderCoolingDown('anilist') && this.isProviderCoolingDown('jikan')) {
      return []
    }

    const results = []
    const externalCandidates = []
    const pseudoRelease = { title: query, originalName: query }

    const aniListMatch = await this.findAniListMatch(query, pseudoRelease)
    if (aniListMatch) {
      externalCandidates.push(aniListMatch)
    }

    const jikanMatch = await this.findJikanMatch(query, pseudoRelease)
    if (jikanMatch) {
      externalCandidates.push(jikanMatch)
    }

    externalCandidates.forEach(candidate => {
      const ranked = releases
        .map(release => ({
          release,
          score: bestTitleSimilarity(
            candidate.titles || [candidate.titleEn],
            uniqueStrings([release.title, release.originalName, ...(release.searchAliases || [])])
          ) + scoreYear(candidate.year, release.year)
        }))
        .sort((left, right) => right.score - left.score)

      const best = ranked[0]
      if (best && best.score >= STRONG_MATCH_THRESHOLD) {
        results.push(best.release)
      }
    })

    return [...new Set(results)]
  }

  isProviderCoolingDown (provider) {
    return Date.now() < (this.providerCooldowns[provider] || 0)
  }

  maybeCooldownProvider (provider, error) {
    if (error?.status !== 429) {
      return
    }

    const retryAfterMs = Number.isFinite(error.retryAfterMs) && error.retryAfterMs > 0
      ? error.retryAfterMs
      : PROVIDER_COOLDOWN_MS

    this.providerCooldowns[provider] = Date.now() + retryAfterMs
  }

  async fetchJson (url, options = {}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await catGirlFetch(url, {
        ...options,
        signal: controller.signal
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        const error = new Error(`${response.status} ${message}`.trim())
        error.status = response.status

        const retryAfterHeader = response.headers?.get?.('retry-after')
        const retryAfterSeconds = Number.parseInt(retryAfterHeader, 10)
        if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
          error.retryAfterMs = retryAfterSeconds * 1000
        }

        throw error
      }

      return await response.json()
    } finally {
      clearTimeout(timeout)
    }
  }
}
