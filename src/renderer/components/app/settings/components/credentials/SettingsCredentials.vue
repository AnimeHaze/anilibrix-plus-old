<template>
  <v-card flat color="transparent" class="mt-auto py-3 credentials__data">

    <v-card-text class="caption">
      <v-layout class="with-divider">
        <div>Not an official build {{ app.version }}</div>
        <a href="#" @click.prevent="sendAppAboutEvent">About the application</a>
      </v-layout>
      <div>All material in the application is presented solely for home viewing.</div>
      <div>
        <a href="#" @click.prevent="toggleDevtools">Debugging tools</a>
      </div>
    </v-card-text>

  </v-card>
</template>

<script>

import app from '@/../package'
import { mapActions } from 'vuex'
import { sendAppAboutEvent } from '@main/handlers/app/app-handlers'

export default {
  computed: {

    /**
     * Get application data
     *
     * @return object
     */
    app () {
      return {
        version: app.version
      }
    },

    /**
     * Anilibria link
     *
     * @return {string}
     */
    anilibria () {
      return app.meta.links.anilibria
    },

    /**
     * Github link
     *
     * @return {string}
     */
    github () {
      return app.repository.url
    }
  },

  methods: {
    ...mapActions('app/settings/system', { _toggleDevtools: 'toggleDevtools' }),

    /**
     * Show about panel
     *
     * @return void
     */
    sendAppAboutEvent,

    /**
     * Toggle devtools
     *
     * @return void
     */
    toggleDevtools () {
      this._toggleDevtools()
    }

  }
}
</script>


<style lang="scss" scoped>

.credentials {
  &__data {

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .with-divider {
      > * {
        &::after {
          content: "-";
          display: inline-block;
          padding: 0 3px;
          text-decoration: none;
        }

        &:last-child {
          &::after {
            content: none;
          }
        }
      }
    }
  }
}

</style>

