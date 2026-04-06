<template>
  <v-dialog
    v-model="visible"
    persistent
    max-width="500"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ $t('dialogs.warning') }}
      </v-card-title>
      <v-card-text>

        <p>
          {{ $t('dialogs.confirmSnapshotConsent') }}
        </p>

        <p class="mt-1">
          <b>{{ $t('dialogs.confirmSnapshotNoPassword') }}</b>
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="green darken-1"
          text
          v-on:click="$emit('openSnapshots')"
        >
          {{ $t('dialogs.confirmAccept') }}
        </v-btn>
        <v-btn
          color="green darken-1"
          text
          v-on:click="visible = false"
        >
          {{ $t('dialogs.confirmDecline') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data () {
    return {
      visible: false,
      loading: false,
    }
  },
  methods: {
    hideDialog () {
      this.visible = false
    },
    /**
     * Show dialog
     *
     * @return void
     */
    showDialog () {
      this.visible = true
    }
  }

}
</script>
