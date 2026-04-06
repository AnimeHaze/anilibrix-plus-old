<template>
  <v-dialog
    v-model="visible"
    persistent
    max-width="650"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ $t('update.title') }}
      </v-card-title>

      <v-card-text>
        <pre style="white-space: pre-wrap; font-family: inherit;">{{ notes }}</pre>
      </v-card-text>

      <v-card-actions>
        <v-btn
          color="red darken-1"
          text
          v-on:click="visible = false"
        >
          {{ $t('common.close') }}
        </v-btn>

        <v-btn @click="openLink(repository.url)">
          {{ $t('update.github') }}
        </v-btn>

        <v-btn @click="openLink('https://t.me/anilibrix_plus')" color="blue darken-1">
          {{ $t('update.telegram') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { repository } from '@package'
import { shell } from "electron";

export default {
  props: {
    notes: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      repository,
      visible: false,
      loading: false
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
    },

    openLink (url) {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url)
      }
    }
  }

}
</script>
