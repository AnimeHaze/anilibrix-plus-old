<script>

import { AppKeyboardHandlerMixin } from '@mixins/app'
import { toVideo } from '@utils/router/views'

const props = {
  player: {
    type: Object,
    default: null
  },
  release: {
    type: Object,
    default: null
  },
  episode: {
    type: Object,
    default: null
  },
}

export default {
  props,
  mixins: [AppKeyboardHandlerMixin],
  render: () => null,

  data () {
    return {
      spaceHoldTimer: null,
      spaceHeld: false,
      spaceLongPress: false,
      spacePreviousSpeed: null
    }
  },

  computed: {
    /**
     * Get episodes
     *
     * @return Array
     */
    episodes () {
      return this.$__get(this.release, 'episodes') || []
    },

    /**
     * Get next episode
     *
     * @return Object|null
     */
    next () {
      return this.episodes
        .find(episode => episode.id === (this.$__get(this.episode, 'id')) + 1) || null
    },

    /**
     * Get previous episode
     *
     * @return {*}
     */
    previous () {
      return this.episodes
        .find(episode => episode.id === (this.$__get(this.episode, 'id') || -1) - 1) || null
    },
  },

  mounted () {
    window.addEventListener('keydown', this.handleSpaceKeyDown)
    window.addEventListener('keyup', this.handleSpaceKeyUp)
    window.addEventListener('blur', this.handleSpaceKeyUp)
  },

  beforeDestroy () {
    window.removeEventListener('keydown', this.handleSpaceKeyDown)
    window.removeEventListener('keyup', this.handleSpaceKeyUp)
    window.removeEventListener('blur', this.handleSpaceKeyUp)

    this.clearSpaceHold()
  },

  methods: {

    /**
     * Handle Space keydown independently from AppKeyboardHandlerMixin.
     *
     * Short press  -> play/pause
     * Long press   -> 2x speed
     */
    handleSpaceKeyDown (e) {
      if (e.code !== 'Space') return
      if (e.repeat || this.spaceHeld) return

      e.preventDefault()

      this.spaceHeld = true
      this.spaceLongPress = false
      this.spacePreviousSpeed = this.player.speed

      this.spaceHoldTimer = setTimeout(() => {
        if (!this.spaceHeld) return

        this.spaceLongPress = true
        this.$emit('set:speed', 2)
      }, 300)
    },

    /**
     * Handle Space keyup.
     *
     * Short press -> play/pause
     * Long press  -> restore previous speed
     */
    handleSpaceKeyUp (e) {
      if (e && e.code !== 'Space' && e.type !== 'blur') return
      if (!this.spaceHeld) return

      const wasLongPress = this.spaceLongPress
      const previousSpeed = this.spacePreviousSpeed

      this.clearSpaceHold()

      if (wasLongPress) {
        this.$emit('set:speed', previousSpeed)
      } else {
        this.$emit('toggle:play')
      }
    },

    /**
     * Clear Space state.
     */
    clearSpaceHold () {
      if (this.spaceHoldTimer !== null) {
        clearTimeout(this.spaceHoldTimer)
        this.spaceHoldTimer = null
      }

      this.spaceHeld = false
      this.spaceLongPress = false
      this.spacePreviousSpeed = null
    },

    /**
     * Handler keyboard events
     *
     * @param e
     * @return {void}
     */
    handleKeyboardEvents: function (e) {
      if (e.code === 'VolumeMute') this.player.volume = 0

      // State
      if (e.code === 'MediaPlayPause') this.$emit('toggle:play') // Space -> play
      if (e.code === 'KeyF') this.$emit('toggle:fullscreen') // F -> fullscreen

      // Seek
      if (e.which === 39) this.forward() // right arrow -> forward
      if (e.which === 37) this.rewind() // left arrow -> rewind
      if (e.code === 'MediaTrackNext') toVideo(this.release, this.next, {fromStart: true})
      if (e.code === 'MediaTrackPrevious') toVideo(this.release, this.previous, {fromStart: true})

      // Volume
      if (e.which === 38 || e.code === 'VolumeUp') {
        if (this.player.volume >= 0.95) {
          this.$emit('set:volume', 1)
        } else {
          const newVolume = this.player.volume + 0.05
          this.$emit('set:volume', newVolume)
        }
      } // up arrow -> inc vol

      if (e.which === 40 || e.code === 'VolumeDown') {
        if (this.player.volume <= 0.05) {
          this.$emit('set:volume', 0)
        } else {
          const newVolume = this.player.volume - 0.05
          this.$emit('set:volume', newVolume)
        }
      } // down arrow -> dec vol

      // Speed
      if (e.which === 190 && e.shiftKey) this.setSpeed(0.25) // shift + > -> add speed
      if (e.which === 188 && e.shiftKey) this.setSpeed(-0.25) // shift + < -> reduce speed

    },

    /**
     * Forward player
     * Check max duration at the end
     *
     * @return void
     */
    forward () {
      const current_time = this.player.currentTime
      const time = current_time + 10 >= this.player.duration ? this.player.duration - .1 : current_time + 10

      this.$emit('set:time', time)
    },

    /**
     * Rewind player
     *
     * @return void
     */
    rewind () {
      const current_time = this.player.currentTime
      const time = current_time - 10 < 0 ? 0 : current_time - 10

      this.$emit('set:time', time)
    },

    /**
     * Set speed
     *
     * @param shift
     */
    setSpeed (shift) {

      const player_speed = this.player.speed
      const updated_speed = player_speed + shift

      if (updated_speed >= 0.5 && updated_speed <= 2) {
        this.$emit('set:speed', updated_speed)
      }
    }

  }

}
</script>
