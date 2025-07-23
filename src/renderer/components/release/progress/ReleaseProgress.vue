<template>
  <v-progress-linear
    v-bind="{height}"
    :color="isComplete && dense ? 'green darken-4' : color"
    class="release__progress"
    :class="{square}"
    :background-color="dense ? (isComplete ? 'green darken-4' : (isUnseen ? 'grey darken-3' : 'red darken-1')): ''"
    :value="progress"
    :indeterminate="loading">

    <template v-if="!loading && showNumbers" v-slot>
      <div class="release__progress__description caption white--text font-weight-bold px-4 ellipsis-container">
        <!-- Complete All Episodes -->
        <span v-if="isComplete" class="ellipsis-text">
          <span v-if="!dense">Просмотрены все эпизоды {{ total }}</span>
          <span v-else>Все эпизоды {{ total }}</span>
        </span>

        <!-- Not seen episodes -->
        <span v-else-if="isUnseen" class="ellipsis-text">
          <span v-if="!dense">Не просмотрено ни одного эпизода из {{ episodes.length }} {{ total }}</span>
          <span v-else>Ни одного эпизода из {{ episodes.length }} {{ total }}</span>
        </span>

        <!-- Episodes Progress -->
        <span v-else class="ellipsis-text">
          <span v-if="!dense">Просмотрено {{ watched }} из {{ episodes.length }} {{ total }}</span>
          <span v-else>{{ watched }} из {{ episodes.length }} {{ total }}</span>
        </span>

      </div>
    </template>

  </v-progress-linear>
</template>

<script>

import pluralize from '@utils/strings/pluralize'

const props = {
  release: {
    type: Object,
    default: null
  },
  episodes: {
    type: Array,
    default: null
  },
  totalEpisodes: {
    type: String,
    default: ''
  },
  showNumbers: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: 'secondary'
  },
  height: {
    type: [Number, String],
    default: '25'
  },
  dense: {
    type: Boolean,
    default: false
  },
  center: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  square: {
    type: Boolean,
    default: false
  }
}

export default {
  props,
  computed: {
    total () {
      return this.totalEpisodes && this.totalEpisodes !== 'null' ? ' (' + this.totalEpisodes + ')' : ''
    },

    /**
     * Calculate total seen progress
     *
     * @return {*}
     */
    progress () {

      const release_id = this.release.id
      const episodes = (this.episodes || []).map(x => x.id)
      const payload = {
        release_id,
        episodes
      }

      return this.$store.getters['app/watch/getReleaseProgress'](payload)

    },

    /**
     * Get watched episodes
     *
     * @return {*}
     */
    watched () {

      const release_id = this.release.id

      const episodes = (this.episodes || []).map(x => x.id)
      const payload = {
        release_id,
        episodes
      }

      // Get watched episodes
      // Convert to string with suffix
      const watched_episodes = this.$store.getters['app/watch/getWatchedEpisodes'](payload)
      return pluralize(watched_episodes.length, ['эпизод', 'эпизода', 'эпизодов'])

    },

    /**
     * Check if release is fully watched
     *
     * @return {boolean}
     */
    isComplete () {
      return this.progress === 100
    },

    /**
     * Check if release is not seen
     *
     * @return {boolean}
     */
    isUnseen () {
      return this.progress === 0
    }

  }
}
</script>

<style lang="scss" scoped>

.release__progress {
  cursor: default;
  border-radius: 4px !important;
  transition: height 0s;

  &.square {
    border-radius: 0 !important;
  }

  &__description {
    left: 0;
    position: absolute;
    width: 100%;
    overflow: hidden;

    .ellipsis-text {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

</style>
