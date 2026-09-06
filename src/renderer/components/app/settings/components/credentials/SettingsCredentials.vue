<template>
  <v-card flat color="transparent" class="mt-auto py-3 credentials__data">

    <v-card-text class="caption">
      <div class="credentials__top">
        <span>
          {{ $t('settings.credentialsBuild', { version: app.version }) }}
        </span>

<!--        <a-->
<!--          href="#"-->
<!--          @click.prevent="sendAppAboutEvent"-->
<!--        >-->
<!--          {{ $t('settings.about') }}-->
<!--        </a>-->
      </div>

      <div class="credentials__disclaimer">
        {{ $t('settings.credentialsDisclaimer') }}
      </div>

      <div>
        <a href="#" @click.prevent="toggleDevtools">{{ $t('settings.debugTools') }}</a>
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
  }

  &__top {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 6px;
    row-gap: 2px;

    > a {
      &::before {
        content: "-";
        margin-right: 6px;
        text-decoration: none;
      }
    }
  }

  &__disclaimer {
    margin-top: 6px;
  }
}

@media (max-width: 420px) {
  .credentials {
    &__top {
      flex-direction: column;
      align-items: flex-start;

      > a {
        &::before {
          content: none;
        }
      }
    }
  }
}

</style>
