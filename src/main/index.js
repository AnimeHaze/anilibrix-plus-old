import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import proxy from 'node-global-proxy';
import { execFile } from 'child_process'
// Main process
import path from 'path'
import fs from 'fs/promises'

// eslint-disable-next-line import/first
import { meta, version } from '@package'
import sentry from './utils/sentry'
// Store
import store, { getStore, setUserId } from '@store'
import express from 'express'
// Windows
import { Main, Torrent } from './utils/windows'

import { promisify } from 'util'

// Download handlers
// import {startingDownload, cancelingDownload, openingDownload} from "@main/handlers/download/downloadHandlers";
import { autoUpdater } from 'electron-updater'

// App Handlers
import {
  catchAppAboutEvent,
  catchAppDevtoolsMainEvent,
  catchAppDevtoolsTorrentEvent,
  catchAppDockNumberEvent,
  catchDisableSystemSleepBlockerEvent,
  catchEnableSystemSleepBlockerEvent, handleGetTitleV1New, handleGetTitleV2, handleGetTitleV3,
  handleRand,
  handleRichPresense,
  handleSafeStorageEncrypt,
  handleShowConfig,
  handleTorrentParse, handleUpdateProxy
} from '@main/handlers/app/appHandlers'

// Torrent Handlers
import { broadcastTorrentEvents } from '@main/handlers/torrents/torrentsHandler'

// Import tray and menu
import Tray from './utils/tray'
import Menu from './utils/menu'
import { openWindowInterceptor } from '@main/utils/windows/openWindowInterceptor'
import { consoleLogToFile } from '@main/utils/log-to-file';
import { debounce } from 'lodash';
import { catGirlFetch } from '../renderer/utils/fetch';
import { getActiveOperaProxyURL, startOperaProxy, stopOperaProxy } from '@main/utils/opera-proxy';
import { CacheManager } from '@main/utils/cache-manager';
let proxyServer
app.commandLine.appendSwitch('--no-sandbox')
const proxyServerValue = store.state.app.settings.system.proxy
console.log('Load proxy ', proxyServerValue)

if (app.commandLine.hasSwitch('proxy-server') || proxyServerValue) {
  proxyServer = app.commandLine.getSwitchValue('proxy-server') || proxyServerValue;

  (async () => {
    if (proxyServer === 'http://opera') {
      await startOperaProxy()
      proxyServer = getActiveOperaProxyURL()
    } else {
      await stopOperaProxy()
    }

    if (proxyServer) {
      proxy.setConfig({
        http: proxyServer === 'http://opera' ? getActiveOperaProxyURL() : proxyServer,
        https: proxyServer === 'http://opera' ? getActiveOperaProxyURL() : proxyServer
      })

      proxy.start();
    }
  })();
} else {
  proxy.system()
}

const { discordActivity } = require('./utils/discord')
const {
  setActivity,
  destroy: destroyRichPresence
} = discordActivity()

// Remote
require('@electron/remote/main').initialize()

// Create tray and menu controller
const trayController = new Tray()
const menuController = new Menu()

const cachePath = path.join(app.getPath('userData'), 'media-cache')
const cacheManager = new CacheManager(cachePath)

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

// Add command lines arguments
app.commandLine.appendSwitch('disable-site-isolation-trials')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

process.on('uncaughtException', error => {
  console.log('Unhandled Error', error)
})

process.on('unhandledRejection', error => {
  console.log('Unhandled Promise Rejection', error);
})

// Close app on all windows closed (relevant for mac users)
app.on('window-all-closed', () => {
  destroyRichPresence()
  app.quit()
})

app.on('web-contents-created', (event, webContents) => {
  webContents.on('did-finish-load', async () => {
    if (webContents.getURL().startsWith('https://id.vk.com/')) {
      webContents.on('will-redirect', async (event, url) => {
        if (!url.startsWith('https://www.anilibria.tv/')) {
          return true
        }

        const cookies = await webContents.session.cookies.get({ url: 'https://www.anilibria.tv' })

        const { value: sessionId } = cookies.find(cookie => cookie.name === 'PHPSESSID') || {}

        if (sessionId) {
          Main.getWindow().webContents.send('VK_CODE', sessionId)
        }

        BrowserWindow.fromWebContents(webContents).hide()

        webContents.on('did-finish-load', async () => {
          await webContents.session.clearStorageData()
          webContents.destroy()
        })

        return true
      });
    }
  })

  webContents.setWindowOpenHandler(openWindowInterceptor)
  webContents.setUserAgent(`${meta.name}/${version}`)
  webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload

    // Disable Node.js integration
    webPreferences.nodeIntegration = false

    // Enable sandbox
    webPreferences.contextIsolation = true
  })
})

