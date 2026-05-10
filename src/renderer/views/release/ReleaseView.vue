<template>
  <div>
    <v-layout v-if="loading || _release" column>
      <!-- Release Card -->
      <v-card class="mb-2" color="transparent" flat>
        <v-card-actions class="pa-0">
          <card v-bind="{loading}" class="flex-grow-1" :release="__release"/>
          <v-menu offset-y :close-on-content-click="false">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                color="primary"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-share-variant</v-icon>
              </v-btn>
            </template>
            <v-list>
              <!-- Domain selector -->
              <v-list-item @click.stop>
                <v-list-item-content>
                  <v-select
                    v-model="selectedDomain"
                    :items="availableDomains"
                    dense
                    outlined
                    hide-details
                    :label="$t('catalog.releaseDomain')"
                    @change="updateShareLinks"
                    @click.stop
                  ></v-select>
                </v-list-item-content>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item
                v-for="(item, index) in shareLinks"
                :key="index"
                @click="handleShareClick(item)"
              >
                <v-list-item-icon>
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
        </v-card-actions>
      </v-card>

      <v-card v-if="franchises.length" flat color="transparent" class="mb-6">
        <v-card-title>{{ $t('common.linked') }}</v-card-title>
        <v-list three-line>
          <template v-for="(item, index) in franchises">
            <v-list-item :link="true" @click="router().push('/release/' + release.id + '/' + encodeURIComponent(releaseTitle(release)))"
                         :disabled="release.id == releaseId"
                         v-for="(release, index) in item.releases"
                         :key="release.id"
            >
              <v-list-item-avatar>
                <v-img :transition="false" :src="release.poster"></v-img>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title>
                  <span>{{ releaseTitle(release) }}</span>

                  <v-chip
                    class="ma-2"
                    v-if="releaseStatus(release)"
                    color="secondary"
                    text-color="white"
                  >
                    {{ releaseStatus(release) }}
                  </v-chip>
                </v-list-item-title>
                <v-list-item-subtitle v-if="releaseType(release) && releaseType(release) !== 'null'" v-text="releaseType(release)">
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list>
      </v-card>

      <!-- Release Tabs -->
      <v-tabs v-if="!loading" v-model="tab" class="shrink mb-4" background-color="transparent">
        <v-tab>{{ $t('common.episodes') }}</v-tab>
        <v-tab>{{ $t('common.comments') }}</v-tab>
        <v-tab v-if="torrents.length > 0">{{ $t('common.torrents') }}</v-tab>
      </v-tabs>

      <!-- Release Components -->
      <component v-if="component" v-on="component.events" v-bind="component.props" :is="component.is"/>

    </v-layout>

    <v-layout v-else-if="!loading && !_release" fill-height align-center justify-center>
      <v-row justify="center" align="center">

        <v-col cols="12" sm="3" align-self="center">
          <v-img :transition="false" class="image" contain :src="image"/>
        </v-col>

        <v-col cols="12" sm="6" align-self="center">
          <v-card flat color="transparent">
            <v-card-text class="error-message-container">
              <!-- Help Information -->
              <v-card
                outlined
                color="red"
                class="pa-4"
              >
                <div class="text-body-1 mb-2">
                  <v-icon small class="mr-2">mdi-help-circle</v-icon>
                  <strong>{{ $t('release.whatHappened') }}</strong>
                </div>
                <div class="text-caption">
                  <h3>{{ $t('release.missingTitle') }}</h3>
                  <p>{{ $t('release.missingBody') }}</p>

                  <div class="error-details">
                    <strong>{{ $t('release.missingReasons') }}</strong>
                    <ul>
                      <li>{{ $t('release.missingReasonCache') }}</li>
                      <li>{{ $t('release.missingReasonSync') }}</li>
                      <li>{{ $t('release.missingReasonTemporary') }}</li>
                    </ul>
                  </div>
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
                    {{ $t('common.home') }}
                  </v-btn>
                </div>
              </v-card>
            </v-card-text>
          </v-card>
        </v-col>

      </v-row>
    </v-layout>
  </div>
</template>

<script>

