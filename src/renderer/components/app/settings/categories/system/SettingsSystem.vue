<template>
  <div ref="settings">
    <div class="pa-4 caption grey--text">
      <div class="body-1">{{ $t('settings.systemTitle') }}</div>
      <div>{{ $t('settings.systemDescription') }}</div>
    </div>

    <!-- Appbar inverse -->
    <template v-if="!this.isMac">
      <v-card class="mt-2">
        <v-list-item dense @click="_setAppbarRight(!_appbar_right)">
          <v-list-item-icon class="mr-3 my-auto">
            <v-icon>mdi-window-maximize</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('settings.moveWindowButtons') }}
            </v-list-item-title>
          </v-list-item-content>
          <v-list-item-action class="mr-2 my-auto">
            <v-switch :input-value="_appbar_right" @change="_setAppbarRight"/>
          </v-list-item-action>
        </v-list-item>
        <v-card-text class="pt-2">
          <div class="caption">
            {{ $t('settings.moveWindowButtonsHint') }}
          </div>
        </v-card-text>
      </v-card>
    </template>

    <!-- Network -->
    <v-card class="mt-2">
      <v-list dense>
        <v-list-item @click="network">
          <v-list-item-icon class="mr-3 my-auto">
            <v-icon>mdi-network</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ $t('settings.network') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Discord Rich Presence -->
    <v-card class="mt-2">
      <v-list-item dense @click="_setDRPC(!_drpc_enabled)">
        <v-list-item-icon class="mr-3 my-auto">
          <v-icon>mdi-discord</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Discord Rich Presence</v-list-item-title>
        </v-list-item-content>
        <v-list-item-action class="mr-2 my-auto">
          <v-switch :input-value="_drpc_enabled" @change="_setDRPC"/>
        </v-list-item-action>
      </v-list-item>
      <v-card-text class="pt-2 caption">
        {{ $t('settings.richPresenceHint') }}
      </v-card-text>
    </v-card>

    <!-- Auto update -->
    <v-card class="mt-2">
      <v-list-item dense @click="_setUpdates(!_updates_enabled)">
        <v-list-item-icon class="mr-3 my-auto">
          <v-icon>mdi-update</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('settings.autoUpdates') }}</v-list-item-title>
        </v-list-item-content>
        <v-list-item-action class="mr-2 my-auto">
          <v-switch :input-value="_updates_enabled" @change="_setUpdates"/>
        </v-list-item-action>
      </v-list-item>
      <v-card-text class="pt-2 caption">
        {{ $t('settings.autoUpdatesHint') }}
      </v-card-text>
    </v-card>

    <!-- Update Timeouts -->
    <v-card class="mt-2">
      <v-card-text class="pb-2">
        <div class="caption">
          {{ $t('settings.updatesTimeoutHint') }}
        </div>
      </v-card-text>
      <v-card-text>
        <v-text-field
          outlined
          hide-details
          class="mb-2"
          type="number"
          :label="$t('settings.updatesTimeoutLabel')"
          :suffix="$t('common.minutesShort')"
          :value="_updates_timeout"
          @input="_setUpdatesTimeout($event ? parseInt($event) : 1)">
          <template v-slot:prepend-inner>
            <v-icon>mdi-clock-outline</v-icon>
          </template>
        </v-text-field>
      </v-card-text>
    </v-card>

    <!-- Snapshots -->
    <template v-if="_isAuthorized">
      <div class="pa-4 caption grey--text">
        <div class="body-1">{{ $t('settings.snapshots') }}</div>
        <div>{{ $t('settings.snapshotsHint') }}</div>
      </div>

      <v-card>
        <v-list dense>
          <v-list-item @click="snapshots">
            <v-list-item-icon class="mr-3 my-auto">
              <v-icon>mdi-camera</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ $t('settings.snapshotsList') }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
    </template>

    <template v-if="isMounted">
      <component
        :is="Confirm"
        ref="confirm"
        v-on:openSnapshots="showSnapshotsList"/>

      <component
        :is="snapshotsList"
        ref="snapshotsList"></component>

      <component
        :is="networkSettings"
        ref="network"></component>
    </template>
  </div>
</template>

<script>

import { mapActions, mapGetters, mapState } from 'vuex'
import Confirm from '@components/app/settings/categories/system/dialogs/confirm.vue'
import snapshotsList from '@components/app/settings/categories/system/dialogs/snapshotsList.vue'
import { AppPlatformMixin } from '@mixins/app'
import networkSettings from "@components/app/settings/categories/system/dialogs/NetworkSettings.vue";

export default {
  mixins: [AppPlatformMixin],
  data () {
    return {
      isMounted: false,
      Confirm,
      snapshotsList,
      searchQuery: ''
    }
  },

  computed: {
    networkSettings() {
      return networkSettings
    },
    ...mapGetters('app/account', { _isAuthorized: 'isAuthorized' }),
    ...mapState('app/settings/system', {
      _updates_enabled: s => s.updates.enabled,
      _updates_timeout: s => s.updates.timeout,
      _appbar_right: s => s.appbar_right,
      _drpc_enabled: s => s.drpc_enabled
    }),
  },

  methods: {
    showSnapshotsList: function () {
      this.$refs.confirm.hideDialog()
      this.$refs.snapshotsList.showDialog()
      this.$refs.snapshotsList.fetchSnapshots()
    },
    snapshots: function () {
      this.$refs.confirm.showDialog()
    },
    network: function () {
      this.$refs.network.showDialog()
    },
    ...mapActions('app/settings/system', {
      _setAds: 'setAds',
      _setUpdates: 'setUpdates',
      _setUpdatesTimeout: 'setUpdatesTimeout',
      _setAppbarRight: 'setAppbarRight',
      _setDRPC: 'setDRPC'
    })
  },

  mounted () {
    this.isMounted = true
  }
}
</script>

<style scoped>
.my-auto {
  margin-top: auto !important;
  margin-bottom: auto !important;
}
</style>
