<template>
  <v-dialog
    v-model="visible"
    persistent
    max-width="290"
  >
    <v-card>
      <v-card-title className="text-h5">
        ПРЕДУПРЕЖДЕНИЕ
      </v-card-title>
      <v-card-text>
        Вы действительно хотите удалить снапшот?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :loading="loading"
          color="green darken-1"
          text
          v-on:click="deleteSnapshot"
        >
          Да
        </v-btn>
        <v-btn
          :loading="loading"
          color="green darken-1"
          text
          v-on:click="visible = false"
        >
          Отмена
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState } from 'vuex'
import { catGirlFetch } from '@utils/fetch'
export default {
  data () {
    return {
      visible: false,
      loading: false,
      id: null
    }
  },
  computed: {
    ...mapState('app/account', {
      _session: s => s.session
    }),
  },
  methods: {
    deleteSnapshot: async function () {
      this.loading = true
      await catGirlFetch(process.env.EXT_API_SERVER + '/snapshot/' + this.id, {
        method: 'DELETE',
        headers: {
          'x-session': this._session
        }
      })
        .then(x => x.json())
        .then(({ success, error }) => {
          if (success) {
            return this.$emit('fetchSnapshots')
          } else this.$toasted.show(error, { type: 'error' })
        })
        .catch((error) => this.$toasted.show(error, { type: 'error' }))
      this.loading = false
      this.hideDialog()
    },

    hideDialog () {
      this.visible = false
      this.id = null
    },
    /**
     * Show dialog
     *
     * @return void
     */
    showDialog (id) {
      this.visible = true
      this.id = id
    }
  }

}
</script>
