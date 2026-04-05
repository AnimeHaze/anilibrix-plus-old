<template>
  <v-hover v-slot:default="{ hover }">
      <v-card class="grey darken-3 release-card" @click="$emit('click')">
        <v-img :transition="false" aspect-ratio=".7" :src="poster">
          <v-menu
            v-model="showMenu"
            :position-x="x"
            :position-y="y"
            absolute
            offset-y
          >
            <v-list dense class="grey darken-4">
              <v-list-item v-for="(item, k) in actions" :key="item.icon" @click="item.action">

                <!-- Icon -->
                <v-icon class="mr-2">{{ item.icon }}</v-icon>

                <!-- Item -->
                <v-list-item-content>
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item-content>

              </v-list-item>

              <v-list-item @click.stop>
                <v-list-item-content>
                  <v-select
                    v-model="selectedDomain"
                    :items="availableDomains"
                    dense
                    outlined
                    hide-details
                    label="Домен для ссылки"
                    @click.stop
                  ></v-select>
                </v-list-item-content>
              </v-list-item>

              <v-list-item
                v-for="(item, index) in shareLinks"
                :key="index"
                @click="handleShareClick(item)"
              >
                <v-list-item-icon class="mt-4">
                  <v-icon>{{ item.icon }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                  <v-list-item-subtitle v-if="!item.isExternal" class="text-truncate" style="max-width: 200px;">{{ item.link }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn icon small>
                    <v-icon v-if="item.copied" color="success">mdi-check</v-icon>
                    <v-icon v-if="!item.copied && item.isExternal">mdi-open-in-new</v-icon>
                    <v-icon v-if="!item.copied && !item.isExternal">mdi-content-copy</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-fade-transition mode="out-in">

            <div @contextmenu="show" v-if="hover || showMenu" class="d-flex flex-column release-card--reveal grey darken-4 pa-4" style="padding-bottom: 25px !important">
              <!-- Title -->
              <div class="body-2 font-weight-bold mb-2">{{ title }}</div>

              <!-- Description -->
              <div class="flex-grow-1 overflow-hidden">
                <v-clamp autoresize class="caption" max-height="100%" :style="{hyphens: 'auto'}">
                  {{ description }}
                </v-clamp>
              </div>

              <!-- Status -->
              <div v-if="status || rating" class="d-flex justify-space-between mt-auto py-2">
                <v-chip
                  v-if="rating"
                  color="secondary"
                  text-color="white"
                  small
                 >
                  {{ rating }}
                </v-chip>

                <v-chip
                  color="gray"
                  text-color="white"
                  small
                  v-if="status"
                 >
                  {{ status }}
                </v-chip>
              </div>
            </div>
          </v-fade-transition>

          <!-- Release Progress -->
          <release-progress
            v-bind="{ release, episodes, totalEpisodes }"
            :transition="false"
            dense
            center
            square
            class="release-card--progress"
            height="25"/>
        </v-img>
      </v-card>
  </v-hover>
</template>

<script>

import VClamp from 'vue-clamp'
import ReleaseProgress from '@components/release/progress'
import {mapActions} from "vuex";

const props = {
  release: {
    type: Object,
    default: null
  },
  showSeen: {
    type: Boolean,
    default: false
  }
}

export default {
  props,
  components: {
    VClamp,
    ReleaseProgress
  },
  mounted() {
    this.updateShareLinks()
  },
  data () {
    return {
      actions: [
        {
          icon: 'mdi-check',
          title: 'Отметить все серии как просмотренные',
          action: this.setWatched,
        },
        {
          icon: 'mdi-close',
            title: 'Снять все отметки о просмотре',
          action: this.removeWatched,
        }
      ],
      selectedDomain: 'anilibria.tv/release/',
      shareLinks: [
        {
          title: 'Ссылка на релиз',
          icon: 'mdi-link',
          link: '',
          copied: false,
          isExternal: false
        },
        {
          title: 'Поделиться в VK',
          icon: 'mdi-vk',
          link: '',
          copied: false,
          isExternal: true
        },
        {
          title: 'Поделиться в Telegram',
          icon: 'mdi-telegram',
          link: '',
          copied: false,
          isExternal: true
        },
        {
          title: 'Поделиться в Twitter',
          icon: 'mdi-twitter',
          link: '',
          copied: false,
          isExternal: true
        }
      ],
      availableDomains: [
        { text: 'anilibria.tv', value: 'anilibria.tv/release/' },
        { text: 'anilibria.top', value: 'anilibria.top/anime/releases/release/' },
        { text: 'anilibria.wtf', value: 'anilibria.wtf/anime/releases/release/' }
      ],
      showMenu: false,
      x: 0,
      y: 0,
      totalEpisodes: this.release.total_series
    }
  },
  methods: {
    ...mapActions('app/watch', {
      _setWatchedEpisodes: 'setWatchedEpisodes',
      _removeWatchedEpisodes: 'removeWatchedEpisodes'
    }),
    show (e) {
      if (window.__ctxMenuClose) {
        window.__ctxMenuClose()
        window.__ctxMenuClose = null
      }

      e.preventDefault()
      this.showMenu = false
      this.x = e.clientX
      this.y = e.clientY
      this.$nextTick(() => {
        window.__ctxMenuClose = () => {
          this.showMenu = false
        }
        this.showMenu = true
      })
    },
    /**
     * Set watch package data
     *
     * @return {Promise<void>}
     */
    async setWatched () {
      this.loading = true

      const release_id = this.release.id
      const episodes = this.release.episodes || []
      const payload = {
        release_id,
        episodes
      }

      await this._setWatchedEpisodes(payload)

      this.loading = false
    },

    /**
     * Remove watch package data
     *
     * @return {Promise<void>}
     */
    async removeWatched () {
      this.loading = true

      const release_id = this.release.id
      const episodes = this.release.episodes || []
      const payload = {
        release_id,
        episodes
      }

      await this._removeWatchedEpisodes(payload)

      this.loading = false
    },

    /**
     * Generate complete share URL based on selected domain and release code
     * @returns {string}
     */
    generateShareUrl() {
      if (!this.release?.code) return '';

      const domainConfig = {
        'anilibria.tv': {
          base: 'https://anilibria.tv/release/',
          suffix: '.html'
        },
        'anilibria.top': {
          base: 'https://anilibria.top/anime/releases/release/',
          suffix: '/'
        },
        'anilibria.wtf': {
          base: 'https://anilibria.wtf/anime/releases/release/',
          suffix: '/'
        }
      };

      const domain = this.selectedDomain.split('/')[0];
      const config = domainConfig[domain] || domainConfig['anilibria.tv'];

      return `${config.base}${this.release.code}${config.suffix}`;
    },

    /**
     * Generate social share URL
     * @param {string} platform - Social platform (vk, telegram, twitter)
     * @param {string} url - URL to share
     * @param {string} text - Share text
     * @returns {string}
     */
    generateSocialShareUrl(platform, url, text) {
      const encodedUrl = encodeURIComponent(url);
      const encodedText = encodeURIComponent(text);

      const platforms = {
        vk: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedText}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
      };

      return platforms[platform] || '';
    },

    /**
     * Get share text for social media
     * @returns {string}
     */
    getShareText() {
      const { ru, en } = this.release?.names || {};
      const domain = this.selectedDomain.split('/')[0];
      return `Смотри "${ru || en || 'этот релиз'}" на ${domain}`;
    },

    /**
     * Update all share links
     */
    updateShareLinks() {
      if (!this.release) return;

      const shareUrl = this.generateShareUrl();
      const shareText = this.getShareText();

      this.shareLinks = [
        this.createShareLink('Ссылка на релиз', 'mdi-link', shareUrl),
        this.createShareLink('Поделиться в VK', 'mdi-vk',
          this.generateSocialShareUrl('vk', shareUrl, shareText), true),
        this.createShareLink('Поделиться в Telegram', 'mdi-telegram',
          this.generateSocialShareUrl('telegram', shareUrl, shareText), true),
        this.createShareLink('Поделиться в Twitter', 'mdi-twitter',
          this.generateSocialShareUrl('twitter', shareUrl, shareText), true)
      ];
    },

    /**
     * Create share link object
     * @param {string} title
     * @param {string} icon
     * @param {string} link
     * @param {boolean} isExternal
     * @returns {Object}
     */
    createShareLink(title, icon, link, isExternal = false) {
      return {
        title,
        icon,
        link,
        copied: false,
        isExternal
      };
    },

    handleShareClick(item) {
      item.isExternal
        ? window.open(item.link, '_blank')
        : this.copyToClipboard(item.link);
    },

    async copyToClipboard(link) {
      try {
        await navigator.clipboard.writeText(link);
        this.shareLinks = this.shareLinks.map(item => {
          return {
            ...item,
            copied: item.link === link
          }
        });

        setTimeout(() => {
          this.shareLinks = this.shareLinks.map(item => {
            return {
              ...item,
              copied: false
            }
          });
        }, 2000);

        this.$toasted.success('Ссылка скопирована в буфер');
      } catch (err) {
        console.error(err);
        this.$toasted.error('Не удалось скопировать ссылку');
      }
    },
  },
  computed: {
    /**
     * Get release poster image
     *
     * @return {string}
     */
    poster () {
      return this.$__get(this.release, 'poster') || ''
    },

    /**
     * Get release title
     *
     * @return {string}
     */
    title () {
      return this.$__get(this.release, 'names.ru')
    },

    /**
     * Get episodes
     *
     * @return {array}
     */
    episodes () {
      return this.$__get(this.release, 'episodes') || []
    },

    /**
     * Get description
     *
     * @return {string}
     */
    description () {
      return this.$__get(this.release, 'description')
    },

    /**
     * Get release status
     *
     * @return {string}
     */
    status () {
      return this.$__get(this.release, 'status')
    },

    /**
     * Get release rating
     *
     * @return {string}
     */
    rating () {
      return this.$__get(this.release, 'favoriteRating.text')
    },
  }

}
</script>

<style scoped lang="scss">

.release-card {
  position: relative;
  display: flex;

  &--reveal {
    bottom: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  &--progress {
    bottom: 0;
    position: absolute;
    border-radius: 0;
  }
}

</style>
