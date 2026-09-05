<template>
  <v-layout align-center justify-end ref="controls">
    <template v-if="is_mounted">

      <!-- Volume -->
      <volume v-bind="{player}" class="mr-2" @change="$emit('set:volume', $event)"/>

      <!-- Quality -->
      <quality v-if="source" v-bind="{episode, source}" :attach="$refs.controls" @click="$emit('set:source', $event)"/>

      <!-- Speed -->
      <speed v-bind="{player}" :attach="$refs.controls" @click="$emit('set:speed', $event)"/>

      <!-- PIP -->
      <v-btn icon large @click="$emit('toggle:pip')">
        <v-icon size="22">mdi-picture-in-picture-bottom-right</v-icon>
      </v-btn>

      <!-- Always On Top -->
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            large
            v-bind="attrs"
            :color="isAlwaysOnTop ? 'primary' : undefined"
            v-on="on"
            @click="$emit('toggle:always-on-top')">
            <v-icon size="22">{{ isAlwaysOnTop ? 'mdi-pin' : 'mdi-pin-outline' }}</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('player.alwaysOnTop') }}</span>
      </v-tooltip>

      <!-- Fullscreen -->
      <v-btn icon large @click="$emit('toggle:fullscreen')">
        <v-icon size="28">mdi-fullscreen</v-icon>
      </v-btn>

    </template>
  </v-layout>
</template>

<script>

import Speed from './components/speed'
import Volume from './components/volume'
import Quality from './components/quality'

const props = {
  player: {
    type: Object,
    default: null
  },
  source: {
    type: Object,
    default: null
  },
  episode: {
    type: Object,
    default: null
  },
  isAlwaysOnTop: {
    type: Boolean,
    default: false
  }
}

export default {
  props,
  components: {
    Speed,
    Volume,
    Quality,
  },

  data () {
    return {
      is_mounted: false
    }
  },

  mounted () {
    this.is_mounted = true
  },

}

</script>
