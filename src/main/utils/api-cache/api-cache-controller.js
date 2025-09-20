import { APIResponseTransformer } from './api-release-transformer'

export class APIController {
  constructor(cacheService) {
    this.cacheService = cacheService;
    this.findEpisodes = (id) => {
      return this.cacheService.episodesByReleaseId.get(id) || [];
    };
  }

  async handleProxyWithCache(query, extra) {
    return {
      data: query === 'user' ? {
        avatar: '/storage/users/avatars/3579/357970/lfoafjkY5FGCN4LLpNcNcALhdzmXIoPV.jpg',
        id: 1,
        login: 'Roxy'
      } : await this.handleListRequest({ perPage: 370, page: 1 }),
      error: null,
      status: true
    }
  }

  async handleRequest(body, type) {
    await this.cacheService.ensureInitialized();

    try {
      let data = {};

      if (type === 'list') {
        data = await this.handleListRequest(body);
      } else if (type === 'release') {
        data = await this.handleReleaseRequest(body);
      } else if (type === 'catalog') {
        data = await this.handleCatalogRequest(body);
      } else if (type === 'random_release') {
        data = await this.handleReleaseRequest({ id: 9972 });

        console.log(data, 43444)
      }

      return { data, error: null, status: true };
    } catch (error) {
      return { data: null, error: error.message, status: false };
    }
  }

  async handleListRequest({ perPage = 10, page = 1 }) {
    const validatedPerPage = this.validatePerPage(perPage);
    if (validatedPerPage.error) throw new Error(validatedPerPage.error);

    const sortedReleases = this.cacheService.getSortedReleases();

    const items = sortedReleases.slice(
      (page - 1) * validatedPerPage.value,
      page * validatedPerPage.value
    );

    return {
      items: items.map(x => APIResponseTransformer.transformRelease(x, this.findEpisodes(x.id))),
      pagination: this.createPagination(validatedPerPage.value, page, sortedReleases.length)
    };
  }

  async handleReleaseRequest({ id }) {
    const release = this.cacheService.releases.get(id) ||
      this.cacheService.releases.get(Number(id));
    if (!release) throw new Error('Release not found');

    return APIResponseTransformer.transformRelease(release, this.findEpisodes(release.id));
  }

  async handleCatalogRequest({ perPage = 10, page = 1 }) {
    const validatedPerPage = this.validatePerPage(perPage);
    if (validatedPerPage.error) throw new Error(validatedPerPage.error);

    const uniqueReleases = this.cacheService.getUniqueSortedReleases();

    const items = uniqueReleases.slice(
      (page - 1) * validatedPerPage.value,
      page * validatedPerPage.value
    );

    return {
      items: items.map(x => APIResponseTransformer.transformRelease(x, this.findEpisodes(x.id))),
      pagination: this.createPagination(validatedPerPage.value, page, uniqueReleases.length)
    };
  }

  validatePerPage(perPage) {
    const parsed = Number(perPage);
    return parsed > 0 ? { value: parsed } : { error: 'Invalid perPage' };
  }

  createPagination(perPage, currentPage, totalItems) {
    return {
      allItems: totalItems,
      allPages: Math.ceil(totalItems / perPage),
      page: currentPage,
      perPage
    };
  }
}
