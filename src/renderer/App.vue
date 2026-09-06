<template>
  <v-app>
    <app-system-bar/>
    <app-settings/>

    <app-loader v-if="loading"/>
    <component :is="layout" v-else>
      <router-view :key="$route.fullPath"/>
    </component>

    <app-errors/>

    <AppUpdate :notes="update_notes" ref="appUpdate"/>
  </v-app>
</template>

<script>
import AppLoader from '@components/app/loader'
import AppErrors from '@components/app/errors'
import AppToolBar from '@components/app/toolbar'
import AppSettings from '@components/app/settings'
import AppSystemBar from '@components/app/systembar'
import AppBaseLayout from '@layouts/base'
import AppUpdate from '@components/app/AppUpdate.vue'
import { version } from '@package'
import { setLocale } from './i18n'
import { setVuetifyLocale } from '@plugins/vuetify'
import { setMomentLocale } from '@plugins/moment'
import { invokeSetAppLocale } from '@main/handlers/app/app-handlers'

import { mapActions, mapState } from 'vuex'
import {
  catchTorrentFileResolved, sendTorrentFileResolveRequest,
} from "@main/handlers/torrents/torrents-handler";

export default {
  name: 'AniLibrix',
  components: {
    AppLoader,
    AppErrors,
    AppToolBar,
    AppSettings,
    AppSystemBar,
    AppBaseLayout,
    AppUpdate
  },
  data () {
    return {
      loading: false,
      update_handler: null,
      always_on_top_handler: null,
      update_notes: ''
    }
  },

  computed: {
    ...mapState('app', { _welcome_view: s => s.welcome_view }),
    ...mapState('app/settings/system', {
      _updates_enabled: s => s.updates.enabled,
      _updates_timeout: s => (s.updates.timeout > 0 ? s.updates.timeout : 1) * 60 * 1000,
      _language: s => s.language,
      _always_on_top: s => s.always_on_top
    }),

    /**
     * Get route layout
     *
     * @return {{}}
     */
    layout () {
      return this.$__get(this.$route, 'meta.layout.is', AppBaseLayout)
    },

    /**
     * Get current route name
     *
     * @return {string|null}
     */
    view () {
      return this.$route.name || null
    },

  },

  methods: {
    ...mapActions('app', { _setWelcomeView: 'setWelcomeView' }),
    ...mapActions('releases', { _getReleases: 'getReleases' }),
    ...mapActions('favorites', { _getFavorites: 'getFavorites' }),

    /**
     * Toggle releases updates
     *
     * @return void
     */
    toggleUpdates () {

      // Clear update interval
      if (this.update_handler) clearInterval(this.update_handler)

      // If updated are enabled -> set interval for auto updates
      if (this._updates_enabled === true) {
        this.update_handler = setInterval(() => {

          this._getReleases()
          this._getFavorites()

        }, this._updates_timeout)
      }
    },

    async syncLocale (locale) {
      if (!locale) {
        return
      }

      setLocale(locale)
      setVuetifyLocale(locale)
      setMomentLocale(locale)

      try {
        await invokeSetAppLocale(locale)
      } catch (error) {
        console.error('Failed to sync app locale', error)
      }
    },

    syncAlwaysOnTop (state) {
      const window = require('@electron/remote').getCurrentWindow()
      const value = Boolean(state)

      if (window.isAlwaysOnTop() !== value) {
        window.setAlwaysOnTop(value)
      }
    },

    /**
     * Check actual BrowserWindow state and synchronize it with Vuex.
     *
     * This also catches changes made outside of Vue/Electron code.
     *
     * @return {void}
     */
    async checkAlwaysOnTop () {
      const window = require('@electron/remote').getCurrentWindow()
      const state = window.isAlwaysOnTop()

      if (state !== Boolean(this._always_on_top)) {
        await this.$store.dispatch(
          'app/settings/system/setAlwaysOnTop',
          state
        )
      }
    },

    /**
     * Start always-on-top synchronization.
     *
     * @return {void}
     */
    startAlwaysOnTopSync () {
      this.checkAlwaysOnTop()

      this.always_on_top_handler = setInterval(() => {
        this.checkAlwaysOnTop()
      }, 100)
    },

    /**
     * Stop always-on-top synchronization.
     *
     * @return {void}
     */
    stopAlwaysOnTopSync () {
      if (this.always_on_top_handler) {
        clearInterval(this.always_on_top_handler)
        this.always_on_top_handler = null
      }
    }
  },

  async mounted () {
    this.startAlwaysOnTopSync()

    const fetchWithReject = async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    }

    try {
      const data = await Promise.any([
        fetchWithReject("https://raw.githubusercontent.com/AnimeHaze/anilibrix-plus/refs/heads/lord/latest.json"),
        fetchWithReject("https://raw.githubusercontent.com/AnimeHaze/anilibrix-plus-old/refs/heads/lord/latest.json")
      ])
        .then(async x => {
          const text = await x.text()
          try {
            return JSON.parse(text)
          } catch (e) {
            console.error('Check version error', x.status, x.statusText, text, e)

            throw e
          }
        })

      if (version.includes('beta') && data.beta !== version) {
        this.update_notes = data.beta_notes
        this.$refs.appUpdate.showDialog()
      }

      if (!version.includes('beta') && data.stable !== version) {
        this.update_notes = data.stable_notes
        this.$refs.appUpdate.showDialog()
      }
    } catch (e) {
      console.error('Check version error', e)
    }
  },

  async created() {
    catchTorrentFileResolved((fileData) => {
      console.log('File resolved', fileData)
      if (global.TorrentFileResolved) global.TorrentFileResolved(fileData)
    })

    const last_page_release = localStorage.getItem('last_page_release')
    // Initial loading
    this.loading = true
    setTimeout(() => this.loading = false, 1000)

    // Get releases
    // Get favorites
    this._getReleases()
    this._getFavorites()

    console.log('Last page release', last_page_release)
    if (last_page_release) {
      console.log('Redirecting to release', last_page_release)
      await this.$router.push({name: 'release', params: JSON.parse(last_page_release)})
    } else if (this._welcome_view !== null && this.view !== this._welcome_view) {
      this.$router.push({name: this._welcome_view})
    }

  },

  beforeDestroy () {
    this.stopAlwaysOnTopSync()

    if (this.update_handler) {
      clearInterval(this.update_handler)
      this.update_handler = null
    }
  },

  watch: {

    _updates: {
      immediate: true,
      handler () {
        this.toggleUpdates()
      }
    },

    _timeout: {
      handler () {
        this.toggleUpdates()
      }
    },

    _language: {
      immediate: true,
      handler (locale) {
        this.syncLocale(locale)
      }
    },

    _always_on_top: {
      immediate: true,
      handler (state) {
        this.syncAlwaysOnTop(state)
      }
    },

    view: {
      handler (view) {
        if (['releases', 'catalog', 'favorites'].includes(view)) this._setWelcomeView(view)
      }
    }
  }
}
</script>
