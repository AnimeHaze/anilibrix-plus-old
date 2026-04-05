<template>
  <v-layout fill-height align-center justify-center>
    <v-row justify="center" align="center">

      <v-col cols="12" sm="3" align-self="center">
        <v-img :transition="false" class="image" contain :src="image"/>
      </v-col>

      <v-col cols="12" sm="6" align-self="center">
        <v-card flat color="transparent">
          <v-card-text class="error-message-container">
            <!-- Success Message -->
            <v-alert
              v-if="message"
              type="error"
              dense
              outlined
              class="mb-4"
              transition="scale-transition"
            >
              <div class="d-flex align-center">
                <span>{{ message }}</span>
              </div>
            </v-alert>

            <!-- Error Message -->
            <v-alert
              v-if="error"
              type="error"
              dense
              outlined
              class="mb-4"
              transition="scale-transition"
            >
              <div class="d-flex align-center">
                <v-icon left>mdi-alert</v-icon>
                <span>{{ error }}</span>
              </div>
            </v-alert>

            <!-- Help Information -->
            <v-card
              outlined
              color="red"
              class="pa-4"
            >
              <div class="text-body-1 mb-2">
                <v-icon small class="mr-2">mdi-help-circle</v-icon>
                <strong>Что произошло?</strong>
              </div>
              <div class="text-caption">
                <p class="mb-2">
                  Возможно, проблема связана с внутренней ошибкой API или ошибкой навигации в приложении.
                </p>
                <p>
                  Если вы видите эту ошибку после нажатия кнопки "Назад" — это известная проблема, которую мы ещё не исправили.
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="mt-3 d-flex justify-space-between">
                <v-btn
                  small
                  text
                  color="primary"
                  to="/"
                >
                  <v-icon left small>mdi-home</v-icon>
                  На главную
                </v-btn>
              </div>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>

    </v-row>
  </v-layout>
</template>

<script>
import LibriaTyan01 from '@assets/images/libria-tyan/LibriaTyan01.svg'
import {toReleases} from "@utils/router/views";

export default {
  props: {
    message: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null
    }
  },
  data () {
    return {
      image: LibriaTyan01,
    }
  },
  computed: {

    /**
     * Get blank message
     *
     * @return {string}
     */
    text () {
      return this.message || 'При загрузке эпизода произошла ошибка'
    }

  },

  methods: {
    /**
     * Go back
     *
     * @return void
     */
    toReleases

  }
}
</script>

<style scoped>
.error-message-container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
