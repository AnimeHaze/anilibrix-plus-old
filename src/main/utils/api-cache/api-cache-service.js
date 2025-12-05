import fs from 'fs/promises'
import { createWriteStream, existsSync } from 'fs'

import path from 'path'
import Fuse from 'fuse.js';
import { ipcMain } from 'electron';
import AdmZip from 'adm-zip';
import { Mutex } from 'async-mutex';
import crypto from 'crypto';

const githubCacheUrl = 'https://github.com/trueromanus/LocalCacheChecker/archive/refs/heads/main.zip'

export class APICacheService {
  constructor(cachePath) {
    this.cachePath = cachePath;
    console.log('API Cache Path:', this.cachePath);
    this.isInitialized = false;
    this.cache = new Map();
    this.search = null
    this.mutex = new Mutex()
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
        const response = await fetch(url);

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
    const activeCachePrefix = await fs.readFile(path.join(this.cachePath, 'active.cache'), 'utf8').catch((e) => {
      if (e.code === 'ENOENT') {
        console.log('Active cache not found');
        return null;
      }

      throw e;
    })
    const uuid = crypto.randomUUID();
    const pathToZip = path.join(this.cachePath, 'main.zip')
    await this.downloadFile(githubCacheUrl, pathToZip)

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

    await fs.unlink(pathToZip).catch(console.error);
    await fs.writeFile(path.join(this.cachePath, 'active.cache'), uuid);

    if (activeCachePrefix !== null) {
      const files = await fs.readdir(this.cachePath)
      await Promise.all(
        files
          .filter(file => file.startsWith(activeCachePrefix))
          .map(file => fs.unlink(path.join(this.cachePath, file)).catch(console.error))
      )
    }

    console.log('Cache downloaded successfully and old cache deleted');
  }

  async processCache() {
    const activeCachePrefix = await fs.readFile(path.join(this.cachePath, 'active.cache'), 'utf8')
    const { countEpisodes, countReleases } = await this.loadCacheMetadata();

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
        magnet: torrent.magnet
      }

      this.torrentsRaw.set(torrent.id, torrentNew);
      this.torrents.get(torrent.releaseId).push(torrentNew);
    }

    this.years = new Set();
    this.genres = new Set();
    this.releases = new Map();
    releasesData.forEach(release => {
      release.year && this.years.add(release.year.toString());
      release.genres.split(',').forEach(v => v && this.genres.add(v.trim()))
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
    if (this.isInitialized) return;

    console.log('Initializing API cache...');

    await fs.mkdir(this.cachePath).catch(console.error)

    await this.mutex.runExclusive(async () => {
      await this.downloadCache();
      await this.processCache()
    });

    this.isInitialized = true;

    ipcMain.handle('getTorrent', (event, torrentId) => {
      return this.torrentsRaw.get(torrentId)
    })
  }

  buildSearchCache() {
    const releases = Array.from(this.releases.values())
    const fusejs = new Fuse(releases, { keys: ['title', 'description', 'originalName'], includeScore: true })
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
                  en: release.originalName
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
      return this.search?.search(query).sort((a, b) => a.score - b.score).map(x => x.item) || []
    })
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
      await this.initialize();
    }
  }
}
