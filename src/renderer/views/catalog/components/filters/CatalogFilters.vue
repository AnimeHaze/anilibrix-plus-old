<template>
  <div>
    <template v-for="(filter, k) in filters">
      <v-card :key="k" :class="{'mt-2': k > 0}">
        <v-list-item class="py-2">
          <v-list-item-content>
            <v-list-item-title v-text="filter.title"/>
            <v-list-item-subtitle v-text="filter.subtitle"/>
            <component class="mt-4" :is="filter.is"/>
          </v-list-item-content>
        </v-list-item>
      </v-card>
    </template>
  </div>
</template>

<script>

import Sort from './components/sort'
import Years from './components/years'
import Genres from './components/genres'

export default {
  computed: {

    /**
     * Get filters
     *
     * @return {array}
     */
    filters () {
      return [
        {
          is: Genres,
          title: this.$t('catalog.genres'),
          subtitle: this.$t('catalog.genresSubtitle')
        },
        {
          is: Years,
          title: this.$t('catalog.years'),
          subtitle: this.$t('catalog.yearsSubtitle')
        },
        {
          is: Sort,
          title: this.$t('catalog.sort'),
          subtitle: this.$t('catalog.sortSubtitle')
        },
      ]
    }
  }
}
</script>
