<template>
  <v-select
    v-bind="{items}"
    outlined
    hide-details
    item-text="title"
    item-value="value"
    :placeholder="$t('catalog.sort')"
    :value="_value"
    @input="_setFilterValue({filter: 'sort', value: $event})">
  </v-select>
</template>

<script>

import { mapActions, mapState } from 'vuex'

export default {
  data () {
    return {
      items: [
        {
          title: this.$t('catalog.sortNew'),
          value: 1
        },
        {
          title: this.$t('catalog.sortPopular'),
          value: 2
        },
      ]
    }
  },
  computed: {
    ...mapState('catalog', { _value: s => s.filters.sort.value })
  },

  methods: {
    ...mapActions('catalog', { _setFilterValue: 'setFilterValue' })
  },

}
</script>