// App ready handler
app.on('ready', async () => {
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (store.state.app.settings.system.ignore_certs) {
      // Verification logic.
      event.preventDefault()
      console.log('Certificate error ignored', url, error)
      callback(true)
    } else {
      callback(false)
    }
  })

  globalShortcut.register('CmdOrCtrl+shift+R', () => {
    console.log('Restart')

    const options = {
      args: process.argv.slice(1).concat(['--relaunch']),
      execPath: process.execPath
    };
    // Fix for .AppImage
    if (app.isPackaged && process.env.APPIMAGE) {
      execFile(process.env.APPIMAGE, options.args);
      app.quit()

      return
    }

    app.relaunch()
    app.exit()
  })

  consoleLogToFile({
    logFilePath: path.join(app.getPath('userData') + '/anilibrix.log')
  })

  // Set user id
  await setUserId()

  // Initialize sentry.io
  sentry({
    store: getStore(),
    source: 'main'
  })

  // Create windows
  Main.createWindow({ title: meta.name }).loadUrl()
  Torrent.createWindow({ title: `${meta.name} Torrent` }).loadUrl()

  const mainWindow = Main.getWindow()
  const torrentWindow = Torrent.getWindow()

  if (proxyServer) {
    mainWindow.webContents.session
      .setProxy({ proxyRules: proxyServer === 'http://opera' ? getActiveOperaProxyURL() : proxyServer })

    torrentWindow.webContents.session
      .setProxy({ proxyRules: proxyServer === 'http://opera' ? getActiveOperaProxyURL() : proxyServer })
  }

  if (process.env.NODE_ENV === 'development') mainWindow.webContents.openDevTools()

  require('@electron/remote/main').enable(mainWindow.webContents)
  require('@electron/remote/main').enable(torrentWindow.webContents)

  mainWindow
    .once('ready-to-show', () => {
      mainWindow.show()
      // autoUpdater.checkForUpdatesAndNotify() // Auto update
    })
    .on('close', () => {
      destroyRichPresence()
      app.quit()
    }) // Main window close event

  // Create menu
  // Create tray icon
  menuController.setWindows(mainWindow, torrentWindow).init()
  trayController.createTrayIcon({
    iconPath: path.join(__dirname, '../../build/icons/tray/icon.png')
  }).setTooltip(meta.name)

  appHandlers() // App handlers
  torrentHandlers() // Torrent handler
  // downloadHandlers(); // Download handlers

  const serv = express()

  serv.disable('x-powered-by')

  serv.get('/rutube/:id/*', (req, res) => {
    catGirlFetch(`https://rutube.ru/api/play/options/${req.params.id}/?no_404=true&referer&pver=v2`, {}, 3000)
      .then(x => {
        res.redirect(x.video_balancer.m3u8)
      })
      .catch(x => res.status(500).send())
  })

  fs.mkdir(cachePath).catch(e => console.log(e))

  serv.get('/proxy-static', async (req, res) => {
    try {
      if (!req.query.url) {
        return res.status(400)
          .json({ error: 'URL parameter is required' });
      }

      let parsedUrl;

      try {
        parsedUrl = new URL(req.query.url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return res
            .status(400)
            .json({ error: 'Only HTTP/HTTPS URLs are allowed' });
        }
      } catch (e) {
        return res
          .status(400)
          .json({ error: 'Invalid URL format' });
      }

      const cacheName = await cacheManager.getCacheKey(req.query.url);
      const { meta, buf, fromCache } = await cacheManager.getCache(cacheName, req.query.url);

      const headers = new Headers({
        'content-type': meta.headers['content-type'],
        'x-cache-hit': fromCache ? 'true' : 'false',
        'x-cache-age': fromCache ? `${Date.now() - meta.timestamp}ms` : '0'
      })

      res
        .set(Object.fromEntries(headers.entries()))
        .status(meta.status)
        .send(buf);
    } catch (e) {
      console.error('Proxy error:', e);
      res
        .status(500)
        .json({
          error: 'Internal Server Error',
          details: e.message
        });
    }
  });

  serv.listen(9384)
})

/**
 * App handlers
 * Show about handlers
 *
 * @return {void}
 */
const appHandlers = () => {
  catchAppAboutEvent() // About dialog
  catchAppDockNumberEvent() // App dock number event
  catchAppDevtoolsMainEvent() // Devtools main
  catchAppDevtoolsTorrentEvent() // Devtools torrent
  catchEnableSystemSleepBlockerEvent() // Disable system sleep
  catchDisableSystemSleepBlockerEvent() // Enable system sleep
  handleSafeStorageEncrypt()
  handleRichPresense(setActivity)
  handleRand()
  handleShowConfig()
  handleTorrentParse()
  handleGetTitleV2()
  handleGetTitleV3()
  handleGetTitleV1New()
  handleUpdateProxy(async (url) => {
    if (url === '') {
      proxy.system()
      const mainWindow = Main.getWindow()
      const torrentWindow = Torrent.getWindow()

      await stopOperaProxy()

      mainWindow.webContents.session
        .setProxy({ proxyRules: '' })

      torrentWindow.webContents.session
        .setProxy({ proxyRules: '' })

      console.log('system proxy set')
      return
    }

    if (url) {
      try {
        new URL(url)
      } catch (e) {
        return
      }

      console.log('Proxy url', url)
      setProxy(url)
    } else {
      proxy.system()
    }
  })
}

const setProxy = debounce(setProxyOrig, 2000)

function setProxyOrig (url) {
  (async () => {
    if (url === 'http://opera') {
      await startOperaProxy()
      url = getActiveOperaProxyURL()
    } else {
      await stopOperaProxy()
    }

    proxy.setConfig({
      http: url,
      https: url
    })
    console.log('set proxy', url)

    const mainWindow = Main.getWindow()
    const torrentWindow = Torrent.getWindow()

    mainWindow.webContents.session
      .setProxy({ proxyRules: url })

    torrentWindow.webContents.session
      .setProxy({ proxyRules: url })

    proxy.start()
  })();
}

/**
 * Torrents handlers
 *
 * @return {void}
 */
const torrentHandlers = () => {
  broadcastTorrentEvents() // broadcast all torrent events
}

/**
 * Download handlers
 * Start download, cancel and open file
 *
 * @return {void}
 */
const downloadHandlers = () => {
  // // Create storage
  // const storage = {};
  // // Handlers
  // startingDownload(storage, Main); // Start download
  // cancelingDownload(storage); // Cancel download
  // openingDownload(storage); // Open downloaded file
}
