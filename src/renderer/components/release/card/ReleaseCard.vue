<template>
  <v-card flat color="transparent">
    <loader v-if="loading"/>
    <v-layout v-else column>

      <v-layout align-center class="my-4">

        <div style="display: flex; flex-direction: column">
          <img
            class="mx-4 rounded-lg"
            :src="poster"
            style="width: 230px;"
          >

          <v-btn
            label
            color="secondary"
            v-if="!lastWatchedEpisode.ep || (lastWatchedEpisode.ep && !lastWatchedEpisode.next)"
            @click="toVideo(release, lastWatchedEpisode.first)"
            class="mx-4 my-2 font-weight-black"
            style="width: 230px;"
          >
            {{ $t('release.startWatching') }}
          </v-btn>

          <v-btn
            label
            color="secondary"
            v-if="lastWatchedEpisode.ep && lastWatchedEpisode.next"
            @click="toVideo(release, lastWatchedEpisode.next)"
            class="mx-4 my-2 font-weight-black"
            style="width: 230px;"
          >
            {{ $t('release.continueWatching', { episode: lastWatchedEpisode.next.id }) }}
          </v-btn>
        </div>

        <!-- Title -->
        <!-- Original Name + Genres -->
        <!-- Meta -->
        <div>

          <div class="d-flex align-center">
            <v-card-title
              v-text="title"
              class="allow-select display-1 font-weight-black"
              :style="{wordBreak: 'break-word'}"
            />

            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  v-bind="attrs"
                  v-on="on"
                  @click="copyToClipboard(title, 'title')"
                  :class="{ 'copy-animation': copiedIndex === 'title' }"
                >
                  <v-icon small v-if="copiedIndex !== 'title'">mdi-content-copy</v-icon>
                  <v-icon small v-else color="success">mdi-check</v-icon>
                </v-btn>
              </template>
              <span>{{ copiedIndex === 'title' ? $t('release.titleCopiedSuccess') : $t('release.titleCopy') }}</span>
            </v-tooltip>

            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  v-bind="attrs"
                  v-on="on"
                  @click.stop="openLink(title, 'shikimori')"
                >
                  <v-icon small>mdi-open-in-new</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('release.searchShikimori') }}</span>
            </v-tooltip>

            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  v-bind="attrs"
                  v-on="on"
                  @click.stop="openLink(title, 'mal')"
                >
                  <v-icon small>mdi-open-in-new</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('release.searchMAL') }}</span>
            </v-tooltip>
          </div>


          <div class="d-flex align-center">
            <v-card-subtitle v-text="original" class="allow-select"/>

            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  v-bind="attrs"
                  v-on="on"
                  @click="copyToClipboard(original, 'original')"
                  :class="{ 'copy-animation': copiedIndex === 'original' }"
                >
                  <v-icon small v-if="copiedIndex !== 'original'">mdi-content-copy</v-icon>
                  <v-icon small v-else color="success">mdi-check</v-icon>
                </v-btn>
              </template>
              <span>{{ copiedIndex === 'original' ? $t('release.titleCopiedSuccess') : $t('release.titleCopy') }}</span>
            </v-tooltip>

            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  v-bind="attrs"
                  v-on="on"
                  @click.stop="openLink(original, 'shikimori')"
                >
                  <v-icon small>mdi-open-in-new</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('release.searchShikimori') }}</span>
            </v-tooltip>

            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  v-bind="attrs"
                  v-on="on"
                  @click.stop="openLink(original, 'mal')"
                >
                  <v-icon small>mdi-open-in-new</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('release.searchMAL') }}</span>
            </v-tooltip>
          </div>


          <v-card-subtitle v-text="genres" class="allow-select pt-1"/>

          <div style="margin-bottom: -10px;" v-for="(type, prop) in team" :key="prop" class="pl-4" v-if="type.length">
            <span class="subtitle-2" style="color: rgb(184 184 184);">{{ teamProps[prop] }}:</span>
            <v-chip
              v-for="name in type"
              :key="name"
              class="ma-2"
              small
            >
              {{ name }}
            </v-chip>
          </div>

          <v-card-text class="mb-1">
            <favorite v-bind="{release}" color="grey darken-3"/>
            <v-chip v-if="year" v-text="year" label color="grey darken-3" :style="{height: '36px'}"/>
            <v-chip v-if="type" v-text="type" label color="grey darken-3" :style="{height: '36px'}"/>
            <v-chip v-if="status" v-text="status" label color="grey darken-3" :style="{height: '36px'}"/>
          </v-card-text>
        </div>

      </v-layout>

      <!-- Description -->
      <v-card-text v-text="description" class="white--text"/>

    </v-layout>
  </v-card>
