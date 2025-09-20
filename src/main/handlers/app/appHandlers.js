import { Main, Torrent } from '@main/utils/windows'
import { app, ipcMain, ipcRenderer } from 'electron'
import { start as startSystemSleepBlocker, stop as stopSystemSleepBlocker } from '../../utils/powerSaveBlocker'
import { setEncrypted } from '@main/utils/safeStorage'
import axios from '@plugins/axios'
import axiosRetry from 'axios-retry';
import parseTorrent from 'parse-torrent';
import qs from 'querystring';
import { catGirlFetch } from '@utils/fetch';
import { parse } from 'content-disposition-attachment';
import FormData from 'form-data'

axiosRetry(axios, {
  retryDelay: () => 1500,
  retries: 10,
  retryCondition: function (response) {
    if (response.status === 404) return false
    if (response.status === 401) return false

    return true
    // return axiosRetry.isNetworkOrIdempotentRequestError(response)
  }
})

const { shell } = require('electron')
const path = require('path')

export const APP_DISCORD_RICH_PRESENSE = 'app:richpresense'

export const APP_ABOUT = 'app:about'
export const APP_SYSTEM_SLEEP_DISABLE = 'app:system:disable_sleep'
export const APP_SYSTEM_SLEEP_ENABLE = 'app:system:enable_sleep'
export const APP_DOCK_NUMBER = 'app:dock:number'
export const APP_DEVTOOLS_MAIN = 'app:devtools:main'
export const APP_DEVTOOLS_TORRENT = 'app:devtools:torrent'
export const APP_SAFE_STORAGE_ENCRYPT_REQUEST = 'app:system:safe_storage:encrypt'
export const APP_SAFE_STORAGE_DECRYPT_REQUEST = 'app:system:safe_storage:decrypt'

export const APP_SHOW_CONFIG = 'app:show_config'
export const APP_CHECK_API_ENDPOINT = 'app:check_api_endpoint'

export const APP_RAND = 'app:rand'
export const APP_GET_TITLE_V2 = 'app:get_title_v2'

export const APP_GET_TITLE_V1_NEW = 'app:get_title_v1new'
export const APP_GET_TITLE_V3 = 'app:get_title_v3'

export const APP_TORRENT_PARSE = 'app:torrent_parse'
export const APP_UPDATE_PROXY = 'app:update_proxy'
/**
 * Send app about event
 *
 * @return {void}
 */
export const sendAppAboutEvent = () => ipcRenderer.send(APP_ABOUT)

/**
 * Listen app about event
 *
 * @return {Electron.IpcMain}
 */
export const catchAppAboutEvent = () => ipcMain.on(APP_ABOUT, () => app.showAboutPanel())

/**
 * Send app devtools main event
 *
 * @return {void}
 */
export const sendAppDevtoolsMainEvent = () => ipcRenderer.send(APP_DEVTOOLS_MAIN)

/**
 * Listen app devtools main event
 *
 * @return {Electron.IpcMain}
 */
export const catchAppDevtoolsMainEvent = () => ipcMain.on(APP_DEVTOOLS_MAIN, () => Main.showDevTools())

/**
 * Send app devtools torrent event
 *
 * @return {void}
 */
export const sendAppDevtoolsTorrentEvent = () => ipcRenderer.send(APP_DEVTOOLS_TORRENT)

/**
 * Listen app devtools torrent event
 *
 * @return {Electron.IpcMain}
 */
export const catchAppDevtoolsTorrentEvent = () => ipcMain.on(APP_DEVTOOLS_TORRENT, () => Torrent.showDevTools())

/**
 * Send app docker number event
 *
 * @param number
 * @return {void}
 */
export const sendAppDockNumberEvent = (number) => ipcRenderer.send(APP_DOCK_NUMBER, number)

/**
 * Listen app dock number event
 *
 * @return {void}
 */

export const catchAppDockNumberEvent = () => {
  ipcMain.on(APP_DOCK_NUMBER, (e, number) => {
    if (app.dock) app.dock.setBadge(number && number > 0 ? number.toString() : '')
  })
}

/**
 * Send app system sleep blocker enable event
 *
 * @param number
 * @return {void}
 */
export const sendEnableSystemSleepBlockerEvent = (number) => ipcRenderer.send(APP_SYSTEM_SLEEP_DISABLE)

/**
 * Listen app system sleep blocker enable event
 *
 * @return {void}
 */
export const catchEnableSystemSleepBlockerEvent = () => {
  ipcMain.on(APP_SYSTEM_SLEEP_DISABLE, (e) => {
    startSystemSleepBlocker()
  })
}

/**
 * Send app system sleep blocker disable event
 *
 * @param number
 * @return {void}
 */
export const sendDisableSystemSleepBlockerEvent = (number) => ipcRenderer.send(APP_SYSTEM_SLEEP_ENABLE)

/**
 * Listen app system sleep blocker disable event
 *
 * @return {void}
 */
export const catchDisableSystemSleepBlockerEvent = () => {
  ipcMain.on(APP_SYSTEM_SLEEP_ENABLE, (e) => {
    stopSystemSleepBlocker()
  })
}

/**
 * Send encrypt request to safe storage
 *
 * @param {string} prop Property name
 * @param {string} data Data to encrypt
 * @return {Promise<string>}
 */
export const invokeSafeStorageEncrypt = (prop, data) => ipcRenderer.invoke(APP_SAFE_STORAGE_ENCRYPT_REQUEST, prop, data)

/**
 * Listen encrypt request to safe storage
 *
 * @return {void}
 */
export const handleSafeStorageEncrypt = () => {
  ipcMain.handle(APP_SAFE_STORAGE_ENCRYPT_REQUEST, async (event, prop, data) => {
    return setEncrypted(prop, data)
  })
}

