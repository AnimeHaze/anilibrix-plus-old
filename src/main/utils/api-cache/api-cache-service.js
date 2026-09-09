import fs from 'fs/promises'
import { createWriteStream, existsSync } from 'fs'

import path from 'path'
import Fuse from 'fuse.js';
import { ipcMain } from 'electron';
import AdmZip from 'adm-zip';
import { Mutex } from 'async-mutex';
import crypto from 'crypto';
import { catGirlFetch } from '@utils/fetch';
import { getMainLocale } from '@main/utils/i18n';
import { ReleaseLocalizationService } from './release-localization-service';

const SEARCH_RESULT_SCORE_THRESHOLD = 0.42
const NOTIFICATIONS_FILE = 'notifications.json'
const NOTIFICATIONS_STATE_FILE = 'notifications_state.json'
const NOTIFICATIONS_MAX_AGE_DAYS = 7
const NOTIFICATIONS_MAX_COUNT = 50

export class APICacheService {
  constructor(cachePath) {
    this.cachePath = cachePath;
    console.log('API Cache Path:', this.cachePath);
    this.isInitialized = false;
    this.cache = new Map();
    this.search = null
    this.mutex = new Mutex()

    this.lastFailedFavorites = 0;
    this.lastFailedTimeStamp = 0;
    this.lastReleaseTimeStamp = 0;
    this.initializationPromise = null;
    this.initializationResolve = null;
    this.initializationReject = null;
    this.localizationService = new ReleaseLocalizationService();
    this.createInitializationPromise();
  }

  createInitializationPromise() {
    this.initializationPromise = new Promise((resolve, reject) => {
      this.initializationResolve = resolve;
      this.initializationReject = reject;
    });
  }

  async setCacheKey (key, value) {
    const metadataPath = path.join(this.cachePath, `${key}.json`);
    this.cache.set(key, value);
    await fs.writeFile(metadataPath, JSON.stringify(value));
  }

  async getCacheKey (key) {
    if (this.cache.has(key)) return this.cache.get(key)

    const metadataPath = path.join(this.cachePath, `${key}.json`);
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const value = JSON.parse(metadataContent);

    this.cache.set(key, value)

    return value
  }

  async loadCacheMetadata() {
    const activeCachePrefix = await fs.readFile(path.join(this.cachePath, 'active.cache'), 'utf8')
    const metadataPath = path.join(this.cachePath, activeCachePrefix + '_' + 'metadata');
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(metadataContent);
  }

  async loadJsonFiles(filePrefix, count, withoutIndex) {
    const filesData = await Promise.all(
      Array.from({ length: count }, async (_, index) => {
        const filePath = path.join(this.cachePath, `${filePrefix}${withoutIndex ? '' : index}.json`);
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
      })
    );

    return Object.freeze(filesData.flat());
  }

