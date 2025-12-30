import { Main, Torrent } from '@main/utils/windows'
import { app, ipcMain, ipcRenderer } from 'electron'
import { start as startSystemSleepBlocker, stop as stopSystemSleepBlocker } from '../../utils/power-save-blocker'
import { setEncrypted } from '@main/utils/safe-storage'
import { catGirlFetch } from '@utils/fetch';
import { parse } from 'content-disposition-attachment';
import FormData from 'form-data'
import {showAppError} from "@main/handlers/notifications/notifications-handler";
import {debounce} from "lodash";

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
export const APP_SHOW_CONFIG = 'app:show_config'
export const APP_RAND = 'app:rand'
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
      const apiUrl = `http://localhost:${global.internalServerPort}/public/api/index.php`;

      const randomReleaseFormData = new FormData();
      randomReleaseFormData.append('query', 'random_release');

      const randomResponse = await catGirlFetch(apiUrl, {
        method: 'POST',
        body: randomReleaseFormData
      })

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
        body: releaseFormData
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

export const invokeUpdateProxy = (url) => ipcRenderer.invoke(APP_UPDATE_PROXY, url)
export const handleUpdateProxy = (cb) => {
  ipcMain.handle(APP_UPDATE_PROXY, async (event, url) => {
    return cb(url)
  })
}

export const invokeTorrentParse = (url) => ipcRenderer.invoke(APP_TORRENT_PARSE, url)

const showTorrentError = debounce(
  () => showAppError('Ошибка получения файла торрента, ссылка просрочена или торрент не существует'),
  1000
)

export const handleTorrentParse = () => {
  ipcMain.handle(APP_TORRENT_PARSE, async (event, url) => {
    url = new URL('https://' + global.upstreamDomainV1Tv + url)

    const abortCtrl = new AbortController()

    console.log('Downloading torrent file', url.toString())

    const timer = setTimeout(() => {
      abortCtrl.abort()
    }, 5000)

    const torrent = await catGirlFetch(url, { signal: abortCtrl.signal })
      .then(async x => {
        clearTimeout(timer)
        return {
          name: parse(x.headers.get('content-disposition')).filename || 'unknown.torrent',
          file: Buffer.from(await x.arrayBuffer()),
          url: 'https://' + global.upstreamDomainV1Tv + url
        }
      })
      .catch(() => {
        clearTimeout(timer)
      })

    if (torrent.name === 'unknown.torrent') {
      showTorrentError()
    }

    return {
      file: torrent?.file ? torrent.file.toString('base64') : '',
      name: torrent?.name || 'fuckyou',
      magnet: global.apiCacheService.torrentsRaw.get(+url.searchParams.get('id'))?.magnet
    }
  })
}
