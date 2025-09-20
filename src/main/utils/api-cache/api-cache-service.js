import fs from 'fs/promises'
import path from 'path'

export class APICacheService {
  constructor(userDataPath) {
    this.cachePath = path.join(userDataPath, 'api-cache');
    console.log('API Cache Path:', this.cachePath);
    this.isInitialized = false;
  }

  async loadCacheMetadata() {
    const metadataPath = path.join(this.cachePath, 'metadata');
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(metadataContent);
  }

  async loadJsonFiles(filePrefix, count) {
    const filesData = await Promise.all(
      Array.from({ length: count }, async (_, index) => {
        const filePath = path.join(this.cachePath, `${filePrefix}${index}.json`);
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
      })
    );

    return Object.freeze(filesData.flat());
  }

  async initialize() {
    if (this.isInitialized) return;

    const { countEpisodes, countReleases } = await this.loadCacheMetadata();

    const [releasesData, episodesData] = await Promise.all([
      this.loadJsonFiles('releases', countReleases),
      this.loadJsonFiles('episodes', countEpisodes)
    ]);

    this.releases = new Map();
    releasesData.forEach(release => this.releases.set(release.id, release));

    this.episodes = episodesData;
    this.buildEpisodesIndex();
    this.buildSortedCache();

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
