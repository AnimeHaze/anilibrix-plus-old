<template>
  <v-slider
    hide-details
    ref="slider"
    color="secondary"
    class="slider__timeline"
    :min="0"
    :max="is_ready ? duration : 100"
    :value="is_ready ? time : 0"
    :disabled="is_ready === false"
    @change="player.currentTime = $event"
    @mousedown="is_seeking = true"
    @mouseup="is_seeking = false">

    <template v-slot:thumb-label="{ value }">
      <div class="time font-weight-bold">{{ humanTime(value) }}</div>
    </template>

  </v-slider>
</template>

<script>

import humanTime from '@utils/strings/human-time'
import { AppKeyboardHandlerMixin } from '@mixins/app'

const props = {
  player: {
    type: Object,
    default: null
  }
}

export default {
  props,
  mixins: [AppKeyboardHandlerMixin],
  data () {
    return {
      time: 0,
      is_ready: false,
      duration: 0,
      is_seeking: false,
      primaryMouseButtonDown: false
    }
  },

  methods: {

    /**
     * Get human time
     *
     * @param secs
     * @return {number}
     */
    humanTime,
    setPrimaryButtonState (e) {
      const flags = e.buttons !== undefined ? e.buttons : e.which;
      this.primaryMouseButtonDown = (flags & 1) === 1;
      if (this.is_seeking && this.primaryMouseButtonDown === false) {
        this.is_seeking = false
      }
    }
  },

  beforeDestroy() {
    document.removeEventListener("mousedown", this.setPrimaryButtonState);
    document.removeEventListener("mousemove", this.setPrimaryButtonState);
    document.removeEventListener("mouseup", this.setPrimaryButtonState);
  },

  mounted () {
    // This code is really shit and stupid, but it works. I’m not sure how to fix it properly,
    // as patching packages doesn’t seem to be effective. Maybe the patch requires more lines to work.
    // Related to https://github.com/vuetifyjs/vuetify/pull/11594/commits/63e54c293f286450d646b1c1c112209ed6ee2f8a#diff-a3576734fec1ba8095213b545b818c22f9e0b32fd74a1dcd1d22197ab22336c7
    // Fixes https://github.com/AnimeHaze/anilibrix-plus/issues/42
    // Also with last version of Vuetify is not needed, but last version contains bug, see https://github.com/AnimeHaze/anilibrix-plus/issues/22
    document.addEventListener("mousedown", this.setPrimaryButtonState);
    document.addEventListener("mousemove", this.setPrimaryButtonState);
    document.addEventListener("mouseup", this.setPrimaryButtonState);

    // Get time
    // Check that user is not seeking
    this.player.on('timeupdate', () => {
      if (this.is_seeking === false) {
        this.time = this.player.currentTime
      }
    })

    // Get duration on initial start
    this.player.on('progress', () => this.duration = this.player.duration)

    // Set loaded metadata ready state
    // Start playing on seeking event
    this.player.on('playing', () => this.is_ready = true)
    this.player.on('seeking', () => this.player.play())

  },

}
</script>

<style scoped lang="scss">

.slider {
  &__timeline {
    cursor: pointer;
    position: relative;

    ::v-deep {
      .v-slider--horizontal {
        margin-left: 0;
        margin-right: 0;
      }
    }
  }

}

::v-deep .v-slider {
  &__thumb {
    &-label {
      height: auto !important;
      width: 56px !important;
      transform: none !important;
      margin-left: -28px;
      margin-bottom: 15px;
      border-radius: 4px;
      padding: .3rem .6rem;
      background-color: red !important;

      .time {
        font-size: .75rem;
      }

      > div {
        transform: none;
      }
    }
  }
}


</style>