import Card from '@components/release/card'
import Episodes from '@components/release/episodes'
import Comments from '@components/release/comments'
import Torrents from '@components/release/torrents'

import { toVideo } from '@utils/router/views'
import { mapState } from 'vuex'
import router from '@router'
import ReleaseProxy from '@proxies/release'
import store from "@store";
import LibriaTyan01 from "@assets/images/libria-tyan/LibriaTyan01.svg";
import {
  resolveReleaseStatus,
  resolveReleaseTitle,
  resolveReleaseType
} from '@utils/release/display'

const props = {
  releaseId: {
    type: [String, Number],
    default: null
  },
  releaseName: {
    type: String,
    default: null
  }
}

export default {
  props,
  name: 'Release.View',
  meta () {
    return { title: `${this.$t('common.release')} [${this.releaseId}]: ${this.releaseName}` }
  },
  components: {
    Card,
    Episodes,
    Comments
  },
  data () {
    return {
      image: LibriaTyan01,
      tab: 0,
      loading: false,
      dates: {},
      selectedDomain: 'anilibria.tv/release/',
      availableDomains: [
        { text: 'anilibria.tv', value: 'anilibria.tv/release/' },
        { text: 'anilibria.top', value: 'anilibria.top/anime/releases/release/' },
        { text: 'anilibria.wtf', value: 'anilibria.wtf/anime/releases/release/' }
      ],
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
      ]
    }
  },

  computed: {
    ...mapState('release', { _release: s => s.data }),
    __release () {
      return {
        ...this._release
      }
    },
    franchises () {
      return this._release?.franchises?.length ? [{
        releases: this._release.franchises
      }] : []
    },
    /**
     * Get release episodes
     *
     * @return {array}
     */
    episodes () {
      if (!this._release) return []

      return this.$__get(this._release, 'episodes', [])
    },

    /**
     * Get release torrents
     *
     * @return {array}
     */
    torrents () {
      if (!this._release) return []

      return this.$__get(this._release, 'torrents', [])
    },

    /**
     * Get available components
     *
     * @return {array}
     */
    components () {
      return [
        {
          is: Episodes,
          props: {
            loading: this.loading,
            release: this._release,
            episodes: this.episodes,
          },
          events: { episode: episode => toVideo(this._release, episode) },
        },
        {
          is: Comments,
          props: { release: this._release }
        },
        {
          is: Torrents,
          props: { torrents: this.torrents }
        }
      ]
    },

    /**
     * Get active component
     *
     * @return {*}
     */
    component () {
      return this.components[this.tab] || null
    }

  },

  methods: {
    router () {
      return router
    },

    /**
     * Generate complete share URL based on selected domain and release code
     * @returns {string}
     */
    generateShareUrl() {
      if (!this._release?.code) return '';

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

      return `${config.base}${this._release.code}${config.suffix}`;
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
      const domain = this.selectedDomain.split('/')[0];
      return this.$t('release.shareText', {
        title: resolveReleaseTitle(this._release, this.$locale) || this.$t('generated.shareThisRelease'),
        domain
      });
    },

    /**
     * Update all share links
     */
    updateShareLinks() {
      if (!this._release) return;

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

    releaseTitle (release) {
      return resolveReleaseTitle(release, this.$locale)
    },

    releaseStatus (release) {
      return resolveReleaseStatus(release, this.$locale)
    },

    releaseType (release) {
      return resolveReleaseType(release, this.$locale)
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
  watch: {
    releaseId: {
      immediate: true,
      async handler (releaseId) {

        // Update if release data changed
        if (this._release === null || this._release.id !== parseInt(releaseId)) {

          // Get release data
          this.loading = true
          await this.$store.dispatchPromise('release/getRelease', releaseId)
          this.updateShareLinks()
          this.loading = false
        }
      }
    },

    _release: {
      deep: true,
      handler() {
        this.updateShareLinks()
      }
    }
  }
}
</script>

<style scoped>
.v-list-item__action {
  transition: all 0.3s ease;
}

.v-list-item__action .v-icon {
  transition: all 0.3s ease;
}

.v-select {
  margin: 8px 0;
}
</style>
