<template>
  <div>

    <!-- Seen -->
    <v-card class="mb-2">
      <v-list-item class="py-2" @click="_setSettingsShowSeen(!_show_seen)">
        <v-list-item-content>
          <v-list-item-title>{{ $t('favorites.watchedReleases') }}</v-list-item-title>
          <v-list-item-subtitle>{{ $t('favorites.watchedReleasesHint') }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-switch :input-value="_show_seen" @click="_setSettingsShowSeen"/>
        </v-list-item-action>
      </v-list-item>
    </v-card>

    <!-- Completed -->
    <v-card class="mb-2">
      <v-list-item class="py-2" @click="_setSettingsShowCompleted(!_show_completed)">
        <v-list-item-content>
          <v-list-item-title>{{ $t('favorites.completedOnly') }}</v-list-item-title>
          <v-list-item-subtitle>{{ $t('favorites.completedOnlyHint') }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-switch :input-value="_show_completed" @click="_setSettingsShowCompleted"/>
        </v-list-item-action>
      </v-list-item>
    </v-card>


    <!-- Sort -->
    <v-card class="mb-2">
      <v-list-item class="py-2">
        <v-list-item-content>
          <v-list-item-title>{{ $t('favorites.sorting') }}</v-list-item-title>
          <v-list-item-subtitle>{{ $t('favorites.sortingHint') }}</v-list-item-subtitle>
          <v-select
            outlined
            hide-details
            class="mt-4"
            item-text="title"
            item-value="value"
            :placeholder="$t('favorites.sorting')"
            :items="sort"
            :value="_sort"
            @input="_setSettingsSort">
          </v-select>
        </v-list-item-content>
      </v-list-item>
    </v-card>


    <!-- Group -->
    <v-card>
      <v-list-item class="py-2">
        <v-list-item-content>
          <v-list-item-title>{{ $t('favorites.grouping') }}</v-list-item-title>
          <v-list-item-subtitle>{{ $t('favorites.groupingHint') }}</v-list-item-subtitle>
          <v-select
            outlined
            hide-details
            class="mt-4"
            item-text="title"
            item-value="value"
            :placeholder="$t('favorites.grouping')"
            :items="group"
            :value="_group"
            @input="_setSettingsGroup">
          </v-select>
        </v-list-item-content>
      </v-list-item>
    </v-card>

  </div>
</template>

<script>

import { mapActions, mapState } from 'vuex'

export default {
  data () {
    return {
      sort: [
        {
          title: this.$t('favorites.sortTitle'),
          value: 'title'
        },
        {
          title: this.$t('favorites.sortPopularity'),
          value: 'rating'
        },
        {
          title: this.$t('favorites.sortFavoriteDate'),
          value: 'original'
        },
        {
          title: this.$t('favorites.sortUpdates'),
          value: 'updates'
        }
      ],
      group: [
        {
          title: this.$t('favorites.noGrouping'),
          value: 'original'
        },
        {
          title: this.$t('favorites.yearsGrouping'),
          value: 'years'
        },
      ]
    }
  },

  computed: {
    ...mapState('favorites', {
      _sort: s => s.settings.sort,
      _group: s => s.settings.group,
      _show_seen: s => s.settings.show_seen,
      _show_completed: s => s.settings.show_completed,
    })
  },

  methods: {

    ...mapActions('favorites', {
      _setSettingsSort: 'setSettingsSort',
      _setSettingsGroup: 'setSettingsGroup',
      _setSettingsShowSeen: 'setSettingsShowSeen',
      _setSettingsShowCompleted: 'setSettingsShowCompleted',
    })

  }

}
</script>
