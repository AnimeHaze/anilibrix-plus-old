<template>
  <v-hover v-slot:default="{ hover }">
    <v-lazy :options="{threshold: .5}">
      <v-card class="grey darken-3 release-card" @click="$emit('click')">
        <v-img aspect-ratio=".7" :src="poster">

          <v-fade-transition mode="out-in">
            <div v-if="hover" class="d-flex flex-column release-card--reveal grey darken-4 pa-4" style="padding-bottom: 25px !important">
              <!-- Title -->
              <div class="body-2 font-weight-bold mb-2">{{ title }}</div>

              <!-- Description -->
              <div class="flex-grow-1 overflow-hidden">
                <v-clamp autoresize class="caption" max-height="100%" :style="{hyphens: 'auto'}">
                  {{ description }}
                </v-clamp>
              </div>

              <!-- Status -->
              <div v-if="status || rating" class="d-flex justify-space-between mt-auto py-2">
                <v-chip
                  v-if="rating"
                  color="secondary"
                  text-color="white"
                  small
                 >
                  {{ rating }}
                </v-chip>

                <v-chip
                  color="gray"
                  text-color="white"
                  small
                  v-if="status"
                 >
                  {{ status }}
                </v-chip>
              </div>
            </div>
          </v-fade-transition>

          <!-- Release Progress -->
          <release-progress
            v-bind="{ release, episodes, totalEpisodes }"
            dense
            center
            square
            class="release-card--progress"
            height="25"/>
        </v-img>
      </v-card>
    </v-lazy>
  </v-hover>
</template>

<script>

import VClamp from 'vue-clamp'
import ReleaseProgress from '@components/release/progress'
import {catGirlFetch} from "../../../../utils/fetch";

const props = {
  release: {
    type: Object,
    default: null
  },
  showSeen: {
    type: Boolean,
    default: false
  }
}

export default {
  props,
  components: {
    VClamp,
    ReleaseProgress
  },
  async mounted() {
    window._epscache = window._epscache || new Map();
  
    const cachedData = window._epscache.get(this.release.code);
    if (cachedData?.isValid) {
      this.totalEpisodes = String(cachedData.data.episodes_total);
      return;
    }
  
    try {
      const endpoints = [
        'https://aniliberty.top/api/v1/anime/releases',
        'https://anilibria.top/api/v1/anime/releases',
        'https://www.anilibria.top/api/v1/anime/releases'
      ];
  
      const response = await this.fetchFromFirstAvailableEndpoint(endpoints, this.release.code);
      
      if (response) {
        const data = await response.json();

        window._epscache.set(this.release.code, {
          data,
          isValid: true
        });
        this.totalEpisodes = String(data.episodes_total);
      }
    } catch (error) {
      console.error('Failed to load episodes data:', error);
    }
    },
  methods: {
    async fetchFromFirstAvailableEndpoint(endpoints, releaseCode) {
      for (const endpoint of endpoints) {
        try {
          const url = `${endpoint}/${releaseCode}`;
          const response = await fetch(url);
          
          if (response.ok) {
            return response;
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    }
  },
  data () {
    return { totalEpisodes: '' }
  },
  computed: {

    /**
     * Get release poster image
     *
     * @return {string}
     */
    poster () {
      return this.$__get(this.release, 'poster') || ''
    },

    /**
     * Get release title
     *
     * @return {string}
     */
    title () {
      return this.$__get(this.release, 'names.ru')
    },

    /**
     * Get episodes
     *
     * @return {array}
     */
    episodes () {
      return this.$__get(this.release, 'episodes') || []
    },

    /**
     * Get description
     *
     * @return {string}
     */
    description () {
      return this.$__get(this.release, 'description')
    },

    /**
     * Get release status
     *
     * @return {string}
     */
    status () {
      return this.$__get(this.release, 'status')
    },

    /**
     * Get release rating
     *
     * @return {string}
     */
    rating () {
      return this.$__get(this.release, 'favoriteRating.text')
    },
  }

}
</script>

<style scoped lang="scss">

.release-card {
  position: relative;
  display: flex;

  &--reveal {
    bottom: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  &--progress {
    bottom: 0;
    position: absolute;
    border-radius: 0;
  }
}

</style>
