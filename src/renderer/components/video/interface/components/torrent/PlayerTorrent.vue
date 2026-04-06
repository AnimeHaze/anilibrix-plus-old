<template>
  <v-navigation-drawer
    v-if="source.type === 'torrent'"
    v-model="visible"
    absolute
    temporary
    width="350"
    :style="{zIndex: 100}">

    <!-- System Bar Offset-->
    <app-system-bar-placeholder fixed/>

    <!-- Torrent Details -->
    <v-card :class="{'mt-9': !this.isMacOnFullscreen}">
      <v-card-title>{{ $t('player.torrentTitle') }}</v-card-title>
      <v-card-subtitle>{{ $t('player.torrentSubtitle') }}</v-card-subtitle>
      <v-list dense>
        <template v-for="(item, k) in items">
          <v-divider :key="`d:${k}`"/>

          <v-list-item :key="k">
            <v-list-item-content>
              <v-list-item-subtitle v-text="item.title"/>
              <v-list-item-title v-text="item.value" :class="item.classes"/>
            </v-list-item-content>
          </v-list-item>

        </template>
      </v-list>
      <v-divider/>
    </v-card>

    <!-- Notice -->
    <div class="caption grey--text px-4 mt-4">
      {{ $t('player.torrentWarning') }}
    </div>

  </v-navigation-drawer>
</template>

<script>

import AppSystemBarPlaceholder from '@components/app/systembar/placeholder'

import prettyBytes from 'pretty-bytes'
import { AppPlatformMixin } from '@mixins/app'
import { catchTorrentDownload } from '@main/handlers/torrents/torrents-handler'

const props = {
  source: {
    type: Object,
    default: null
  }
}

export default {
  props,
  mixins: [AppPlatformMixin],
  components: {
    AppSystemBarPlaceholder
  },
  data () {
    return {
      speed: 0,
      seeding: 0,
      visible: false,
      progress: 0,
    }
  },

  computed: {

    /**
     * Get torrent data
     *
     * @return {*}
     */
    torrent () {
      return this.$__get(this.source, 'payload.torrent')
    },

    /**
     * Get torrent file data
     *
     * @return {*}
     */
    file () {
      return this.$__get(this.source, 'payload.file')
    },

    /**
     * Get torrent name
     *
     * @return {{title: string, value: *}[]}
     */
    items () {
      return [
        {
          title: this.$t('player.torrentName'),
          value: this.$__get(this.torrent, 'name'),
          classes: ['white-space--pre-wrap']
        },
        {
          title: this.$t('player.torrentCreatedAt'),
          value: this.$__get(this.torrent, 'datetime') ? new Date(this.$__get(this.torrent, 'datetime')).toLocaleString() : null,
        },
        {
          title: this.$t('player.torrentSeeders'),
          value: this.$__get(this.torrent, 'seeders'),
        },
        {
          title: this.$t('player.torrentLeechers'),
          value: this.$__get(this.torrent, 'leechers'),
        },
        {
          title: this.$t('player.torrentFile'),
          value: this.$__get(this.file, 'name'),
          classes: ['white-space--pre-wrap']
        },
        {
          title: this.$t('player.torrentSize'),
          value: prettyBytes(this.$__get(this.file, 'length')),
        },
        {
          title: this.$t('player.torrentDownloadSpeed'),
          value: prettyBytes(parseFloat(this.speed.toFixed(2)), { bits: true }),
        },
        {
          title: this.$t('player.torrentUploadSpeed'),
          value: prettyBytes(parseFloat(this.seeding.toFixed(2)), { bits: true }),
        },
        {
          title: this.$t('player.torrentProgress'),
          value: `${(this.progress * 100).toFixed(2)}%`,
        }
      ].filter(item => item.value !== null)
    }

  },

  methods: {

    /**
     * Show torrent data
     *
     * @return void
     */
    show () {
      this.visible = true
    },

  },

  created () {
    catchTorrentDownload(data => {
      if (this.torrent && this.torrent.id === data.torrentId) {

        // Set download speed
        this.speed = data.speed || 0
        this.seeding = data.seeding || 0

        // Find current file
        // Set it's progress
        const file = (data.files || []).find(file => file.name === this.file.name)
        if (file) {
          this.progress = file.progress
        }
      }
    })
  }

}
</script>

<style lang="scss" scoped>

.white-space--pre-wrap {
  white-space: pre-wrap;
}


</style>
