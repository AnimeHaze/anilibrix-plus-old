import fs from 'fs/promises'
import path from 'path'
import ReleaseProxy from '@proxies/release';
import store from '@store';

export class APICacheService {
  constructor(cachePath) {
    this.cachePath = cachePath;
    console.log('API Cache Path:', this.cachePath);
    this.isInitialized = false;
    this.cache = new Map();
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
    const metadataPath = path.join(this.cachePath, 'metadata');
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

  async initialize() {
    if (this.isInitialized) return;

    const { countEpisodes, countReleases } = await this.loadCacheMetadata();

    const [releasesData, episodesData, franchisesData] = await Promise.all([
      this.loadJsonFiles('releases', countReleases),
      this.loadJsonFiles('episodes', countEpisodes),
      this.loadJsonFiles('releaseseries', 1, true)
    ]);

    this.releases = new Map();
    releasesData.forEach(release => this.releases.set(release.id, release));

    this.episodes = episodesData;
    this.buildEpisodesIndex();
    this.buildSortedCache();
    this.buildFranchisesCache(franchisesData);

    this.isInitialized = true;
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

  getSortedReleases() {
    return this.sortedEpisodesByFreshness
      .map(episode => this.releases.get(episode.releaseId))
      .filter(Boolean)
      .reverse();
  }

  getUniqueSortedReleases() {
    const seenIds = new Set();
    const result = [];

    const sortedReleases = this.getSortedReleases();

    for (const release of sortedReleases) {
      if (!seenIds.has(release.id)) {
        result.push(release);
        seenIds.add(release.id);
      }
    }

    return result;
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}