</template>

<script>

import Loader from './components/loader'
import Favorite from './../favorite'
import __orderBy from "lodash/orderBy";
import {toVideo} from "@utils/router/views";

const props = {
  loading: {
    type: Boolean,
    default: false
  },
  release: {
    type: Object,
    default: null
  }
}

export default {
  props,
  components: {
    Loader,
    Favorite
  },
  data () {
    return {
      teamProps: {
        voice: this.$t('release.voicedBy'),
        other: this.$t('release.creditsOther'),
      },
      copiedIndex: null,
      copyTimeout: null
    }
  },
  computed: {
    /**
     * Get watch data
     *
     * @return {*}
     */
    lastWatchedEpisode () {
      let lastWatchedEpIndex = null
      const episodes = this.$__get(this.release, 'episodes')
      const ordered = __orderBy(episodes || [], ['id'], [s => s.episodes.order])
      for (const i in ordered) {
        const { isSeen } = this.$store.getters['app/watch/getWatchedEpisode']({
          release_id: this.release.id,
          episode_id: ordered[i].id
        }) || {}

        if (isSeen) {
          lastWatchedEpIndex = i
        }
      }

      return {
        ep: ordered[lastWatchedEpIndex],
        first: ordered[0] || null,
        next: ordered[+lastWatchedEpIndex + 1]
      }
    },

    /**
     * Get title
     *
     * @return {string|null}
     */
    title () {
      return this.$__get(this.release, 'names.ru')
    },

    /**
     * Get original title
     *
     * @return {string|null}
     */
    original () {
      return this.$__get(this.release, 'names.original')
    },

    /**
     * Get release genres
     *
     * @return {string}
     */
    genres () {
      return (this.$__get(this.release, 'genres') || []).join(' | ')
    },

    /**
     * Get year
     *
     * @return {string|number|null}
     */
    year () {
      return this.$__get(this.release, 'year')
    },

    /**
     * Get release type
     *
     * @return {string|null}
     */
    type () {
      return this.$__get(this.release, 'type')
    },

    /**
     * Get release description
     *
     * @return {*}
     */
    description () {
      return this.$__get(this.release, 'description')
    },

    /**
     * Get release poster
     *
     * @return {*}
     */
    poster () {
      return this.$__get(this.release, 'poster')
    },

    /**
     * Get release status
     *
     * @return {*}
     */
    status () {
      return this.$__get(this.release, 'status')
    },
    team () {
      return {
        voice: this.release.voices,
        other: this.release.team?.filter(t => !this.release.voices.includes(t)) || [],
      }
    },
  },
  methods: {
    toVideo,

    async copyToClipboard(text, index) {
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);

        if (this.copyTimeout) {
          clearTimeout(this.copyTimeout);
        }

        this.copiedIndex = index;

        this.copyTimeout = setTimeout(() => {
          this.copiedIndex = null;
        }, 2000);

      } catch (err) {
        console.error(err);
        if (this.$toasted) {
          this.$toasted.error(this.$t('release.copyError') || 'Ошибка копирования');
        }
      }
    },

    openLink(text, platform) {
      if (!text) return;

      let searchUrl = '';

      if (platform === 'shikimori') {
        searchUrl = `https://shikimori.one/animes?search=${encodeURIComponent(text)}`;
      } else if (platform === 'mal') {
        searchUrl = `https://myanimelist.net/anime.php?q=${encodeURIComponent(text)}&cat=anime`;
      }

      window.open(searchUrl, '_blank');
    }
  },
  beforeDestroy() {
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
  }
}
</script>

<style scoped>
.copy-animation {
  animation: copyPulse 0.4s ease-in-out;
}

@keyframes copyPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
