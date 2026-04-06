<template>
  <div>
    <v-dialog
      v-model="visible"
      width="700"
    >
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ $t('dialogs.snapshotsListTitle') }}</span>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :loading="loading"
            fixed-header
            height="300px"
            :headers="headers"
            :items="snapshotsList"
            :items-per-page="10"
            class="elevation-1"
          >
            <template v-slot:top>
              <v-toolbar
                flat
              >
                <v-spacer></v-spacer>
                <v-btn
                  color="error"
                  dark
                  class="mb-2"
                  @click="createSnapshot"
                >
                  {{ $t('dialogs.newSnapshot') }}
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:item="row">
              <tr>
                <td>{{ row.item.id }}</td>
                <td>{{ row.item.date }}</td>
                <td>
                  <v-btn
                    color="success"
                    fab
                    x-small
                    dark
                    @click="restoreSnapshot(row.item.id)"
                  >
                    <v-icon>mdi-restore</v-icon>
                  </v-btn>
                  <v-btn
                    color="secondary"
                    fab
                    x-small
                    dark

                    @click="deleteSnapshot(row.item.id)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="green darken-1"
            text
            @click="visible = false"
          >
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <component
      :is="confirmSnapshotRemove"
      v-on:fetchSnapshots="fetchSnapshots"
      ref="deleteConfirm"></component>

    <component
      :is="confirmCreate"
      v-on:fetchSnapshots="fetchSnapshots"
      ref="createSnapshot"></component>

    <component
      :is="confirmSnapshotRestore"
      v-on:fetchSnapshots="fetchSnapshots"
      ref="restoreConfirm"></component>

  </div>
</template>

<script>
import { mapState } from 'vuex'
import confirmCreate from '@components/app/settings/categories/system/dialogs/confirmCreate.vue'
import confirmSnapshotRemove from '@components/app/settings/categories/system/dialogs/confirmSnapshotRemove.vue'
import confirmSnapshotRestore from '@components/app/settings/categories/system/dialogs/confirmSnapshotRestore.vue'
import { catGirlFetch } from '@utils/fetch'

export default {
  data () {
    return {
      visible: false,
      loading: false,
      headers: [
        {
          text: 'ID',
          align: 'start',
          sortable: false,
          value: 'id',
        },
        {
          text: this.$t('dialogs.createdAt'),
          value: 'date'
        },
        {
          text: this.$t('dialogs.actions'),
          sortable: false,
          value: 'actions'
        },
      ],
      snapshotsList: []
    }
  },
  computed: {
    confirmSnapshotRestore () {
      return confirmSnapshotRestore
    },
    confirmCreate () {
      return confirmCreate
    },
    confirmSnapshotRemove () {
      return confirmSnapshotRemove
    },
    ...mapState('app/account', {
      _session: s => s.session
    }),
  },
  methods: {
    createSnapshot () {
      this.$refs.createSnapshot.showDialog()
    },
    restoreSnapshot (id) {
      this.$refs.restoreConfirm.showDialog(id)
    },
    deleteSnapshot (id) {
      this.$refs.deleteConfirm.showDialog(id)
    },
    fetchSnapshots: async function () {
      this.loading = true
      await catGirlFetch(process.env.EXT_API_SERVER + '/snapshot', {
        headers: {
          'x-session': this._session
        }
      })
        .then(x => x.json())
        .then(({
          data,
          success,
          error
        }) => {
          if (!success) throw error
          this.snapshotsList = data.map(({
            id,
            createdAt
          }) => ({
            id,
            date: this.$moment(createdAt).format('DD.MM.YYYY HH:mm:ss'),
            dateRaw: createdAt
          })).sort(function (a, b) {
            return new Date(b.dateRaw) - new Date(a.dateRaw)
          })
        }).catch((error) => this.$toasted.show(error, { type: 'error' }))
      this.loading = false
    },
    hideDialog () {
      this.visible = false
    },
    /**
     * Show dialog
     *
     * @return void
     */
    showDialog () {
      this.visible = true
    }
  }
}
</script>
