<template>
  <v-app>
    <app-system-bar/>
    <app-settings/>

    <app-loader v-if="loading"/>
    <component :is="layout" v-else>
      <router-view :key="$route.fullPath"/>
    </component>

    <app-errors/>
    <app-notifications/>

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
import AppNotifications from '@components/app/notifications'
import AppUpdate from '@components/app/AppUpdate.vue'
import { version } from '@package'
import { setLocale } from './i18n'
import { setVuetifyLocale } from '@plugins/vuetify'
import { setMomentLocale } from '@plugins/moment'
import { invokeSetAppLocale } from '@main/handlers/app/app-handlers'

import { mapActions, mapState } from 'vuex'

export default {
  name: 'AniLibrix',
  components: {
    AppLoader,
    AppErrors,
    AppToolBar,
    AppSettings,
    AppSystemBar,
    AppBaseLayout,
    AppNotifications,
    AppUpdate
  },
  data () {
    return {
      loading: false,
      update_handler: null,
      update_notes: ''
    }
  },

  computed: {
    ...mapState('app', { _welcome_view: s => s.welcome_view }),
    ...mapState('app/settings/system', {
      _updates_enabled: s => s.updates.enabled,
      _updates_timeout: s => (s.updates.timeout > 0 ? s.updates.timeout : 1) * 60 * 1000,
      _language: s => s.language
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
    }

  },

  async mounted () {
    try {
      const data = await fetch("https://raw.githubusercontent.com/AnimeHaze/anilibrix-plus/refs/heads/lord/latest.json")
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

    view: {
      handler (view) {
        if (['releases', 'catalog', 'favorites'].includes(view)) this._setWelcomeView(view)
      }
    }
  }
}
</script>
