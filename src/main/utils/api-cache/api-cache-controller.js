import { APIResponseTransformer } from './api-release-transformer';

export class APIController {
  constructor(cacheService) {
    this.cacheService = cacheService;
  }

  handleListRequest(body) {
    const { perPage = 10, page = 1 } = body;
    const validatedPerPage = this.validatePerPage(perPage);

    if (validatedPerPage.error) {
      return { error: validatedPerPage.error, status: false };
    }

    const items = this.getPaginatedReleases(validatedPerPage.value, page);

    return {
      data: {
        items: items.map(APIResponseTransformer.transformRelease),
        pagination: this.createPagination(validatedPerPage.value, page)
      },
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

  getPaginatedReleases(perPage, page) {
    return this.cacheService.sortedEpisodesByFreshness
      .map(episode => this.cacheService.releases.find(
        release => release.id === this.cacheService.episodes[episode.index].releaseId
      ))
      .reverse()
      .slice(page > 1 ? perPage * (page - 1) : 0, perPage * page);
  }

  createPagination(perPage, currentPage) {
    const totalItems = this.cacheService.releases.length;

    return {
      allItems: totalItems,
      allPages: Math.ceil(totalItems / perPage),
      page: currentPage,
      perPage
    };
  }
}
