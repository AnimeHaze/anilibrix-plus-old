// Proxy
// Transformer
import BaseTransformer from '@transformers/BaseTransformer'

// Utils
import store from '@store'
import __camelCase from 'lodash/camelCase'

function countNumbersInRanges(ranges) {
  let total = 0;

  for (const [start, end] of ranges) {
    total += (end - start + 1);
  }

  return total;
}
// Handlers

export default class EpisodesTransformer extends BaseTransformer {
  constructor ({
    cancelToken = null,
    skipTorrents = false
  } = {}) {
    super()
    this.cancelToken = cancelToken
    this.skipTorrents = skipTorrents
  }

  /**
   * Make fetch item async/await
   *
   * @param playlist
   * @param torrents
   * @return {Promise<*>}
   */
  async fetchItem ({
    playlist,
    torrents
  }) {
    // eslint-disable-next-line no-return-await
    return await this.fetch({
      playlist,
      torrents
    })
  }

  /**
   * Transform episodes data
   *
   * @returns Promise
   * @param playlist
   * @param torrents
   */
  async fetch ({
    playlist,
    torrents
  }) {
    try {
      const episodes = {}

      for (const ep in playlist) {
        if (playlist[ep].sources.is_rutube) {
          playlist[ep].fullhd = 'http://localhost:' + global.internalServerPort + '/rutube/' + playlist[ep].rutube_id  + '/main.m3u8'
        }
      }

      // Parse playlist
      // Parse upscale
      // Parse torrents
      // this._parseUpscale(playlist, episodes);
      this._parsePlaylist(playlist || [], episodes)
      this._parseTorrents(this._getTorrents(torrents || []), episodes)

      // Filter all sources without payload
      // Reverse to descending order
      return Object
        .values(episodes)
        .map(episode => ({
          ...episode,
          sources: episode.sources.filter(source => source.payload !== null)
        }))
        .filter(episode => episode.sources && episode.sources.length > 0)
        .reverse()
    } catch (error) {
      throw error
    }
  }

  /**
   * Create episode entity
   *
   * @param number
   * @param episodes
   */
  _createEpisode (number, episodes) {
    if (Object.prototype.hasOwnProperty.call(episodes, number) === false) {
      episodes[number] = {
        id: null,
        title: null,
        sources: [],
        skips: []
      }
    }
  };

  /**
   * Create episode source
   *
   * @param type
   * @param label
   * @param alias
   * @param payload
   * @return {{payload: *, alias: *, label: *, type: *}}
   */
  _createSource (type, label, alias, payload) {
    return {
      type,
      label,
      alias,
      payload
    }
  };

  /**
   * Parse playlist
   *
   * @param playlist
   * @param episodes
   * @private
   */
  _parsePlaylist (playlist, episodes) {
    // Parse server playlists
    playlist.forEach(item => {
      // Get episode number
      // It is same as id in anilibria API
      const episode = this.get(item, 'id')

      // Create episode if it not exists
      this._createEpisode(episode, episodes)

      /**
       * Get payload
       *
       * @param playlistKey
       * @param fileKey
       * @return {{file: *, playlist: *}}
       */
      const getPayload = (playlistKey = null, fileKey = null) => {
        return {
          file: this.get(item, fileKey) || null,
          playlist: this.get(item, playlistKey) || null
        }
      }

      // Get sources fhd, hd, sd source
      const fhdSource = this._createSource('server', '1080', 'fhd', getPayload('fullhd'))
      const hdSource = this._createSource('server', '720', 'hd', getPayload('hd', 'srcHd'))
      const sdSource = this._createSource('server', '480', 'sd', getPayload('sd', 'srcSd'))

      // Set episode data
      episodes[episode].id = episode
      episodes[episode].title = this.get(item, 'title')
      episodes[episode].name = this.get(item, 'name')
      episodes[episode].updated_at = this.get(item, 'updated_at')
      episodes[episode].skips = this.get(item, 'skips')

      // Push sources
      if (fhdSource.payload.playlist) episodes[episode].sources.push(fhdSource)
      if (hdSource.payload.playlist) episodes[episode].sources.push(hdSource)
      if (sdSource.payload.playlist) episodes[episode].sources.push(sdSource)
    })
  }

  /**
   * Parse upscale
   *
   * @param playlist
   * @param episodes
   * @private
   */
  _parseUpscale (playlist, episodes) {
    if (this.get(store, 'state.app.settings.player.upscale.process') === true) {
      playlist.forEach(item => {
        // Get episode number
        // It is same as id in anilibria API
        // Get upscale payload
        const episode = this.get(item, 'id')
        const upscalePayload = {
          url: this.get(item, 'fullhd'),
          scale: 1
        }

        episodes[episode].sources.push(this._createSource('upscale', '4096', '4k', {
          ...upscalePayload,
          scale: 2
        }))
        episodes[episode].sources.push(this._createSource('upscale', '2048', '2k', {
          ...upscalePayload,
          scale: 1
        }))
      })
    }
  }

  /**
   * Get torrents data
   * Check if torrents should be processed
   *
   * @return {array}
   * @private
   * @param torrents
   */
  _getTorrents (torrents = []) {
    if (this.skipTorrents === false && this.get(store, 'state.app.settings.player.torrents.process') === true) {
      // Filter torrents
      // Exclude HEVC torrents (no codec available)
      return torrents
        .filter(torrent => new RegExp('HEVC').test(torrent.quality) === false)
    }

    return []
  }

  /**
   * Parse torrents
   *
   * @param torrents
   * @param episodes
   * @private
   */
  _parseTorrents(torrents, episodes) {
    torrents.forEach(torrent => {
      const type = 'torrent'
      const label = this.get(torrent, 'quality') || null
      const alias = label ? __camelCase(label) : null
      const rangeStr = this.get(torrent, 'series')
      const range = rangeStr.split('-').map(Number)

      const start = range[0]
      const end = range[1] || range[0]

      console.log('Processing torrent:', torrent)

      for (let seriesNum = start; seriesNum <= end; seriesNum++) {
        this._createEpisode(seriesNum, episodes)

        episodes[seriesNum].id = episodes[seriesNum].id ?? seriesNum
        episodes[seriesNum].title = episodes[seriesNum].title || `Серия ${seriesNum}`
        episodes[seriesNum].sources.push(this._createSource(type, label, alias, {
          torrent: {
            id: this.get(torrent, 'id'),
            name: this.get(torrent, 'name'),
            peers: 0,
            seeders: 0,
            datetime: 0,
            leechers: 0
          },
          file: {
            magnet: this.get(torrent, 'magnet'),
            name: seriesNum,
            path: seriesNum,
            index: seriesNum - start,
            length: 0
          }
        }))
      }
    })
  }

  /**
   * Parse episode from torrent filename
   *
   * @param filename
   * @return {null|*}
   * @private
   */
  _parseEpisodeFromTorrentFilename (filename) {
    if (filename && typeof filename === 'string') {
      const episode = this.get(filename.match(/_\[(\d+)\]_?/), [1]) || null
      return episode !== null ? parseFloat(episode) : null
    }

    return null;
  }
}
