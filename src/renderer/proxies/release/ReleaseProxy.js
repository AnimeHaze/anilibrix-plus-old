import BaseProxy from '@proxies/BaseProxy'

export default class ReleaseProxy extends BaseProxy {
  /**
   * Get last releases
   *
   * @return {Promise}
   */
  async getReleases (parameters = {}) {
    const data = this.getFormDataObject({
      query: 'list',
      perPage: 14
    })
    const params = {
      data,
      headers: data.getHeaders(),
      ...parameters
    }
    const response = await this.submit('POST', this.getApiEndpoint(), params)

    return this.handleResponse(response.data)
  }

  /**
   * Get release with provided id
   *
   * @param releaseId
   * @param parameters
   * @return {Promise<unknown>}
   */
  async getRelease (releaseId, parameters = {}) {
    const data = this.getFormDataObject({
      query: 'release',
      id: releaseId
    })
    const params = {
      data,
      headers: data.getHeaders(),
      ...parameters
    }
    const response = await this.submit('POST', this.getApiEndpoint(), params)
    const { playlist } = response.data.data
    for (const ep in playlist) {
      if (playlist[ep].sources.is_rutube) {
        playlist[ep].fullhd = 'http://localhost:' + global.internalServerPort + '/rutube/' + playlist[ep].rutube_id + '/main.m3u8'
      } else {
        const { sd, hd, fullhd } = playlist[ep]
        
        if (fullhd) {
          playlist[ep].fullhd = encodeURIComponent('http://localhost:' + global.internalServerPort + '/hls/' + playlist[ep].fullhd) 
        }

        if (hd) {
          playlist[ep].hd = encodeURIComponent('http://localhost:' + global.internalServerPort + '/hls/' + playlist[ep].hd)
        }
        
        if (sd) {
          playlist[ep].sd = encodeURIComponent('http://localhost:' + global.internalServerPort + '/hls/' + playlist[ep].sd)
        }
      }
    }
    return this.handleResponse(response.data)
  }

  /**
   * Search releases by name
   *
   * @param searchQuery
   * @param parameters
   * @return {Promise<unknown>}
   */
  async searchReleases (searchQuery, parameters = {}) {
    const data = this.getFormDataObject({
      query: 'search',
      search: searchQuery
    })
    const params = {
      data,
      headers: data.getHeaders(),
      ...parameters
    }
    const response = await this.submit('POST', this.getApiEndpoint(), params)

    return this.handleResponse(response.data)
  }

  /**
   * Get torrent file
   *
   * @param url
   * @param parameters
   * @return {Promise<unknown>}
   */
  async getReleaseTorrent (url, parameters = {}) {
    console.log('Get release torrent', this.getTorrentEndpoint() + url)
    if (url) {
      // eslint-disable-next-line no-return-await
      return await this.submit('GET', this.getTorrentEndpoint() + url, {
        ...parameters,
        responseType: 'arraybuffer'
      })
    } else {
      return null
    }
  }

  /**
   * Get release poster
   *
   * @param src
   * @return {string|null}
   */
  getReleasePosterPath (src) {
    return src ? this.getStaticEndpoint() + src : null;
  }
}
