import fs from 'fs/promises'
import path from 'path'

export class APICacheService {
  constructor(userDataPath) {
    this.cachePath = path.join(userDataPath, 'api-cache');
    console.log('API Cache Path:', this.cachePath);
  }

  async loadCacheMetadata() {
    const metadataPath = path.join(this.cachePath, 'metadata');
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(metadataContent);
  }

  async loadJsonFiles(filePrefix, count) {
    const fileNames = Array.from({ length: count }, (_, index) => `${filePrefix}${index}.json`);

    const filesData = await Promise.all(
      fileNames.map(async (file) => {
        const filePath = path.join(this.cachePath, file);
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
      })
    );

    return Object.freeze(filesData.flat());
  }

  async initialize() {
    const { countEpisodes, countReleases } = await this.loadCacheMetadata();

    this.releases = await this.loadJsonFiles('releases', countReleases);
    this.episodes = await this.loadJsonFiles('episodes', countEpisodes);

    this.sortedEpisodesByFreshness = this.sortEpisodesByFreshness();
  }

  sortEpisodesByFreshness() {
    return this.episodes
      .map((episode, index) => ({
        index,
        updatedAt: Math.max(...episode.items.map(x => new Date(x.updatedAt)))
      }))
      .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
  }
}
