<template>
  <v-autocomplete
    v-bind="{items, loading}"
    solo
    dense
    no-filter
    hide-details
    hide-no-data
    return-object
    ref="search"
    item-value="id"
    :item-text="releaseText"
    class="grey darken-2"
    :placeholder="$t('toolbar.searchPlaceholder')"
    :append-icon="null"
    :search-input.sync="search"
    @blur="_setSearching(false)"
    @focus="_setSearching(true)"
    @input="toRelease">

    <template v-slot:item="{item}">
      <v-list-item-avatar>
        <v-img :transition="false" :src="item.poster"/>
      </v-list-item-avatar>
      <v-list-item-content :style="{maxWidth: $refs.search.$el.clientWidth + 'px'}">
        <v-list-item-title v-text="releaseTitle(item)"/>
        <v-list-item-subtitle v-text="releaseSubtitle(item)"/>
      </v-list-item-content>
    </template>

  </v-autocomplete>
</template>

<script>

import __debounce from 'lodash/debounce'
import { toRelease } from '@utils/router/views'
import { mapActions, mapState } from 'vuex'
import {
  resolveReleaseSubtitle,
  resolveReleaseTitle
} from '@utils/release/display'

export default {
  data () {
    return {
      items: [],
      search: null,
      loading: false,
      visible: false,
    }
  },

  computed: {
    ...mapState('app', { _is_searching: 'is_searching' }),
  },

  methods: {
    ...mapActions('app', { _setSearching: 'setSearching' }),

    releaseText (release) {
      return resolveReleaseTitle(release, this.$locale)
    },

    releaseTitle (release) {
      return resolveReleaseTitle(release, this.$locale)
    },

    releaseSubtitle (release) {
      return resolveReleaseSubtitle(release, this.$locale)
    },

    /**
     * Get releases
     *
     * @param searchQuery
     */
    getReleases: __debounce(async function (searchQuery) {

      // Set loading state
      // Get releases from server
      this.loading = true
      this.items = await this.$store.dispatchPromise('releases/searchReleases', searchQuery)

      // Reset loading
      this.loading = false

    }, 1000),

    /**
     * Open release view
     *
     * @param release
     * @return void
     */
    toRelease (release) {
      if (release) {

        // Reset input
        // Go to release page
        this.$refs.search.setValue(undefined)
        toRelease(release)

        // Reset items
        this.items = []
        this.visible = false
        this._setSearching(false)
      }
    }

  },

  watch: {

    search: {
      handler (search) {
        if (search && search.length >= 3) {

          // Get releases
          this.getReleases(search)

          // Check if metrics is available
          // Hit metrics event
          if (this.$metrika) {
            this.$metrika.hit(`/search?query=${search}`)
          }

        } else {

          // Reset items
          this.items = []
        }
      }

    }
  }
}
</script>
