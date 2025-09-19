import { APIResponseTransformer } from './api-release-transformer';

export class APIController {
  constructor(cacheService) {
    this.cacheService = cacheService;
  }

  handleRequest(body, type) {
    let data = {}

    const findEpisodes = (id) => {
      return this.cacheService.episodes.find(x => x.releaseId == id)?.items || []
    }

    if (type === 'list') {
      const {
        perPage = 10,
        page = 1
      } = body;
      const validatedPerPage = this.validatePerPage(perPage);

      if (validatedPerPage.error) {
        return {
          error: validatedPerPage.error,
          status: false
        };
      }

      const items = this.getPaginatedList(validatedPerPage.value, page);

      data.items = items.map(x => APIResponseTransformer.transformRelease(x, findEpisodes(x.id)))
      data.pagination = this.createPagination(validatedPerPage.value, page)
    } else if (type === 'release') {
      const release = this.cacheService.releases.get(body.id) || this.cacheService.releases.get(+body.id)
      data = APIResponseTransformer.transformRelease(release, findEpisodes(release.id))
    } else if (type === 'catalog') {
      const {
        perPage = 10,
        page = 1
      } = body;
      const validatedPerPage = this.validatePerPage(perPage);

      if (validatedPerPage.error) {
        return {
          error: validatedPerPage.error,
          status: false
        };
      }

      const items = this.getPaginatedReleases(validatedPerPage.value, page);

      data.items = items.map(x => APIResponseTransformer.transformRelease(x, findEpisodes(x.id)))
      data.pagination = this.createPagination(validatedPerPage.value, page)
    }

    return {
      data,
      error: null,
      status: true
    };
  }

  validatePerPage(perPage) {
    const parsedPerPage = Number(perPage);

    if (isNaN(parsedPerPage) || parsedPerPage < 0) {
      return { error: 'Invalid perPage' };
    }

    return { value: parsedPerPage };
  }

  getPaginatedList(perPage, page) {
    return this.cacheService.sortedEpisodesByFreshness
      .map(episode => this.cacheService.releases.get(this.cacheService.episodes[episode.index].releaseId))
      .reverse()
      .slice(page > 1 ? perPage * (page - 1) : 0, perPage * page);
  }

  getPaginatedReleases (perPage, page) {
    const uniqueReleases = [];
    const seenIds = new Set();

    for (const episode of this.cacheService.sortedEpisodesByFreshness) {
      const releaseId = this.cacheService.episodes[episode.index].releaseId;
      if (!seenIds.has(releaseId)) {
        const release = this.cacheService.releases.get(releaseId);
        if (release) {
          uniqueReleases.push(release);
          seenIds.add(releaseId);
        }
      }
    }

    return uniqueReleases
      .reverse()
      .slice(page > 1 ? perPage * (page - 1) : 0, perPage * page);
  }

  createPagination(perPage, currentPage) {
    const totalItems = this.cacheService.releases.size;

    return {
      allItems: totalItems,
      allPages: Math.ceil(totalItems / perPage),
      page: currentPage,
      perPage
    };
  }
}
