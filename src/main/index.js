import { applyAppSwitches } from './utils/app-switches';
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { execFile } from 'child_process'
import path from 'path'
import { meta, version } from '@package'
import { Main, Torrent } from './utils/windows'
import * as handlers from './handlers/app/app-handlers'
import { broadcastTorrentEvents } from './handlers/torrents/torrents-handler'
import Tray from './utils/tray'
import Menu from './utils/menu'
import { openWindowInterceptor } from './utils/windows/open-window-interceptor'
import { debounce } from 'lodash';
import store, { setUserId } from '@store'
import { initProxy, setProxy } from './utils/proxy';
import { initInternalServer } from './utils/internal-server';
import { stopOperaProxy } from '@main/utils/opera-proxy';
import { consoleLogToFile } from './utils/log-to-file';
import { initGlobals } from '@main/utils/init-globals';
import { createSplash } from '@main/utils/splash-window';
import { stopForwardProxy } from '@main/utils/forward-proxy';

consoleLogToFile({
  logFilePath: path.join(app.getPath('userData') + '/anilibrix.log')
})

applyAppSwitches()

const { discordActivity } = require('./utils/discord')
const {
  setActivity,
  destroy: destroyRichPresence
} = discordActivity()

// Remote
require('@electron/remote/main').initialize()

const trayController = new Tray()
const menuController = new Menu()

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

process.on('uncaughtException', error => console.log('Unhandled Error', error))
process.on('unhandledRejection', error => console.log('Unhandled Promise Rejection', error))

let isQuitting = false

app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault()
    isQuitting = true

    destroyRichPresence()
    await stopForwardProxy()
      .catch(console.error)

    await stopOperaProxy()
      .catch(console.error)

    app.quit()
  }
})

// Close app on all windows closed (relevant for mac users)
app.on('window-all-closed', () => {
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

const gotTheLock = process.env.NODE_ENV !== 'development' ? app.requestSingleInstanceLock() : true

console.log('GotTheLock', gotTheLock)

if (!gotTheLock) {
  app.quit()
} else {
  if (process.env.NODE_ENV !== 'development') {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      const mainWindow = Main.getWindow()
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()

        mainWindow.webContents.send('second-instance-opened', {
          commandLine,
          workingDirectory
        })
      }
    })
  }

  app.whenReady()
    .then(async () => {
      const splash = createSplash()

      const mWindowInstance = Main.createWindow({ title: meta.name })
      const tWindowInstance = Torrent.createWindow({ title: `${meta.name} Torrent` })

      const mainWindow = Main.getWindow()
      const torrentWindow = Torrent.getWindow()

      try {
        await initProxy([mainWindow, torrentWindow])
      } catch (e) {
        console.log('Proxy start err', e)
      }

      global.splash = splash

      console.log('Start init globals')
      await initGlobals()

      console.log('App is ready')
      global.internalServerPort = await initInternalServer()
      console.log('Internal server listens', global.internalServerPort)

      // Set user id
      await setUserId()

      mWindowInstance.loadUrl()
      tWindowInstance.loadUrl()

      if (process.env.NODE_ENV === 'development') mainWindow.webContents.openDevTools()

      require('@electron/remote/main').enable(mainWindow.webContents)
      require('@electron/remote/main').enable(torrentWindow.webContents)

      mainWindow
        .once('ready-to-show', () => {
          splash.destroy()
          mainWindow.show()
        })
        .on('close', () => {
          destroyRichPresence()
          app.quit()
        })

      // Create menu
      // Create tray icon
      menuController.setWindows(mainWindow, torrentWindow).init()
      trayController.createTrayIcon({
        iconPath: path.join(__dirname, '../../build/icons/tray/icon.png')
      }).setTooltip(meta.name)

      app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        if (store.state.app.settings.system.ignore_certs) {
          // Verification logic.
          event.preventDefault()
          console.log('Certificate error ignored', url, error)
          // eslint-disable-next-line standard/no-callback-literal
          callback(true)
        } else {
          // eslint-disable-next-line standard/no-callback-literal
          callback(false)
        }
      })

      function restart () {
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
      }

      globalShortcut.register('CmdOrCtrl+shift+R', restart)
      ipcMain.handle('restart', restart)
      ipcMain.handle('exit', () => app.quit())

      handlers.catchAppAboutEvent() // About dialog
      handlers.catchAppDockNumberEvent() // App dock number event
      handlers.catchAppDevtoolsMainEvent() // Devtools main
      handlers.catchAppDevtoolsTorrentEvent() // Devtools torrent
      handlers.catchEnableSystemSleepBlockerEvent() // Disable system sleep
      handlers.catchDisableSystemSleepBlockerEvent() // Enable system sleep
      handlers.handleSafeStorageEncrypt()
      handlers.handleRichPresense(setActivity)
      handlers.handleRand()
      handlers.handleShowConfig()
      handlers.handleTorrentParse()
      handlers.handleUpdateProxy(debounce(setProxy, 2000))
      broadcastTorrentEvents()
    })
}
