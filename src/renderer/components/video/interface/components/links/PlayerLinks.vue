<template>
  <div ref="links">
    <template v-if="isMounted">

      <!-- Releases -->
      <v-tooltip right :attach="$refs.links">
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon large @click="toReleases">
            <v-icon size="24">mdi-view-column</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('player.toReleases') }}</span>
      </v-tooltip>

      <!-- Release -->
      <v-tooltip right :attach="$refs.links">
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon large @click="() => toRelease(release)">
            <v-avatar size="24">
              <img v-bind="{src}">
            </v-avatar>
          </v-btn>
        </template>
        <span>{{ title }}</span>
      </v-tooltip>



      <!-- Catalog -->
      <v-tooltip right :attach="$refs.links">
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon large :to="{name: 'catalog'}">
            <v-icon size="24">mdi-folder-text-outline</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('player.toCatalog') }}</span>
      </v-tooltip>

      <!-- Favorites -->
      <v-tooltip right :attach="$refs.links">
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon large @click="() => toFavorites()">
            <v-icon size="24">mdi-star</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('player.toFavorites') }}</span>
      </v-tooltip>

      <!-- Episodes -->
      <v-tooltip right :attach="$refs.links">
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon large @click="episodes().show()">
            <v-icon size="24">mdi-playlist-play</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('player.toEpisodes') }}</span>
      </v-tooltip>


      <!-- Torrent -->
      <v-tooltip v-if="source.type === 'torrent'" right :attach="$refs.links">
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon large @click="torrent().show()">
            <v-icon size="20">mdi-file-table-box-multiple</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('player.toTorrent') }}</span>
      </v-tooltip>

      <!-- Opening skip button -->
      <v-tooltip v-if="_opening_skip_button" right :attach="$refs.links">
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon large @click="skipOpening">
            <span class="caption font-weight-bold">+{{ _opening_skip_time }}</span>
          </v-btn>
        </template>
        <span>{{ $t('player.openingSeek') }}</span>
      </v-tooltip>


    </template>
  </div>
</template>

<script>

import { mapState } from 'vuex'
import { toFavorites, toRelease, toReleases } from '@utils/router/views'
import screenfull from 'screenfull'
import { resolveReleaseTitle } from '@utils/release/display'

const props = {
  player: {
    type: Object,
    default: null
  },
  release: {
    type: Object,
    default: null
  },
  source: {
    type: Object,
    default: null
  },
  episodes: {
    type: Function,
    default: null
  },
  torrent: {
    type: Function,
    default: null
  },
  upscale: {
    type: Function,
    default: null
  }
}

export default {
  props,
  data () {
    return {
      isMounted: false
    }
  },
  computed: {
    ...mapState('app/settings/player', {
      _opening_skip_time: s => s.opening.skip_time,
      _opening_skip_button: s => s.opening.skip_button,
    }),

    /**
     * Get release poster src
     *
     * @return {string}
     */
    src () {
      return this.$__get(this.release, 'poster')
    },

    /**
     * Get title
     *
     * @return {string}
     */
    title () {
      return resolveReleaseTitle(this.release, this.$locale)
    }

  },
  methods: {
    toRelease (release) {
      screenfull.exit()
      return toRelease(release)
    },
    toReleases () {
      screenfull.exit()
      return toReleases()
    },
    toFavorites () {
      screenfull.exit()
      return toFavorites()
    },

    /**
     * Skip opening
     *
     * @return {void}
     */
    skipOpening () {
      this.$emit('set:time', this.player.currentTime + (this._opening_skip_time || 0))
    }
  },

  mounted () {

    // Set mounted state
    this.isMounted = true

  }
}
</script>