  async downloadFile(url, filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });

        const response = await catGirlFetch(url, { signal: controller.signal })

        if (!response.ok) {
          const res = await response.text()
          throw new Error(`Error downloading file: ${response.status} ${res}`);
        }

        const writeStream = createWriteStream(filePath);

        if (response.body) {
          for await (const chunk of response.body) {
            writeStream.write(chunk);
          }
          writeStream.end();
        }

        writeStream.on('finish', () => {
          console.log(`File downloaded successfully: ${path.basename(filePath)}`);
          resolve();
        });

        writeStream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async downloadCache() {
    try {
      const activeCachePrefix = await fs.readFile(path.join(this.cachePath, 'active.cache'), 'utf8').catch((e) => {
        if (e.code === 'ENOENT') {
          console.log('Active cache not found');
          return null;
        }

        throw e;
      })
      const uuid = crypto.randomUUID();

      const pathToHashes = path.join(this.cachePath, activeCachePrefix + '_' + 'hashes.json')
      const pathToHashesTmp = path.join(this.cachePath, 'hashes.json')

      const hashes = await fs.readFile(pathToHashes, 'utf8').catch((e) => {
        if (e.code === 'ENOENT') {
          return null;
        }

        throw e;
      })

      let oldHashes

      if (hashes) {
        console.log('Hashes file found, loading')

        try {
          oldHashes = JSON.parse(hashes)
        } catch (e) {
          console.log('can\'t parse hashes file', e)
        }
      }

      let newHashesFileContent

      try {
        console.log('Downloading hashes file from ', global.cacheHashesURL)
        await this.downloadFile(global.cacheHashesURL, pathToHashesTmp)

        newHashesFileContent = await fs.readFile(pathToHashesTmp, 'utf8')
        const newHashes = JSON.parse(newHashesFileContent)

        if (oldHashes) {
          if (oldHashes?.cache_files && newHashes?.cache_files) {
            const oldFiles = Object.keys(oldHashes.cache_files);
            const newFiles = Object.keys(newHashes.cache_files);

            const hasNewFiles = newFiles.filter(f => !oldFiles.includes(f));
            const hasRemovedFiles = oldFiles.filter(f => !newFiles.includes(f));
            const hasUpdatedFiles = newFiles.filter(f =>
              oldFiles.includes(f) &&
              oldHashes.cache_files[f].toLowerCase() !== newHashes.cache_files[f].toLowerCase()
            );

            if (!hasNewFiles.length && !hasRemovedFiles.length && !hasUpdatedFiles.length) {
              this.lastFailedTimestamp = 0
              console.log('No changes detected in cache, skipping download');
              return;
            }

            if (hasNewFiles.length) console.log('New files:', hasNewFiles);
            if (hasRemovedFiles.length) console.log('Removed files:', hasRemovedFiles);
            if (hasUpdatedFiles.length) console.log('Updated files:', hasUpdatedFiles);

            console.log('Changes detected, proceeding with download');
          }
        } else {
          console.log('No old hashes found, nothing to diff, downloading')
        }
      } catch (e) {
        console.log('can\'t download hashes file', e)
      }

      const pathToZip = path.join(this.cachePath, 'main.zip')
      await this.downloadFile(global.cacheURL, pathToZip)

      const zip = new AdmZip(pathToZip);
      const entries = zip.getEntries();

      const cacheFiles = entries.filter(entry =>
        entry.entryName.includes('cache/') && !entry.isDirectory
      );

      const [prefix] = cacheFiles[0].entryName.split('/');

      for (const entry of cacheFiles) {
        const relativePath = entry.entryName.replaceAll(prefix + '/cache/', '');
        const outputPath = path.join(this.cachePath, relativePath);
        const dir = path.dirname(outputPath);

        if (!existsSync(dir)) {
          await fs.mkdir(dir, { recursive: true });
        }

        const newOutputPath = path.join(dir, `${uuid}_${path.basename(outputPath)}`);

        await fs.writeFile(newOutputPath, entry.getData());
      }

      if (newHashesFileContent) {
        await fs.writeFile(path.join(this.cachePath, `${uuid}_hashes.json`), newHashesFileContent)
      }

      await fs.unlink(pathToZip).catch(console.error);
      await fs.writeFile(path.join(this.cachePath, 'active.cache'), uuid);

      if (activeCachePrefix !== null) {
        const files = await fs.readdir(this.cachePath)
        await Promise.all(
          files
            .filter(file => !file.startsWith(uuid) && !['active.cache', 'user.json', 'favorites.json', 'notifications.json', 'notifications_state.json'].includes(file))
            .map(file => fs.unlink(path.join(this.cachePath, file)).catch(console.error))
        )
      }
      this.lastFailedTimestamp = 0
      console.log('Cache downloaded successfully and old cache deleted');
    } catch (e) {
      this.lastFailedTimestamp = Date.now();

      console.error('Cache download failed', e)
      console.log('Fallback to last cache...')
    }
  }

  async processCache() {
    const activeCachePrefix = await fs.readFile(path.join(this.cachePath, 'active.cache'), 'utf8')
    const { countEpisodes, countReleases, lastReleaseTimeStamp } = await this.loadCacheMetadata();
    await this.localizationService.ensureLoaded()
    this.lastReleaseTimeStamp = lastReleaseTimeStamp * 1000

    const [releasesData, episodesData, franchisesData, torrentsData] = await Promise.all([
      this.loadJsonFiles(activeCachePrefix + '_' + 'releases', countReleases),
      this.loadJsonFiles(activeCachePrefix + '_' + 'episodes', countEpisodes),
      this.loadJsonFiles(activeCachePrefix + '_' + 'releaseseries', 1, true),
      this.loadJsonFiles(activeCachePrefix + '_' + 'torrents', 1, true)
    ]);

    this.torrentsRaw = new Map();
    this.torrents = new Map();

    for (const torrent of torrentsData) {
      if (!this.torrents.has(torrent.releaseId)) {
        this.torrents.set(torrent.releaseId, []);
      }

      const torrentNew = {
        id: torrent.id,
        hash: torrent.hash,
        leechers: 0,
        seeders: torrent.seeders,
        completed: 9999,
        quality: `${torrent.type.value} ${torrent.quality.value} ${torrent.codec.value}`,
        series: torrent.description,
        size: torrent.size,
        url: '/public/torrent/download.php?id=' + torrent.id,
        magnet: torrent.magnet,
        ctime: torrent.time
      }

      this.torrentsRaw.set(torrent.id, torrentNew);
      this.torrents.get(torrent.releaseId).push(torrentNew);
    }

    const episodesByReleaseId = new Map(episodesData.map(episode => [episode.releaseId, episode.items || []]))

    this.years = new Set();
    this.genres = new Set();
    this.releases = new Map();
    releasesData.forEach(release => {
      release.year && this.years.add(release.year.toString());
      if (release.genres) release.genres.split(',').forEach(v => v && this.genres.add(v.trim()))
      this.localizationService.applyCachedMetadataToRelease(
        release,
        episodesByReleaseId.get(release.id) || []
      );
      return this.releases.set(release.id, release)
    });

    this.years = [...this.years].sort((a, b) => b - a);
    this.genres = [...this.genres].sort();

    this.episodes = episodesData;
    this.buildEpisodesIndex();
    this.buildSortedCache();
    this.buildFranchisesCache(franchisesData);
    this.buildSearchCache();
    await this.diffAndUpdateNotifications()
  }

  async initialize() {
    if (this.isInitialized) return 'already_initialized';

    console.log('Initializing API cache...');

    try {
      await fs.mkdir(this.cachePath, { recursive: true });

      await this.downloadCache();
      await this.processCache();

      this.isInitialized = true;
      console.log('API cache initialized successfully');

      this.initializationResolve();

      ipcMain.handle('getTorrent', (event, torrentId) => {
        return this.torrentsRaw.get(torrentId);
      });
    } catch (error) {
      console.error('Failed to initialize API cache:', error);
      this.initializationReject(error);
      this.createInitializationPromise();
      throw error;
    }
  }

  buildSearchCache() {
    const releases = Array.from(this.releases.values())
    const fusejs = new Fuse(releases, {
      includeScore: true,
      ignoreLocation: true,
      threshold: SEARCH_RESULT_SCORE_THRESHOLD,
      keys: [
        { name: 'searchAliases', weight: 0.5 },
        { name: 'localizedTitle', weight: 0.22 },
        { name: 'originalName', weight: 0.16 },
        { name: 'title', weight: 0.12 }
      ]
    })
    this.search = fusejs
  }

  buildEpisodesIndex() {
    this.episodesByReleaseId = new Map();
    this.episodes.forEach(episode => {
      this.episodesByReleaseId.set(episode.releaseId, episode.items);
    });
  }

  buildSortedCache() {
    this.sortedEpisodesByFreshness = this.episodes
      .map((episode, index) => ({
        index,
        releaseId: episode.releaseId,
        updatedAt: Math.max(...episode.items.map(x => new Date(x.updatedAt).getTime()))
      }))
      .sort((a, b) => a.updatedAt - b.updatedAt); // ASC order
  }

  buildFranchisesCache(franchisesData) {
    this.franchises = franchisesData;
    this.franchiseByReleaseId = new Map();

    franchisesData.forEach(franchise => {
      if (franchise.releasesIds?.length) {
        franchise.releasesIds.forEach(releaseId => {
          this.franchiseByReleaseId.set(
            releaseId,
            franchise.releasesIds.map(releaseId => {
              const release = this.releases.get(releaseId);

              if (!release) {
                console.log('Franchise release not found', releaseId);
                return null
              }

              return {
                id: release.id,
                names: {
                  ru: release.title,
                  original: release.originalName,
                  en: release.localizedTitle || null
                },
                poster: release.poster,
                type: release.type + (release.series && release.series !== '(0)' ? ` (${release.series.replace(/[\(\)]/g, '')} эп.)` : ''),
                status: release.status.replace('Сейчас в озвучке', 'В работе').replace('Озвучка завершена', 'Завершен')
              }
            }).filter(x => x !== null)
          )
        })
      }
    })
  }

  async getSortedReleases() {
    return this.sortedEpisodesByFreshness
      .map(episode => this.releases.get(episode.releaseId))
      .filter(Boolean)
      .reverse();
  }

  async searchByQuery (query) {
    return await this.mutex.runExclusive(async () => {
      const localResults = this.search?.search(query)
        .filter(item => (item.score ?? 1) >= SEARCH_RESULT_SCORE_THRESHOLD)
        .sort((a, b) => a.score - b.score)
        .map(item => item.item) || []

      if (getMainLocale() !== 'en') {
        return localResults
      }

      const releases = Array.from(this.releases.values())
      const cachedResults = await this.localizationService.searchCachedTitles(query, releases)
      const mergedLocalResults = [...new Map(
        [...localResults, ...cachedResults].map(item => [item.id, item])
      ).values()]

      if (mergedLocalResults.length >= 5) {
        return mergedLocalResults
      }

      const externalResults = await this.localizationService.searchExternalQuery(query, releases)

      return [...new Map(
        [...externalResults, ...mergedLocalResults].map(item => [item.id, item])
      ).values()]
    })
  }

  async localizeRelease (release, episodes = [], locale = getMainLocale(), options = {}) {
    const localized = await this.localizationService.localizeRelease(release, episodes, locale, options)

    if (localized) {
      this.localizationService.applyCachedMetadataToRelease(release, episodes)
    }

    return localized
  }

  async getList () {
    return await this.mutex.runExclusive(async () => {
      return this.getSortedReleases();
    })
  }

  async loadNotifications() {
    try {
      return await this.getCacheKey(NOTIFICATIONS_FILE.replace('.json', ''))
    } catch (e) {
      if (e.code === 'ENOENT') return []
      console.error('Failed to load notifications', e)
      return []
    }
  }

  async saveNotifications(items) {
    await this.setCacheKey(NOTIFICATIONS_FILE.replace('.json', ''), items)
  }

  async loadNotificationsState() {
    try {
      const state = await this.getCacheKey(NOTIFICATIONS_STATE_FILE.replace('.json', ''))
      const map = new Map()
      for (const [releaseId, ordinals] of Object.entries(state || {})) {
        map.set(Number(releaseId), new Set(ordinals))
      }
      return map
    } catch (e) {
      if (e.code === 'ENOENT') return new Map()
      console.error('Failed to load notifications state', e)
      return new Map()
    }
  }

  async saveNotificationsState(stateMap) {
    const obj = {}
    for (const [releaseId, ordinals] of stateMap.entries()) {
      obj[releaseId] = [...ordinals]
    }
    await this.setCacheKey(NOTIFICATIONS_STATE_FILE.replace('.json', ''), obj)
  }

  getEpisodeOrdinal(episode) {
    return episode.ordinal ?? episode.number ?? episode.episode ?? episode.name ?? null
  }

  /**
   *
   * @param {object} options
   * @param {Set|Array|null} options.favoriteIds
   * @param {boolean} options.onlyFavorites
   * @returns {Promise<{ added: Array, all: Array }>}
   */
  async diffAndUpdateNotifications(options = {}) {
    const { favoriteIds = null, onlyFavorites = false } = options

    if (!this.episodesByReleaseId || !this.releases) {
      console.warn('Cache not ready for notifications diff')
      return { added: [], all: [] }
    }

    const previousState = await this.loadNotificationsState()
    const currentNotifications = await this.loadNotifications()
    const now = new Date().toISOString()
    const added = []
    const newState = new Map()

    for (const [releaseId, items] of this.episodesByReleaseId.entries()) {
      if (!items?.length) continue

      if (onlyFavorites && favoriteIds && !favoriteIds.has(releaseId) && !favoriteIds.has(Number(releaseId))) {
        const ordinals = new Set(items.map(ep => this.getEpisodeOrdinal(ep)).filter(x => x != null))
        newState.set(releaseId, ordinals)
        continue
      }

      const prevOrdinals = previousState.get(releaseId) || new Set()
      const currentOrdinals = new Set()

      for (const ep of items) {
        const ordinal = this.getEpisodeOrdinal(ep)
        if (ordinal == null) continue
        currentOrdinals.add(ordinal)

        if (!prevOrdinals.has(ordinal)) {
          const exists = currentNotifications.some(
            n => n.releaseId === releaseId && String(n.episodeOrdinal) === String(ordinal)
          )
          if (!exists) {
            const notification = {
              releaseId,
              episodeOrdinal: ordinal,
              is_seen: false,
              datetime: now
            }
            added.push(notification)
            currentNotifications.push(notification)
          }
        }
      }

      newState.set(releaseId, currentOrdinals)
    }

    const cutoff = Date.now() - NOTIFICATIONS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    let filtered = currentNotifications.filter(n => {
      const t = new Date(n.datetime).getTime()
      return !isNaN(t) && t >= cutoff
    })

    filtered.sort((a, b) => new Date(b.datetime) - new Date(a.datetime))

    if (filtered.length > NOTIFICATIONS_MAX_COUNT) {
      filtered = filtered.slice(0, NOTIFICATIONS_MAX_COUNT)
    }

    await this.saveNotifications(filtered)
    await this.saveNotificationsState(newState)

    return { added, all: filtered }
  }

  async getUniqueSortedReleases() {
    return await this.mutex.runExclusive(async () => {
      const seenIds = new Set();
      const result = [];

      const sortedReleases = await this.getSortedReleases();

      for (const release of sortedReleases) {
        if (!seenIds.has(release.id)) {
          result.push(release);
          seenIds.add(release.id);
        }
      }

      return result;
    })
  }

  async getNotifications({ includeMissing = true } = {}) {
    const raw = await this.loadNotifications()

    return raw
      .map(n => {
        const release = this.releases?.get(n.releaseId) || null
        let episode = null

        if (release && this.episodesByReleaseId) {
          const items = this.episodesByReleaseId.get(n.releaseId) || []
          episode = items.find(ep => String(this.getEpisodeOrdinal(ep)) === String(n.episodeOrdinal)) || null
        }

        if (!release && !includeMissing) return null

        return {
          ...n,
          release,
          episode,
          title: release?.title || release?.localizedTitle || null,
          poster: release?.poster || null,
          isMissing: !release
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
  }

  async markNotificationsSeen() {
    const items = await this.loadNotifications()
    const updated = items.map(n => ({ ...n, is_seen: true }))
    await this.saveNotifications(updated)
    return updated
  }

  async clearNotifications() {
    await this.saveNotifications([])
    return []
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      return this.initializationPromise;
    }
  }
}
