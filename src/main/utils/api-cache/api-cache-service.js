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

export class APICacheService {
  constructor(cachePath) {
    this.cachePath = cachePath;
    console.log('API Cache Path:', this.cachePath);
    this.isInitialized = false;
    this.cache = new Map();
    this.search = null
    this.mutex = new Mutex()

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
            .filter(file => !file.startsWith(uuid) && !['active.cache', 'user.json', 'favorites.json'].includes(file))
            .map(file => fs.unlink(path.join(this.cachePath, file)).catch(console.error))
        )
      }

      console.log('Cache downloaded successfully and old cache deleted');
    } catch (e) {
      console.error('Cache download failed', e)
      console.log('Fallback to last cache...')
    }
  }

  async processCache() {
    const activeCachePrefix = await fs.readFile(path.join(this.cachePath, 'active.cache'), 'utf8')
    const { countEpisodes, countReleases } = await this.loadCacheMetadata();
    await this.localizationService.ensureLoaded()

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

  async ensureInitialized() {
    if (!this.isInitialized) {
      return this.initializationPromise;
    }
  }
}