/**
 * Send activity for discord rich presence
 *
 * @param {object} data
 * @return {Promise}
 */
export const invokeRichPresense = (data) => ipcRenderer.invoke(APP_DISCORD_RICH_PRESENSE, data)

/**
 * Listens for activity for discord rich presence
 *
 * @return {void}
 */
export const handleRichPresense = (setActivity) => {
  ipcMain.handle(APP_DISCORD_RICH_PRESENSE, async (event, data) => {
    return setActivity(data)
  })
}

/**
 * Send activity for discord rich presence
 *
 * @param {object} data
 * @return {Promise}
 */
export const invokeShowConfig = () => ipcRenderer.invoke(APP_SHOW_CONFIG)

/**
 * Listens for activity for discord rich presence
 *
 * @return {void}
 */
export const handleShowConfig = () => {
  ipcMain.handle(APP_SHOW_CONFIG, async (event, data) => {
    return shell.showItemInFolder(path.join(app.getPath('userData'), 'anilibrix.json'))
  })
}

function normalizeEndpoint (endpoint) {
  if (endpoint.endsWith('/')) {
    return endpoint.slice(0, -1).trim()
  }

  return endpoint.replace(/([^:]\/)\/+/g, '$1').trim()
}

/**
 * Send activity for discord rich presence
 *
 * @param {object} data
 * @return {Promise}
 */
export const invokeRand = () => ipcRenderer.invoke(APP_RAND)

/**
 * Listens for activity for discord rich presence
 *
 * @return {void}
 */
export const handleRand = () => {
  ipcMain.handle(APP_RAND, async (event) => {
    // delay 500 - 1.5 sec
    await new Promise((r) => setTimeout(r, Math.random() * 1000 + 500))

    try {
      const store = require('@store/index').default;
      const endpoint = normalizeEndpoint(store?.state?.app?.settings?.system?.api._endpoint);
      const apiUrl = `${endpoint}/public/api/index.php`;

      const randomReleaseFormData = new FormData();
      randomReleaseFormData.append('query', 'random_release');

      const randomResponse = await catGirlFetch(apiUrl, {
        method: 'POST',
        body: randomReleaseFormData,
        raw: true
      });

      if (!randomResponse.ok) {
        throw new Error(`Failed to fetch random release: ${randomResponse.status}`);
      }

      const { data: randomData } = await randomResponse.json();

      if (!randomData?.id) {
        throw new Error('Invalid response: missing release ID');
      }

      const releaseFormData = new FormData();
      releaseFormData.append('query', 'release');
      releaseFormData.append('id', randomData.id);

      const releaseResponse = await catGirlFetch(apiUrl, {
        method: 'POST',
        body: releaseFormData,
        raw: true
      });

      if (!releaseResponse.ok) {
        throw new Error(`Failed to fetch release details: ${releaseResponse.status}`);
      }

      const releaseData = await releaseResponse.json();

      const { id, names } = releaseData.data;
      const name = names.pop();

      return { id, name };
    } catch (error) {
      console.error('Error in handleRand:', error);
      throw new Error(`Random release fetch failed: ${error.message}`);
    }
  });
};

export const invokeGetTitleV3 = (url) => ipcRenderer.invoke(APP_GET_TITLE_V3, url)
export const handleGetTitleV3 = () => {
  ipcMain.handle(APP_GET_TITLE_V3, async (event, filter) => {
    let response
    try {
      response = await axios.get('https://api.anilibria.tv/v3/title?' + filter).then(x => x.data)
    } catch (e) {
      response = await axios.get('https://api.wwnd.space/v3/title?' + filter).then(x => x.data)
    }

    return response
  })
}

export const invokeGetTitleV2 = (url) => ipcRenderer.invoke(APP_GET_TITLE_V2, url)
export const handleGetTitleV2 = () => {
  ipcMain.handle(APP_GET_TITLE_V2, async (event, rId) => {
    let response

    try {
      response = await axios.get(`https://api.wwnd.space/v2/getTitle?id=${rId}&filter=player.playlist&playlist_type=array`).then(x => x.data)
    } catch (e) {
      response = await axios.get(`https://api.anilibria.tv/v2/getTitle?id=${rId}&filter=player.playlist&playlist_type=array`).then(x => x.data)
    }

    return response
  })
}

export const invokeGetTitleV1New = (url) => ipcRenderer.invoke(APP_GET_TITLE_V1_NEW, url)
export const handleGetTitleV1New = () => {
  ipcMain.handle(APP_GET_TITLE_V1_NEW, async (event, rId) => {
    return await axios.get('https://anilibria.top/api/v1/anime/releases/' + rId).then(x => x.data)
  })
}

export const invokeUpdateProxy = (url) => ipcRenderer.invoke(APP_UPDATE_PROXY, url)
export const handleUpdateProxy = (cb) => {
  ipcMain.handle(APP_UPDATE_PROXY, async (event, url) => {
    return cb(url)
  })
}

export const invokeTorrentParse = (url) => ipcRenderer.invoke(APP_TORRENT_PARSE, url)

export const handleTorrentParse = () => {
  ipcMain.handle(APP_TORRENT_PARSE, async (event, url) => {
    const { file, name } = await catGirlFetch(url, { raw: true })
      .then(async x => {
        return {
          name: parse(x.headers.get('content-disposition')).filename || 'unknown.torrent',
          file: Buffer.from(await x.arrayBuffer())
        }
      })

    const data = parseTorrent(file);

    return {
      file: file.toString('base64'),
      name,
      magnet: 'magnet:?' + qs.stringify({
        xt: `urn:btih:${data.infoHash}`,
        dn: data.name,
        tr: data.announce
      })
    }
  })
}
