<template>
  <v-layout class="release__data">
    <loader v-if="loading"/>
    <div v-else :style="{maxWidth: '100%'}">

      <!-- Release Data -->
      <div class="allow-select display-2 font-weight-black text-truncate">{{ title }}</div>
      <div class="allow-select subtitle-1">{{ subtitle }}</div>
      <div class="body-2">{{ genres }}</div>

      <!-- Episode -->
      <!-- Favorite action -->
      <v-layout class="my-3">
        <favorite v-bind="{release}" class="mr-1"/>
        <v-chip v-text="episode.title" label color="secondary" class="font-weight-black mr-1" :style="{height: '36px'}"/>
        <v-chip v-text="type" label color="grey darken-4" :style="{height: '36px'}"/>
      </v-layout>

      <!-- Description -->
      <v-clamp class="allow-select my-3 grey--text lighten-1" max-height="75px">{{ description }}</v-clamp>

    </div>
  </v-layout>
</template>

<script>

import VClamp from 'vue-clamp'
import Loader from './components/loader'
import Favorite from '@components/release/favorite'
import {
  resolveReleaseDescription,
  resolveReleaseGenresText,
  resolveReleaseSubtitle,
  resolveReleaseTitle,
  resolveReleaseType
} from '@utils/release/display'

const props = {
  release: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: true
  },
  episode: {
    type: Object,
    default: null
  }
}

export default {
  props,
  components: {
    VClamp,
    Loader,
    Favorite,
  },
  computed: {

    /**
     * Get release title
     *
     * @return {string|null}
     */
    title () {
      return resolveReleaseTitle(this.release, this.$locale)
    },

    /**
     * Get subtitle
     *
     * @return {string|null}
     */
    subtitle () {
      return resolveReleaseSubtitle(this.release, this.$locale)
    },

    /**
     * Get release genres
     *
     * @return {string|null}
     */
    genres () {
      return resolveReleaseGenresText(this.release, this.$locale)
    },

    /**
     * Get description
     *
     * @return {string|null}
     */
    description () {
      return resolveReleaseDescription(this.release, this.$locale)
    },

    /**
    * Get release type
    *
    * @return {*}
    */
    type () {
      return resolveReleaseType(this.release, this.$locale)
    }

  }
}

</script>

<style lang="scss" scoped>

.release {
  &__data {
    max-height: 230px;
    user-select: none;
  }
}

</style>
