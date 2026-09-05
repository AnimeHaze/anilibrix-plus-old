<template>
  <v-dialog
    v-model="visible"
    persistent
    max-width="500"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ $t('dialogs.createSnapshotTitle') }}
      </v-card-title>
      <v-card-text>
        {{ $t('dialogs.createSnapshotQuestion') }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="green darken-1"
          text
          :loading="loading"
          v-on:click="createSnapshot"
        >
          {{ $t('dialogs.yes') }}
        </v-btn>
        <v-btn
          color="green darken-1"
          text
          :loading="loading"
          v-on:click="visible = false"
        >
          {{ $t('common.cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState } from 'vuex'
import { catGirlFetch } from '@utils/fetch'

export default {
  data () {
    return {
      visible: false,
      loading: false,
    }
  },
  computed: {
    ...mapState('app/watch', { _watch: s => s.items }),
    ...mapState('app/settings/player', {
      _video_buffer: s => s.video.buffer,
      _autoplay_next: s => s.autoplayNext,
      _torrents_process: s => s.torrents.process,
      _opening_skip_time: s => s.opening.skip_time,
      _opening_skip_button: s => s.opening.skip_button,
    }),
    ...mapState('app/settings/system', {
      _updates_enabled: s => s.updates.enabled,
      _updates_timeout: s => s.updates.timeout,
      _api_endpoint: s => s.api._endpoint,
      _static_endpoint: s => s.api._static_endpoint,
    }),
    ...mapState('app/account', {
      _session: s => s.session
    }),
  },
  methods: {
    async createSnapshot () {
      this.loading = true

      const watchedReleases = {}

       Object.entries(this._watch || {}).map(([key, episode]) => {
        const [releaseId, episodeId] = key.split(':');
        watchedReleases[releaseId] || (watchedReleases[releaseId] = { episodes: [] })
        watchedReleases[releaseId].episodes.push({
          percentage: episode.percentage,
          episode: episodeId,
          isSeen: !!episode.isSeen,
          timestamp: episode.time < 0 ? 0 : episode.time
        })
      })

      const watched = Object.entries(watchedReleases).map(([key, obj]) => {
        return {
          releaseId: key,
          ...obj
        }
      })

      await catGirlFetch(process.env.EXT_API_SERVER + '/snapshot', {
        method: 'PUT',
        headers: {
          'x-session': this._session,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          watched,
          settings: {
            playTorrents: this._torrents_process  || false,
            videoBuffer: this._video_buffer,
            enableOpeningSkipButton: this._opening_skip_button || false,
            openingSkipTime: this._opening_skip_time,
            autoPlayNext: this._autoplay_next  || false,
            staticEndpoint: this._static_endpoint,
            apiEndpoint: this._api_endpoint,
            autoUpdateReleases: this._updates_enabled || true,
            autoUpdateInterval: this._updates_timeout
          }
        })
      })
        .then(x => x.json())
        .then(({
          data,
          success,
          error
        }) => {
          if (!success) throw error
          this.hideDialog()
          this.$emit('fetchSnapshots')
        }).catch((error) => this.$toasted.show(error, { type: 'error' }))
      this.loading = false
    },
    hideDialog () {
      this.visible = false
    },
    /**
     * Show dialog
     *
     * @return void
     */
    showDialog () {
      this.visible = true
    }
  }

}
</script>
