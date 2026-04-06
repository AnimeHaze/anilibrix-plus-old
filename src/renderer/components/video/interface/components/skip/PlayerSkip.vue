<template>
    <div v-show="visible" :class="{'player': true, 'margin-interface': isInterfaceVisible}">
      <v-btn depressed class="btn">
        <div class="progress" :style="'width: ' + this.progress + '%;'"></div>
        <div class="d-flex justify-center align-center px-4 fill-height full-width" @click="skip">
          {{ $t('player.skip') }}
        </div>
      </v-btn>
      <v-btn class="ml-2" text depressed @click="cancel">{{ $t('player.watch') }}</v-btn>
    </div>
</template>

<script>
const props = {
  player: {
    type: Object,
    default: null
  },
  start: {
    type: Number,
    default: false
  },
  end: {
    type: Number,
    default: false
  },
  isInterfaceVisible: {
    type: Boolean,
    default: false
  },
}

export default {
  props,
  data () {
    return {
      progress: 0,
      timer: null,
      visible: false,
      interval: null,
      is_cancel: false,
    }
  },

  methods: {
    /**
     * Set player time
     *
     * @return void
     */
    setTime (time) {
      this.$emit('set:time', time)
    },

    //
    // /**
    //  * Cancel
    //  *
    //  * @return void
    //  */
    cancel () {
      this.is_cancel = true
      this.visible = false
      this.clearTimerAndInterval()
    },

    //
    // /**
    //  * Skip
    //  *
    //  * @return void
    //  */
    skip() {
      this.cancel()
      this.showToast()
      this.setTime(this.end)
    },

    //
    // /**
    //  * Show Toast
    //  *
    //  * @return void
    //  */
    showToast() {
      this.$toasted.show(this.$t('player.markSkipped'), {
        type: 'info',
        position: 'top-center'
      })
    },

    clearTimerAndInterval() {
      if (this.timer) clearTimeout(this.timer)
      if (this.interval) clearInterval(this.interval)
    },

    show() {
      this.progress = 0
      this.is_cancel = false
      this.visible = true

      this.timer = setTimeout(() => this.skip(), 3000)
      this.interval = setInterval(() => this.progress = this.progress + 5, 150)
    }
  },

  mounted () {
    this.player.on('timeupdate', () => {
      const time = Math.floor(this.player.currentTime)
      if (this.start <= time && time < this.end - 3) {
        if(!this.visible && !this.is_cancel) {
          this.show()
        }
      } else {
        this.visible = false
        this.is_cancel = false
        this.clearTimerAndInterval()
      }
    })
  },

  destroyed () {
    this.clearTimerAndInterval()
  },
}
</script>

<style scoped lang="scss">

.player {
  z-index: 20;
  position: absolute;
  bottom: 0;
  right: 0;
  margin-bottom: 50px;
  margin-right: 1rem;
  display: flex;
  flex-direction: row;
  align-items: end;
  justify-content: right;
  transition: .3s ease;

  &.margin-interface {
    margin-bottom: 225px !important;
  }

  .btn {
    position: relative;
    padding: 0;
    align-items: normal;
    overflow: hidden;

    .progress {
      position: absolute;
      top: 0;
      left: 0;
      background: white;
      height: 100%;
      opacity: .25;
      transition: .3s ease;
    }
  }
}


</style>
