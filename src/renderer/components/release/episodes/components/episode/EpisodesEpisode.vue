<template>
  <v-list-item two-line ref="container" @click="$emit('click')">

    <v-list-item-content>
      <v-list-item-title v-text="title" :title="title"/>
      <v-list-item-subtitle>
        <span class="caption" v-if="time">{{ time }}</span>
        <quality v-bind="{episode}"/>
      </v-list-item-subtitle>
    </v-list-item-content>

    <v-list-item-action>
      <v-layout>

        <!-- Episode Progress -->
        <v-layout align-center justify-center :style="{width: '40px'}">
          <playing v-if="isPlaying"/>
          <watched v-else v-bind="{episode, release}"/>
        </v-layout>

        <!-- Actions -->
        <actions v-bind="{episode, release, container}"/>

      </v-layout>
    </v-list-item-action>

  </v-list-item>
</template>

<script>

import Quality from './components/quality'
import Watched from './components/watched'
import Playing from './components/playing'
import Actions from './components/actions'
import moment from 'moment/moment';
import { resolveEpisodeName } from '@utils/release/display'

const props = {
  release: {
    type: Object,
    default: null
  },
  episode: {
    type: Object,
    default: null,
  },
  isPlaying: {
    type: Boolean,
    default: false,
  }
}

export default {
  props,
  components: {
    Quality,
    Watched,
    Playing,
    Actions,
  },
  data () {
    return {
      container: null
    }
  },

  mounted () {
    this.container = this.$refs.container.$el
  },

  methods: {
    formatTimestamp(time) {
      return moment.unix(time).format('DD.MM.YYYY HH:mm:ss')
    }
  },

  computed: {
    title() {
      const name = resolveEpisodeName(this.episode, this.$locale)
      return this.episode.title + (this.episode.sources.find(x => x.payload.playlist?.includes('/rutube/')) ? ' [RUTUBE] ' : '') + (name ? ' — ' + name : '')
    },

    time() {
      return this.episode.updated_at ? this.formatTimestamp(this.episode.updated_at) : null
    }
  }
}
</script>
