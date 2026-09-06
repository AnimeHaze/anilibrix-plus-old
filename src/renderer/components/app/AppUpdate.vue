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

        <v-checkbox
          v-model="dontShowForSevenDays"
          :label="$t('update.dontShowForSevenDays')"
          hide-details
          class="mt-4"
        ></v-checkbox>
      </v-card-text>

      <v-card-actions>
        <v-btn
          color="red darken-1"
          text
          v-on:click="closeDialog"
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
      loading: false,
      dontShowForSevenDays: false
    }
  },
  methods: {
    closeDialog () {
      if (this.dontShowForSevenDays) {
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        const expiryDate = Date.now() + sevenDaysInMs;
        localStorage.setItem('updateDialogHiddenUntil', expiryDate.toString());
      }

      this.visible = false;
      this.dontShowForSevenDays = false;
    },

    /**
     * Show dialog
     *
     * @return void
     */
    showDialog () {
      if (this.shouldHideDialog()) {
        return;
      }

      this.visible = true;
    },

    /**
     * Check if dialog should be hidden
     *
     * @return boolean
     */
    shouldHideDialog () {
      const hiddenUntil = localStorage.getItem('updateDialogHiddenUntil');
      if (!hiddenUntil) {
        return false;
      }

      const expiryDate = parseInt(hiddenUntil, 10);
      return Date.now() < expiryDate;
    },

    openLink (url) {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url)
      }
    }
  }

}
</script>
