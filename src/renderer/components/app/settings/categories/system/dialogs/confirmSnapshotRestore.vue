<template>
  <v-dialog
    v-model="visible"
    persistent
    max-width="290"
  >
    <v-card>
      <v-card-title className="text-h5">
        WARNING
      </v-card-title>
      <v-card-text>
        Do you really want to restore data from the snapshot?
        This action cannot be canceled, the current data will be replaced by data from the snapshot
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :loading="loading"
          color="green darken-1"
          text
          v-on:click="restoreSnapshot"
        >
          Yes
        </v-btn>
        <v-btn
          :loading="loading"
          color="green darken-1"
          text
          v-on:click="visible = false"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import { catGirlFetch } from '@utils/fetch'
export default {
  data () {
    return {
      visible: false,
      loading: false,
      id: null
    }
  },
  computed: {
    ...mapState('app/account', {
      _session: s => s.session
    }),
  },
  methods: {
    ...mapActions('app/settings/system', {
      _setUpdates: 'setUpdates',
      _setAdsMaximum: 'setAdsMaximum',
      _setUpdatesTimeout: 'setUpdatesTimeout',
      _setSystemNotifications: 'setSystemNotifications',
      _setAPIEndpoint: 'setAPIEndpoint',
      _setAPIStaticEndpoint: 'setAPIStaticEndpoint',
    }),
    ...mapActions('app/settings/player', {
      _setVideoBuffer: 'setVideoBuffer',
      _setAutoplayNext: 'setAutoplayNext',
      _setTorrentsProcess: 'setTorrentsProcess',
      _setOpeningSkipTime: 'setOpeningSkipTime',
      _setOpeningSkipButton: 'setOpeningSkipButton',
    }),
    ...mapActions('app/watch', {
      _replaceWatchedEpisodes: 'replaceWatchedEpisodes'
    }),
    restoreSnapshot: async function () {
      this.loading = true
      await catGirlFetch(process.env.EXT_API_SERVER + '/snapshot/' + this.id, {
        method: 'GET',
        headers: {
          'x-session': this._session
        }
      })
        .then(x => x.json())
        .then(({ data, success, error }) => {
          if (success) {
            const {
              playTorrents,
              videoBuffer,
              enableOpeningSkipButton,
              openingSkipTime,
              autoPlayNext,
              showSystemNotifications,
              staticEndpoint,
              apiEndpoint,
              autoUpdateReleases,
              autoUpdateInterval,
            } = data.settings

            const watchedReleases = {}

            for (const release of data.watched) {
              release.episodes.map((episode) => {
                const key = `${release.releaseId}:${episode.episode}`
                if (watchedReleases[key] === undefined) watchedReleases[key] = {}

                if (episode.percentage !== undefined) watchedReleases[key].percentage = episode.percentage
                if (episode.isSeen !== undefined) watchedReleases[key].isSeen = episode.isSeen
                if (episode.percentage !== undefined) watchedReleases[key].percentage = episode.percentage
                if (episode.timestamp !== undefined) watchedReleases[key].time = episode.timestamp
              })
            }

            console.log('Restore watched', watchedReleases)

            console.log('Restore settings', {
                playTorrents,
                videoBuffer,
                enableOpeningSkipButton,
                openingSkipTime,
                autoPlayNext,
                showSystemNotifications,
                staticEndpoint,
                apiEndpoint,
                autoUpdateReleases,
                autoUpdateInterval,
            })

            this._replaceWatchedEpisodes({ data: watchedReleases })

            if (videoBuffer !== undefined) this._setVideoBuffer(videoBuffer)
            if (autoPlayNext !== undefined) this._setAutoplayNext(autoPlayNext)
            if (playTorrents !== undefined) this._setTorrentsProcess(playTorrents)
            if (openingSkipTime !== undefined) this._setOpeningSkipTime(openingSkipTime)
            if (enableOpeningSkipButton !== undefined) this._setOpeningSkipButton(enableOpeningSkipButton)

            if (showSystemNotifications !== undefined) this._setSystemNotifications(showSystemNotifications)
            if (apiEndpoint !== undefined) this._setAPIEndpoint(apiEndpoint)
            if (staticEndpoint !== undefined) this._setAPIStaticEndpoint(staticEndpoint)
            if (autoUpdateReleases !== undefined) this._setUpdates(autoUpdateReleases)
            if (autoUpdateInterval !== undefined) this._setUpdatesTimeout(autoUpdateInterval)

            this.$toasted.show("Данные из снапшота применены", {
              type: 'success',
              position: "top-center",
              duration : 2000
            });

          } else this.$toasted.show(error, { type: 'error' })
        })
        .catch((error) => {
          this.$toasted.show(error, { type: 'error' })
          throw error
        })
      this.loading = false
      this.hideDialog()
    },

    hideDialog () {
      this.visible = false
      this.id = null
    },
    /**
     * Show dialog
     *
     * @return void
     */
    showDialog (id) {
      this.visible = true
      this.id = id
    }
  }

}
</script>
