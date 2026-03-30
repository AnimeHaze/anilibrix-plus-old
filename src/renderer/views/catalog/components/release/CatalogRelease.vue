<template>
  <v-card flat color="transparent" @click="$emit('click')">
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
            <v-list-item-title>{{ item.title }} ({{ watched }} / {{ total }})</v-list-item-title>
          </v-list-item-content>

        </v-list-item>

        <v-list-item @click.stop>
          <v-list-item-content>
            <v-select
              v-model="selectedDomain"
              :items="availableDomains"
              @change="updateShareLinks"
              dense
              outlined
              hide-details
              :label="$t('catalog.releaseDomain')"
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

    <v-layout @contextmenu="show" align-start>
      <v-card width="160" height="240" min-width="160" min-height="240" :style="{position: 'relative'}">
        <v-img :transition="false" v-bind="{src}" width="160" height="240"/>
      </v-card>

      <div>
        <v-card-title v-text="title"/>
        <v-card-subtitle v-if="subtitle" v-text="subtitle" class="pb-0"/>
        <v-card-subtitle v-if="genres" v-text="genres" class="pt-0"/>

        <!-- Meta -->
        <v-card-text>
          <favorite v-bind="{release}"/>
          <v-chip v-text="year" label color="grey darken-4" :style="{height: '36px'}"/>
          <v-chip v-text="type" label color="grey darken-4" :style="{height: '36px'}"/>
          <v-chip v-if="status" v-text="status" label color="grey darken-4" :style="{height: '36px'}"/>
        </v-card-text>

        <!-- Description -->
        <v-card-text v-if="description" class="pt-0 grey--text">
          <v-clamp max-height="85px">{{ description }}</v-clamp>
        </v-card-text>
      </div>

    </v-layout>
  </v-card>
</template>

<script>

import VClamp from 'vue-clamp'
import Favorite from '@components/release/favorite'
import RProgress from '@components/release/progress'
import {mapActions} from "vuex";

const props = {
  release: {
    type: Object,
    default: null,
  },
}

export default {
  props,
  components: {
    VClamp,
    Favorite,
    RProgress,
  },
  mounted() {
    this.updateShareLinks()
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

      if (this.lockShow) return
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
      this.lockShow = true
      this.loading = true

      const release_id = this.release.id
      const episodes = this.release.episodes || []
      const payload = {
        release_id,
        episodes
      }

      this.$nextTick(async () => {
        try {
          await this._setWatchedEpisodes(payload)
        } catch (e) {
          console.error(e)
        } finally {
          this.loading = false
          this.lockShow = false
        }
      })
    },

    /**
     * Remove watch package data
     *
     * @return {Promise<void>}
     */
    async removeWatched () {
      this.lockShow = true
      this.loading = true

      const release_id = this.release.id
      const episodes = this.release.episodes || []
      const payload = {
        release_id,
        episodes
      }

      this.$nextTick(async () => {
        try {
          await this._removeWatchedEpisodes(payload)
        } catch (e) {
          console.error(e)
        } finally {
          this.loading = false
          this.lockShow = false
        }
      })
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
      return this.$t('release.shareText', { title: ru || en || this.$t('generated.shareThisRelease'), domain });
    },

    /**
     * Update all share links
     */
    updateShareLinks() {
      if (!this.release) return;

      const shareUrl = this.generateShareUrl();
      const shareText = this.getShareText();

      this.shareLinks = [
        this.createShareLink(this.$t('common.releaseLink'), 'mdi-link', shareUrl),
        this.createShareLink(this.$t('common.shareVk'), 'mdi-vk',
          this.generateSocialShareUrl('vk', shareUrl, shareText), true),
        this.createShareLink(this.$t('common.shareTelegram'), 'mdi-telegram',
          this.generateSocialShareUrl('telegram', shareUrl, shareText), true),
        this.createShareLink(this.$t('common.shareTwitter'), 'mdi-twitter',
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

        this.$toasted.success(this.$t('release.copySuccess'));
      } catch (err) {
        console.error(err);
        this.$toasted.error(this.$t('release.copyError'));
      }
    },
  },
  data () {
    return {
      lockShow: false,
      actions: [
        {
          icon: 'mdi-check',
          title: this.$t('release.markAllSeen'),
          action: this.setWatched,
        },
        {
          icon: 'mdi-close',
          title: this.$t('release.unmarkAllSeen'),
          action: this.removeWatched,
        }
      ],
      selectedDomain: 'anilibria.tv/release/',
      shareLinks: [
        {
          title: this.$t('common.releaseLink'),
          icon: 'mdi-link',
          link: '',
          copied: false,
          isExternal: false
        },
        {
          title: this.$t('common.shareVk'),
          icon: 'mdi-vk',
          link: '',
          copied: false,
          isExternal: true
        },
        {
          title: this.$t('common.shareTelegram'),
          icon: 'mdi-telegram',
          link: '',
          copied: false,
          isExternal: true
        },
        {
          title: this.$t('common.shareTwitter'),
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
  computed: {
    total () {
      return this.episodes.length
    },

    /**
     * Get watched episodes
     *
     * @return {*}
     */
    watched () {
      const release_id = this.$__get(this.release, 'id')

      const episodes = (this.episodes || []).map(x => x.id)
      const payload = {
        release_id,
        episodes
      }

      const watched_episodes = this.$store.getters['app/watch/getWatchedEpisodes'](payload)
      return watched_episodes.length
    },

    /**
     * Get image
     *
     * @return {*}
     */
    src () {
      return this.$__get(this.release, 'poster')
    },

    /**
     * Get title
     *
     * @return {string}
     */
    title () {
      return this.$__get(this.release, 'names.ru')
    },

    /**
     * Get subtitle
     *
     * @return {string}
     */
    subtitle () {
      return this.$__get(this.release, 'names.original')
    },

    /**
     * Get release genres
     *
     * @return {string}
     */
    genres () {
      return (this.$__get(this.release, 'genres') || []).join(' | ')
    },

    /**
     * Get release year
     *
     * @return {*}
     */
    year () {
      return this.$__get(this.release, 'year')
    },

    /**
     * Get release type
     *
     * @return {*}
     */
    type () {
      return this.$__get(this.release, 'type')
    },

    /**
     * Get release description
     *
     * @return {*}
     */
    description () {
      return this.$__get(this.release, 'description')
    },

    /**
     * Get release episodes
     *
     * @return {*|*[]}
     */
    episodes () {
      return this.$__get(this.release, 'episodes') || []
    },

    /**
     * Get release status
     *
     * @return {*}
     */
    status () {
      return this.$__get(this.release, 'status')
    }

  }
}

</script>
