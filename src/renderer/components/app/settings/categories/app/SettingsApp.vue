<template>
  <v-card>
    <v-list dense>
      <template v-for="(item, k) in settings">
        <v-divider v-if="k > 0" :key="`d:${k}`"/>
        <v-list-item :key="k" @click="item.action">
          <v-list-item-content>
            <v-list-item-title v-text="item.title" :class="item.classes"/>
          </v-list-item-content>
          <v-list-item-action class="text-right">
            <v-list-item-subtitle v-text="item.value"/>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
  </v-card>
</template>

<script>

import { meta, repository } from '@package'

export default {
  computed: {

    /**
     * Get settings items
     *
     * @return array
     */
    settings () {
      return [
        {
          title: this.$t('main.anilibria'),
          value: meta.links.anilibria,
          action: () => window.open(meta.links.anilibria, '_blank'),
        },
        {
          title: this.$t('main.donate'),
          value: 'YooMoney, QIWI, PayPal',
          action: () => window.open(meta.links.donate, '_blank'),
        },
        {
          title: this.$t('main.unofficial'),
          action: () => window.open(meta.links.donate, '_blank')
        },
        {
          title: this.$t('main.telegram'),
          value: '@anilibrix',
          action: () => window.open(meta.links.telegram, '_blank')
        },
        {
          title: this.$t('main.sourceCode'),
          value: '/anilibrix',
          action: () => window.open(repository.url, '_blank')
        },
      ]
    },
  }
}

</script>
