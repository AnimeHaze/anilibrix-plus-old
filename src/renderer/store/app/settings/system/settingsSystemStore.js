const SET_ADS = 'SET_ADS'
const SET_UPDATES = 'SET_UPDATES'
const TOGGLE_DEVTOOLS = 'TOGGLE_DEVTOOLS'
const SET_ADS_MAXIMUM = 'SET_ADS_MAXIMUM'
const SET_UPDATES_TIMEOUT = 'SET_UPDATES_TIMEOUT'
const SET_SYSTEM_NOTIFICATIONS = 'SET_SYSTEM_NOTIFICATIONS'
const SET_APPBAR_RIGHT = 'SET_APPBAR_RIGHT';
const SET_FILTER_NOTIFY = 'SET_FILTER_NOTIFY';
const SET_API_ENDPOINT = 'SET_API_ENDPOINT'
const SET_API_STATIC_ENDPOINT = 'SET_API_STATIC_ENDPOINT'
const SET_PROXY = 'SET_PROXY'
const SET_TORRENT_TYPE = 'SET_TORRENT_TYPE'
const SET_DRPC = 'SET_DRPC'
const SET_IGNORE_CERTS = 'SET_IGNORE_CERTS'

function normalizeEndpoint (endpoint) {
  if (endpoint.endsWith('/')) {
    return endpoint.slice(0, -1).trim()
  }

  return endpoint.replace(/([^:]\/)\/+/g, '$1').trim()
}

export default {
  namespaced: true,
  state: {
    ads: {
      enabled: true,
      maximum: false
    },
    ads__maximum: false,
    appbar_right: false,
    filter_notify: false,
    devtools: false,
    updates: {
      enabled: true,
      timeout: 10
    },
    api: {
      _endpoint: process.env.API_ENDPOINT_URL,
      _static_endpoint: process.env.STATIC_ENDPOINT_URL
    },
    notifications: {
      system: true
    },
    torrentType: 'magnet',
    drpc_enabled: true,
    proxy: '',
    ignore_certs: false
  },
  getters: {
    apiEndpoint: state => {
      return normalizeEndpoint(state.api?._endpoint || process.env.API_ENDPOINT_URL);
    },
    staticEndpoint: state => {
      return normalizeEndpoint(state.api?._static_endpoint || process.env.STATIC_ENDPOINT_URL);
    }
  },
  mutations: {
    [SET_TORRENT_TYPE]: (s, state) => (s.torrentType = state),
    [SET_DRPC]: (s, state) => (s.drpc_enabled = state),
    [SET_IGNORE_CERTS]: (s, state) => (s.ignore_certs = state),
    [SET_API_ENDPOINT]: (s, state) => (s.api._endpoint = state),
    [SET_API_STATIC_ENDPOINT]: (s, state) => (s.api._static_endpoint = state),
    [SET_PROXY]: (s, state) => (s.proxy = state),
    /**
     * Set updates state
     *
     * @param s
     * @param state
     * @return {*}
     */
    [SET_UPDATES]: (s, state) => (s.updates.enabled = state),
    /**
     * Set updates timeout
     *
     * @param s
     * @param timeout
     * @return {*}
     */
    [SET_UPDATES_TIMEOUT]: (s, timeout) => (s.updates.timeout = timeout),

    /**
     * Set system notifications
     *
     * @param s
     * @param state
     * @return {*}
     */
    [SET_SYSTEM_NOTIFICATIONS]: (s, state) => (s.notifications.system = state),

    /**
     * Toggle devtools
     *
     * @param s
     * @return {boolean}
     */
    [TOGGLE_DEVTOOLS]: s => (s.devtools = !s.devtools),

    /**
     * Set ads
     *
     * @param s
     * @param state
     * @return {*}
     */
    [SET_ADS]: (s, state) => (s.ads.enabled = state),

    /**
     * Set appbar inverse
     *
     * @param s
     * @param appbar_right
     */
    // eslint-disable-next-line camelcase
    [SET_APPBAR_RIGHT]: (s, appbar_right) => (s.appbar_right = appbar_right),

    /**
     * Set filter notify
     *
     * @param s
     * @param filter_notify
     */
    // eslint-disable-next-line camelcase
    [SET_FILTER_NOTIFY]: (s, filter_notify) => (s.filter_notify = filter_notify),

    /**
     * Set ads maximum
     *
     * @param s
     * @param state
     * @return {*}
     */
    [SET_ADS_MAXIMUM]: (s, state) => (s.ads.maximum = state)

  },
  actions: {

    /**
     * Set updates state
     *
     * @param commit
     * @param state
     * @return {*}
     */
    setUpdates: ({ commit }, state) => commit(SET_UPDATES, state),

    /**
     * Set updates state
     *
     * @param commit
     * @param state
     * @return {*}
     */
    setAPIEndpoint: ({ commit }, state) => commit(SET_API_ENDPOINT, state),
    setAPIStaticEndpoint: ({ commit }, state) => commit(SET_API_STATIC_ENDPOINT, state),
    setProxy: ({ commit }, state) => commit(SET_PROXY, state),
    /**
     * Set updates timeout
     *
     * @param commit
     * @param timeout
     * @return {*}
     */
    setUpdatesTimeout: ({ commit }, timeout) => commit(SET_UPDATES_TIMEOUT, timeout),

    /**
     * Set system notifications
     *
     * @param commit
     * @param state
     * @return {*}
     */
    setSystemNotifications: ({ commit }, state) => commit(SET_SYSTEM_NOTIFICATIONS, state),

    /**
     * Toggle devtools
     *
     * @param commit
     * @return {*}
     */
    toggleDevtools: ({ commit }) => commit(TOGGLE_DEVTOOLS),

    /**
     * Set ads
     *
     * @param commit
     * @param state
     * @return {*}
     */
    setAds: ({ commit }, state) => commit(SET_ADS, state),

    /**
     * Set ads maximum
     *
     * @param commit
     * @param state
     * @return {*}
     */
    setAdsMaximum: ({ commit }, state) => commit(SET_ADS_MAXIMUM, state),

    /**
     * Set appbar to right side
     *
     * @param commit
     * @param appbar_right
     */
    // eslint-disable-next-line camelcase
    setAppbarRight: ({ commit }, appbar_right) => commit(SET_APPBAR_RIGHT, appbar_right),

    /**
     * Set filter notify
     *
     * @param commit
     * @param filter_notify
     */
    // eslint-disable-next-line camelcase
    setFilterNotify: ({ commit }, filter_notify) => commit(SET_FILTER_NOTIFY, filter_notify),
    setTorrentType: ({ commit }, type) => commit(SET_TORRENT_TYPE, type),
    setDRPC: ({ commit }, type) => commit(SET_DRPC, type),
    setIgnoreCerts: ({ commit }, type) => commit(SET_IGNORE_CERTS, type)
  }
}
