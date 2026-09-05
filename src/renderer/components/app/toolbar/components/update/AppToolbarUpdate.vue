<template>
  <div>
    <v-tooltip left activator="#toolbar__reload">
      <div class="py-1" :style="{ lineHeight: 1 }">
        <div class="font-weight-bold">{{ $t('toolbar.refreshTitle') }}</div>
        <div class="caption">
          {{ $t('toolbar.refreshedAt', { datetime }) }} ({{ timeAgo }})
        </div>
      </div>
    </v-tooltip>

    <v-btn
      icon
      id="toolbar__reload"
      :disabled="_loading"
      @click="() => getReleases()">
      <v-fade-transition mode="out-in">
        <v-progress-circular
          v-if="_loading"
          indeterminate
          size="20"
        />
        <v-icon
          v-else
          :color="hasUpdateError ? 'error' : undefined">
          mdi-refresh
        </v-icon>
      </v-fade-transition>
    </v-btn>
  </div>
</template>

<script>

import { mapActions, mapState } from 'vuex'
import moment from 'moment'

export default {
  computed: {
    ...mapState('releases', {
      _loading: s => s.loading,
      _datetime: s => s.datetime,
      _last_failed_timestamp: s => s.last_failed_timestamp
    }),

    hasUpdateError () {
      return this._last_failed_timestamp > 0
    },

    datetime () {
      return this._datetime
        ? new Date(this._datetime).toLocaleString()
        : null
    },

    timeAgo () {
      return this._datetime ? moment(this._datetime).fromNow() : null
    }
  },

  methods: {
    ...mapActions('releases', ['getReleases'])
  }
}
</script>
