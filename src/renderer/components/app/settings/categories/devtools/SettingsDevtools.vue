<template>
  <div ref="settings">

    <div class="pa-4 caption grey--text">
      <div class="body-1">{{ $t('settings.debugTitle') }}</div>
      <div>{{ $t('settings.debugDescription') }}</div>
    </div>

    <v-card>
      <v-list dense>
        <template v-for="(item, k) in settings">
          <v-divider v-if="k > 0" :key="`d:${k}`"/>
          <v-list-item :key="k" @click="item.action">
            <v-list-item-content>
              <v-list-item-title v-text="item.title" :class="item.classes"/>
            </v-list-item-content>
            <v-list-item-action class="text-right">
              <v-list-item-subtitle v-text="item.value"/>
            </v-list-item-action>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

  </div>
</template>

<script>

// Utils
import { mapActions, mapState } from 'vuex'

// Handlers
import { sendAppDevtoolsMainEvent, sendAppDevtoolsTorrentEvent, } from '@main/handlers/app/app-handlers'

export default {
  computed: {
    ...mapState('releases', { _releases: 'data' }),

    /**
     * Get settings items
     *
     * @return array
     */
    settings () {
      return [
        {
          title: this.$t('settings.appConsole'),
          action: sendAppDevtoolsMainEvent,
        },
        {
          title: this.$t('settings.torrentConsole'),
          action: sendAppDevtoolsTorrentEvent,
        },
        {
          title: this.$t('settings.addNotification'),
          action: () => this._setRelease(this._releases[0])
        },
        {
          title: this.$t('settings.logStore'),
          action: () => console.log(this.$store.state),
        }
      ]
    },
  },

  methods: {
    ...mapActions('notifications', { _setRelease: 'setRelease' }),

  }

}
</script>
