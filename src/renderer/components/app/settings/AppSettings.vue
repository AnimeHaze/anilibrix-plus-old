<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    right
    fixed
    temporary
    width="400"
    class="settings">

    <!-- System bar offset -->
    <system-bar-placeholder fixed/>

    <!-- Header -->
    <v-toolbar flat class="shrink" color="#363636" :class="{'mt-9': !this.isMacOnFullscreen}">
      <v-toolbar-title class="body-1">{{ $t('settings.title') }}</v-toolbar-title>
      <v-spacer/>
      <v-tooltip left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            small
            text
            min-width="48"
            class="font-weight-bold"
            v-bind="attrs"
            v-on="on"
            @click="toggleLanguage">
            {{ nextLanguageLabel }}
          </v-btn>
        </template>
        <span>{{ languageTooltip }}</span>
      </v-tooltip>
    </v-toolbar>
    <v-divider/>


    <!-- Categories -->
    <component
      v-for="(category, k) in categories"
      class="mb-2"
      :is="category"
      :key="k">
    </component>


    <!-- Credentials -->
    <credentials/>


  </v-navigation-drawer>
</template>

<script>

import Credentials from './components/credentials'
import PlayerSettings from './categories/player'

import SystemSettings from './categories/system'
import ActionsSettings from './categories/actions'
import DevtoolsSettings from './categories/devtools'
import AnilibriaSettings from './categories/app'

import SystemBarPlaceholder from './../systembar/placeholder'

import { AppPlatformMixin } from '@mixins/app'
import { mapActions, mapState } from 'vuex'

export default {
  mixins: [AppPlatformMixin],
  components: {
    Credentials,
    SystemBarPlaceholder
  },
  computed: {
    ...mapState('app', { _drawer: s => s.drawer }),
    ...mapState('app/settings/system', {
      _devtools: s => s.devtools,
      _language: s => s.language
    }),

    /**
     * Get categories components
     *
     * @return Array
     */
    categories () {
      return [
        PlayerSettings,
        SystemSettings,
        ActionsSettings,
        AnilibriaSettings,
        this._devtools ? DevtoolsSettings : null
      ].filter(category => category)
    },

    drawer: {

      /**
       * Get drawer state
       *
       * @return boolean
       */
      get () {
        return !!this._drawer
      },

      /**
       * Set drawer state
       *
       * @param state
       * @return void
       */
      set (state) {
        this._setDrawer(state)
      }
    },

    nextLanguageLabel () {
      return this.$locale === 'ru' ? 'EN' : 'RU'
    },

    languageTooltip () {
      return this.$locale === 'ru'
        ? this.$t('language.switchToEnglish')
        : this.$t('language.switchToRussian')
    }

  },

  methods: {
    ...mapActions('app', { _setDrawer: 'setDrawer' }),
    ...mapActions('app/settings/system', { _setLanguage: 'setLanguage' }),

    toggleLanguage () {
      this._setLanguage(this.$locale === 'ru' ? 'en' : 'ru')
    }
  }

}
</script>

<style>
/*
  See: https://github.com/buefy/buefy/issues/2096
  See: https://stackoverflow.com/questions/14677490/blurry-text-after-using-css-transform-scale-in-chrome
*/
.v-navigation-drawer__content {
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>

<style lang="scss" scoped>
.settings {

  ::v-deep {
    .v-navigation-drawer__content {
      overflow-y: scroll;
    }
  }


  ::-webkit-scrollbar-thumb {
    background-color: black;
  }

  ::-webkit-scrollbar {
    background-color: transparent;
  }
}

</style>
