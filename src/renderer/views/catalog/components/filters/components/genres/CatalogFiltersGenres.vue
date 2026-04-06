<template>
  <v-autocomplete
    chips
    outlined
    multiple
    clearable
    hide-details
    hide-no-data
    deletable-chips
    class="filter"
    :placeholder="$t('catalog.genresPlaceholder')"
    :value="_value"
    :items="_items"
    :loading="_loading"
    @input="_setFilterValue({filter: 'genres', value: $event})">

  </v-autocomplete>
</template>

<script>

import { mapActions, mapState } from 'vuex'

export default {
  computed: {
    ...mapState('catalog', {
      _items: s => s.filters.genres.items,
      _value: s => s.filters.genres.value,
      _loading: s => s.filters.genres.loading,
    })
  },

  methods: {
    ...mapActions('catalog', {
      _setFilterValue: 'setFilterValue',
      _getCatalogGenresFilter: 'getCatalogGenresFilter',
    })
  },

  created () {
    this._getCatalogGenresFilter()
  }
}
</script>

<style lang="scss" scoped>

.filter {
  ::v-deep {
    .v-chip {
      border-radius: 4px;
    }
  }
}

</style>
