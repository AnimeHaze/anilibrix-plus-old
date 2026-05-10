<template>
  <div v-if="caption && title" class="d-flex flex-column justify-end">
    <h4 class="pb-1">{{ caption }}</h4>
    <h1>{{ title }}</h1>
  </div>
</template>

<script>
import { resolveEpisodeTitle, resolveReleaseTitle } from '@utils/release/display'

const props = {
  release: {
    type: Object,
    default: null
  },
  episode: {
    type: Object,
    default: null
  }
}

export default {
  props,
  computed: {

    /**
     * Get episode caption
     *
     * @return {*}
     */
    caption () {
      return resolveReleaseTitle(this.release, this.$locale)
    },

    /**
     * Get episode title
     *
     * @return {*}
     */
    title () {
      return resolveEpisodeTitle(this.episode, this.$locale)
    },

  }
}
</script>
