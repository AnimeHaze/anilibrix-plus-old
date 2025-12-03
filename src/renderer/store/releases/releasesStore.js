// Proxy
import ReleaseProxy from '@proxies/release'

// Transformers
import SearchTransformer from '@transformers/search'
import ReleaseTransformer from '@transformers/release'
import EpisodesTransformer from '@transformers/episode'

// Utils
import axios from 'axios'

// Handlers
import { sendReleaseNotification, showAppError } from '@main/handlers/notifications/notifications-handler'

// Mutations
const SET_INDEX = 'SET_INDEX'
const SET_RELEASES_DATA = 'SET_RELEASES_DATA'
const SET_RELEASES_LOADING = 'SET_RELEASES_LOADING'
const SET_RELEASES_DATETIME = 'SET_RELEASES_DATETIME'
const SET_RELEASES_HAS_ERROR = 'SET_RELEASES_HAS_ERROR'

// Requests
let REQUEST_FOR_SEARCH = null
let REQUEST_FOR_RELEASES = null

async function transformAndProcessReleases(items) {
  const transformer = new ReleaseTransformer();
  const proxy = new ReleaseProxy();

  let releases = transformer.fetchCollection(items);

  releases = releases
    .map(release => ({
      ...release,
      poster: proxy.getReleasePosterPath(release.poster)
    }))
    .sort((a, b) => new Date(b.datetime.system) - new Date(a.datetime.system));

  const episodesTransformer = new EpisodesTransformer({
    cancelToken: REQUEST_FOR_RELEASES.token
  });

  const processedReleases = await Promise.allSettled(
    releases.map(async release => ({
      ...release,
      episodes: await episodesTransformer.fetchItem(release.episodes)
    }))
  );

  return processedReleases
    .filter(promise => promise.status === 'fulfilled')
    .map(promise => promise.value)
    .filter(release => release.episodes.length > 0);
}

async function handleNewReleaseNotifications(releases, state, dispatch) {
  if (!state.data || state.data.length === 0) return;

  const newReleases = releases.filter(release => {
    const previousRelease = state.data.find(
      item => item.id === release.id && item.episodes.length === release.episodes.length
    );
    return previousRelease === null;
  });

  for (const release of newReleases) {
    sendReleaseNotification(release);
    await dispatch('notifications/setRelease', release, { root: true });
  }
}

export default {
  namespaced: true,
  state: {
    data: [],
    index: null,
    loading: false,
    datetime: null,
    has_error: false
  },

  mutations: {

    /**
     * Set index
     *
     * @param s
     * @param index
     * @return {*}
     */
    [SET_INDEX]: (s, index) => (s.index = index),

    /**
     * Set releases loading
     *
     * @param s
     * @param loading
     * @return {*}
     */
    [SET_RELEASES_LOADING]: (s, loading) => (s.loading = loading),

    /**
     * Set releases data
     *
     * @param s
     * @param data
     * @return {*}
     */
    [SET_RELEASES_DATA]: (s, data) => (s.data = data),

    /**
     * Set releases datetime
     *
     * @param s
     * @param datetime
     * @return {*}
     */
    [SET_RELEASES_DATETIME]: (s, datetime) => (s.datetime = datetime),

    /**
     * Set release has error
     *
     * @param s
     * @param state
     * @return {*}
     */
    [SET_RELEASES_HAS_ERROR]: (s, state) => (s.has_error = state)

  },

  actions: {

    /**
     * Set slider index
     *
     * @param commit
     * @param index
     * @return {*}
     */
    setIndex: ({ commit }, index) => commit(SET_INDEX, index),

    getReleases: async ({ commit, dispatch, state }) => {
      try {
        commit(SET_RELEASES_LOADING, true)
        commit(SET_RELEASES_HAS_ERROR, false)

        if (REQUEST_FOR_RELEASES) {
          REQUEST_FOR_RELEASES.cancel();
        }

        REQUEST_FOR_RELEASES = axios.CancelToken.source();

        const { items } = await new ReleaseProxy().getReleases({
          cancelToken: REQUEST_FOR_RELEASES.token
        });

        const releases = await transformAndProcessReleases(items);

        await handleNewReleaseNotifications(releases, state, dispatch);

        commit(SET_RELEASES_DATA, releases)
        commit(SET_RELEASES_DATETIME, new Date())
      } catch (error) {
        if (!axios.isCancel(error)) {
          // Set release has error
          commit(SET_RELEASES_HAS_ERROR, true)
          console.log(error)
          // Show error
          // Throw error
          showAppError('Произошла ошибка при загрузке релизов')
        }
      } finally {
        commit(SET_RELEASES_LOADING, false)
      }
    },

    /**
     * Search releases
     *
     * @param context
     * @param searchQuery
     * @return {array}
     */
    searchReleases: async (context, searchQuery) => {
      try {
        // Cancel previous request if it was stored
        // Create new request token if exists
        if (REQUEST_FOR_SEARCH) REQUEST_FOR_SEARCH.cancel()
        REQUEST_FOR_SEARCH = axios.CancelToken.source()

        // Get releases
        const response = await new ReleaseProxy().searchReleases(searchQuery, {
          cancelToken: REQUEST_FOR_SEARCH.token
        })

        // Transform releases
        // Get posters src
        return new SearchTransformer()
          .fetchCollection(response || [])
          .map(release => ({
            ...release,
            poster: new ReleaseProxy().getReleasePosterPath(release.poster)
          }))
      } catch (error) {
        if (!axios.isCancel(error)) {
          // Show app error
          // Return empty array
          console.log(error)
          showAppError('Произошла ошибка при поиске релизов')
          return []
        }
      }
    }
  }
}
