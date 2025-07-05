<template>
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
                  label="Домен для ссылки"
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

    <v-card v-if="franchises.length && !loadingAdditional" flat color="transparent" class="mb-6">
      <v-card-title>Связанное</v-card-title>
      <v-list three-line>
        <template v-for="(item, index) in franchises">
          <v-list-item :link="true" @click="router().push('/release/' + release.id + '/' + release.names.en)"
                       :disabled="release.id == releaseId"
                       v-for="(release, index) in item.releases"
                       :key="release.id"
          >
            <v-list-item-avatar>
              <v-img :src="release.poster"></v-img>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>
                <span>{{ release.names.ru }}</span>

                <v-chip
                  class="ma-2"
                  v-if="release.status"
                  color="secondary"
                  text-color="white"
                >
                  {{ release.status }}
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle v-html="release.type"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <!-- Release Tabs -->
    <v-tabs v-if="!loading" v-model="tab" class="shrink mb-4" background-color="transparent">
      <v-tab>Эпизоды</v-tab>
      <v-tab>Комментарии</v-tab>
      <v-tab v-if="torrents.length > 0">Торренты</v-tab>
    </v-tabs>

    <!-- Release Components -->
    <component v-if="component" v-on="component.events" v-bind="component.props" :is="component.is"/>

  </v-layout>
</template>

<script>

import Card from '@components/release/card'
import Episodes from '@components/release/episodes'
import Comments from '@components/release/comments'
import Torrents from '@components/release/torrents'

import { toVideo } from '@utils/router/views'
import { mapState } from 'vuex'
import router from '@router'
import { catGirlFetch } from '@utils/fetch'
import ReleaseProxy from '@proxies/release'
import {invokeGetTitleV3} from "@main/handlers/app/appHandlers";

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
    return { title: `Релиз [${this.releaseId}]: ${this.releaseName}` }
  },
  components: {
    Card,
    Episodes,
    Comments
  },

  async mounted () {
    const id = this._release?.id
    if (this._release?.id) {
      await this.fetchAdditional(id)
    }
  },

  data () {
    return {
      tab: 0,
      loading: false,
      loadingAdditional: true,
      franchises: [],
      dates: {},
      team: null,
      selectedDomain: 'anilibria.tv/release/',
      availableDomains: [
        { text: 'anilibria.tv', value: 'anilibria.tv/release/' },
        { text: 'anilibria.top', value: 'anilibria.top/anime/releases/release/' },
        { text: 'anilibria.wtf', value: 'anilibria.wtf/anime/releases/release/' }
      ],
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
      ]
    }
  },

  computed: {
    ...mapState('release', { _release: s => s.data }),
    __release () {
      return {
        ...this._release,
        team: this.team
      }
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
      const { ru, en } = this._release?.names || {};
      const domain = this.selectedDomain.split('/')[0];
      return `Смотри "${ru || en || 'этот релиз'}" на ${domain}`;
    },

    /**
     * Update all share links
     */
    updateShareLinks() {
      if (!this._release) return;

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

    async fetchAdditional() {
      this.loadingAdditional = true
      try {
        const { franchises, team } = await this.loadFranchisesAndTeam()

        this.team = team
        const releaseIds = this.extractReleaseIds(franchises)
        const additionalData = await this.loadAdditionalData(releaseIds)

        this.franchises = this.formatFranchises(franchises, additionalData)
        this.loadingAdditional = false
      } catch (error) {
        console.error(error)
        this.$toasted.error('Ошибка загрузки связанных данных')
        this.loadingAdditional = false
      }
    },

    async loadFranchisesAndTeam() {
      return await invokeGetTitleV3(`filter=franchises,team&playlist_type=array&id=${this.releaseId}`)
    },

    extractReleaseIds(franchises) {
      const releaseIds = new Set()
      franchises.forEach(franchise => {
        franchise.releases.forEach(release => {
          releaseIds.add(release.id)
        })
      })
      return Array.from(releaseIds)
    },

    async loadAdditionalData(releaseIds) {
      const result = await Promise.allSettled(
          releaseIds.map((id) => invokeGetTitleV3(
            `filter=status.string,id,type.full_string,string,names.ru,posters.medium&include=raw_poster&description_type=plain&playlist_type=object&id=${id}`
          ))
      )

      return result
        .filter(({ value, reason }) => {
          return reason?.status !== 404
        })
        .map(({ value }) => value)
    },

    formatFranchises(franchises, additionalData) {
      return franchises.map(franchise => {
        return {
          ...franchise,
          releases: franchise.releases.map(release => {
            const releaseData = additionalData.find(data => data.id === release.id)

            if (!releaseData) return null

            const {
              posters,
              type,
              status: { string: status },
            } = releaseData

            return {
              ...release,
              poster: new ReleaseProxy().getStaticEndpoint() + posters?.medium.url,
              type: type?.full_string,
              status: status,
            }
          }).filter(x => x !== null),
        }
      })
    }
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
          this.fetchAdditional(releaseId)
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
