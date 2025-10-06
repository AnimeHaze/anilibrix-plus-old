import {APIResponseTransformer} from './api-release-transformer'
import store from '@store';
import FormData from 'form-data'

function normalizeEndpoint (endpoint) {
  if (endpoint.endsWith('/')) {
    return endpoint.slice(0, -1).trim()
  }

  return endpoint.replace(/([^:]\/)\/+/g, '$1').trim()
}

export class APIController {
  constructor(cacheService) {
    this.cacheService = cacheService;
    this.findEpisodes = (id) => {
      return this.cacheService.episodesByReleaseId.get(id) || [];
    };
  }

  async handleProxyWithCache(query, extra) {
    const endpoint = 'https://wwnd.space';
    const apiUrl = `${endpoint}/public/api/index.php`;
    const session = store?.state?.app?.account?.session;

    if (!query) {
      throw new Error('Query parameter is required');
    }

    try {
      const response = await this.makeApiRequest(apiUrl, session, extra);

      if (response.ok) {
        const data = await response.json();
        await this.cacheService.setCacheKey(query, data);
        return data;
      }

      await this.handleErrorResponse(response);
    } catch (error) {
      return this.handleFallbackToCache(query, error);
    }
  }

  async makeApiRequest(apiUrl, session, extra) {
    const formData = this.createFormData(extra);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      return await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          Cookie: this.buildCookieHeader(session)
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  createFormData(extra) {
    const formData = new FormData();

    for (const [key, value] of Object.entries(extra || {})) {
      formData.append(key, value);
    }

    return formData;
  }

  buildCookieHeader(session) {
    if (!session) return '';

    return `PHPSESSID=${session}; Path=/; Secure; HttpOnly`;
  }

  async handleErrorResponse(response) {
    if (response.status === 401) {
      await this.clearUserData();
      throw new Error('Unauthorized');
    }

    throw new Error(`API request failed with status: ${response.status}`);
  }

  async clearUserData() {
    await this.cacheService.setCacheKey('user', null);
    await this.cacheService.setCacheKey('favorites', null);
  }

  async handleFallbackToCache(query, error) {
    const cachedValue = await this.cacheService.getCacheKey(query);

    if (cachedValue) {
      console.warn(`Using cached data for query "${query}" due to error:`, error.message);
      return cachedValue;
    }

    throw error;
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
