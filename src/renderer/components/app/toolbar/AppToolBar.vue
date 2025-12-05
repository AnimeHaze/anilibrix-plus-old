<template>
  <v-app-bar v-if="!hideToolbar" flat color="transparent" class="toolbar shrink">
    <!-- Navigation buttons -->
    <div class="d-flex align-center mr-4">
      <v-btn icon small class="mr-1" @click="goback" :disabled="!canGoBack">
        <v-icon size="20">mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn icon small @click="goforward" :disabled="!canGoForward">
        <v-icon size="20">mdi-arrow-right</v-icon>
      </v-btn>
    </div>

    <!-- Releases -->
    <v-btn small text exact class="mr-1" height="38" :to="{name: 'releases'}" active-class="primary--text">
      <v-icon size="18" class="mr-2">mdi-view-column</v-icon>
      <span>Релизы</span>
    </v-btn>

    <!-- Catalog-->
    <v-btn small text exact class="mr-1" height="38" :to="{name: 'catalog'}" active-class="primary--text">
      <v-icon size="18" class="mr-2">mdi-folder-text-outline</v-icon>
      <span>Каталог</span>
    </v-btn>

    <!-- Favorite -->
    <v-btn small text exact class="mr-4" height="38" :to="{name: 'favorites'}" active-class="primary--text">
      <v-icon size="18" class="mr-2">mdi-star</v-icon>
      <span>Избранное</span>
    </v-btn>

    <!-- Search-->
    <search class="mr-4"/>

    <!-- Right side buttons -->
    <div class="d-flex align-center ml-auto">
      <!-- Random release -->
      <div class="mr-2">
        <v-btn :disabled="diceIntervalId !== null" icon id="toolbar__rand" v-on:click="randomRelease">
          <v-icon>mdi-dice-{{ dice }}</v-icon>
        </v-btn>
        <v-tooltip left activator="#toolbar__rand">Случайный релиз</v-tooltip>
      </div>

      <update/>
      <notifications/>
      <settings/>
      <account/>
    </div>
  </v-app-bar>
</template>

<script>

import Update from './components/update'
import Search from './components/search'
import Account from './components/account'
import Settings from './components/settings'
import Notifications from './components/notifications'
import { invokeRand } from '@main/handlers/app/app-handlers'
import {showAppError} from "@main/handlers/notifications/notifications-handler";

export default {
  components: {
    Update,
    Search,
    Account,
    Settings,
    Notifications
  },
  methods: {
    goback() {
      this.$router.go(-1)
    },
    goforward() {
      this.$router.go(1)
    },
    async randomRelease() {
      this.diceIntervalId = setInterval(() => {
        if (this.direction) {
          this.dice--
        } else {
          this.dice++
        }

        if (this.dice === 6) {
          this.direction = 1
        } else if (this.dice === 0) {
          this.direction = 0
        }
      }, 200)
      try {
        const {id, name} = await invokeRand()
        if (id === -1) {
          this.$toasted.show('Функция не поддерживается выбранным API сервером', {type: 'error'})
          return
        }
        await this.$router.push('/release/' + id + '/' + name)
        clearInterval(this.diceIntervalId)
        this.dice = 5
        this.diceIntervalId = null
      } catch (e) {
        clearInterval(this.diceIntervalId)
        this.dice = 5
        this.diceIntervalId = null
        console.log(e)
        showAppError(e)
      }
    }
  },
  data () {
    return {
      dice: 5,
      diceIntervalId: null,
      direction: 0
    }
  },
  computed: {
    canGoBack() {
      return window.history.state?.back !== null
    },
    canGoForward() {
      return window.history.state?.forward !== null
    },
    /**
     * Check if should hide toolbar
     *
     * @return {*|boolean}
     */
    hideToolbar () {
      return this.$__get(this.$route, 'meta.layout.hide_toolbar') || false
    }

  }
}

</script>

<style lang="scss" scoped>

.toolbar {
  ::v-deep {
    .v-toolbar__content {
      padding-left: 0;
      padding-right: 0;
    }
  }
}

</style>
