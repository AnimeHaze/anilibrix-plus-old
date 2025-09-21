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
            Начать смотреть
          </v-btn>

          <v-btn
            label
            color="secondary"
            v-if="lastWatchedEpisode.ep && lastWatchedEpisode.next"
            @click="toVideo(release, lastWatchedEpisode.next)"
            class="mx-4 my-2 font-weight-black"
            style="width: 230px;"
          >
            Смотреть с {{ lastWatchedEpisode.next.id }} серии
          </v-btn>
        </div>

        <!-- Title -->
        <!-- Original Name + Genres -->
        <!-- Meta -->
        <div>
          <v-card-title v-text="title" class="allow-select display-1 mb-2 font-weight-black" :style="{wordBreak: 'break-word'}"/>
          <v-card-subtitle v-text="original" class="allow-select pb-0"/>
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
        voice: 'Озвучили',
        other: 'Перевод, оформление, субтиты, тайминг',
      }
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
    toVideo
  }
}
</script>
