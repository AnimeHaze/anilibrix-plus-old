<template>
  <!-- Loading -->
  <loader v-if="loading || parseLoading"/>

  <!-- Torrents -->
  <div v-else-if="!loading && !parseLoading && torrentsList" id="torrents">
    <v-list v-if="torrentsList.length > 0" dense dark>
      <v-list-item>
        <v-checkbox
          v-model="_torrentType"
          true-value="magnet"
          false-value="file"
          :label="$t('release.torrentMagnet')"
        ></v-checkbox>
      </v-list-item>

      <template v-for="(torrent, k) in torrentsList">
        <v-divider v-if="k > 0" :key="`d:${k}`"/>

        <v-list-item two-line @click="download(torrent)">
          <v-list-item-content>
            <v-list-item-title class="d-flex justify-space-between">
              <span>{{ $t('release.torrentSeries', { series: torrent.series }) }}</span>
              <span>{{ formatTimestamp(torrent.ctime) }}</span>
            </v-list-item-title>

            <v-list-item-subtitle class="d-flex justify-space-between caption grey--text text--darken-1">
              <span>{{ formatSize(torrent.size) }} | {{ torrent.quality }}</span>
              <div class="d-flex justify-center align-center">
                <span class="d-flex justify-center align-center mr-1">
                  <span>{{ humanFormat(torrent.seeders) }}</span>
                  <v-icon dark small color="green">mdi-arrow-up</v-icon>
                </span>

                <span class="d-flex justify-center align-center mr-1">
                  <span>{{ humanFormat(torrent.leechers) }}</span>
                  <v-icon dark small color="red">mdi-arrow-down</v-icon>
                </span>

                <span class="d-flex justify-center align-center">
                  <span>{{ humanFormat(torrent.completed) }}</span>
                  <v-icon dark small color="blue">mdi-download</v-icon>
                </span>
              </div>
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action @click.stop="copyToClipboard(torrent.magnet, k)">
            <v-btn icon>
              <v-icon v-if="copiedIndex === k" color="success">mdi-check</v-icon>
              <v-icon v-else>mdi-content-copy</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
  </div>
</template>

<style>

</style>

<script>
import Loader from './components/loader'
import humanFormat from 'human-format'
import moment from 'moment'
import { invokeTorrentParse } from '@main/handlers/app/app-handlers';
import { mapActions, mapState } from 'vuex';

const props = {
  loading: {
    type: Boolean,
    default: false,
  },
  torrents: {
    type: Array,
    default: []
  }
}

export default {
  props,
  components: {
    Loader,
  },
  computed: {
    _torrentType: {
      get() {
        return this.torrentType
      },
      set(v) {
        this._setTorrentType(v)
      }
    },
    ...mapState('app/settings/system', {
      torrentType: s => s.torrentType,
    }),
  },
  data() {
    return {
      torrentsList: [],
      parseLoading: false,
      copiedIndex: null,
      copyTimeout: null
    }
  },
  methods: {
    async copyToClipboard(link, index) {
      try {
        await navigator.clipboard.writeText(link);

        if (this.copyTimeout) {
          clearTimeout(this.copyTimeout);
        }

        this.copiedIndex = index;

        this.copyTimeout = setTimeout(() => {
          this.copiedIndex = null;
        }, 2000);

      } catch (err) {
        console.error(err);
        this.$toasted.error(this.$t('release.torrentCopyError'));
      }
    },
    ...mapActions('app/settings/system', {
      _setTorrentType: 'setTorrentType',
    }),
    humanFormat,

    download(torrent) {
      if (this._torrentType === 'magnet') {
        window.open(torrent.magnet, '_blank')
      } else {
        if (torrent.filename === 'fuckyou') {
          this.$toasted.show(this.$t('release.torrentFetchError'), { type: 'error' })
          return
        }

        let downloadLink = document.createElement("a");
        downloadLink.href = 'data:application/x-bittorrent;base64,' + torrent.file;
        downloadLink.download = torrent.filename;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    },

    formatSize(size) {
      const units = this.$locale === 'ru'
        ? ['б', 'Кб', 'Мб', 'Гб', 'Тб']
        : ['B', 'KB', 'MB', 'GB', 'TB']

      return humanFormat(size, { scale: humanFormat.Scale.create(units, 1024) })
    },

    formatTimestamp(time) {
      return moment.unix(time).format('DD.MM.YYYY HH:mm:ss')
    },

    async parseTorrents() {
      this.parseLoading = true
      const torrents = this.torrents

      for (let torrent of torrents) {
        const { file, name, magnet, url } = await invokeTorrentParse(torrent.url)

        this.torrentsList.push({
          ...torrent,
          url,
          magnet,
          file,
          filename: name
        })
      }
      this.parseLoading = false
    }
  },
  async mounted() {
    await this.parseTorrents()
  },

  watch: {
    torrents: function() {
      this.parseTorrents()
    }
  },

  beforeDestroy() {
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
  }
}
</script>
