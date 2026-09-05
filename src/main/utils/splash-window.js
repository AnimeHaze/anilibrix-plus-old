import { app, BrowserWindow, dialog, ipcMain, nativeImage } from 'electron'
import fs from 'fs'
import archiver from 'archiver'
import * as path from 'path'

import { getFacts, t } from '@main/utils/i18n'
import ejs from 'ejs'
import store from '@store'
import { resolveAppLocale } from '@shared/i18n/resolveLocale';

function resolveSystemLocale () {
  const preferred = typeof app.getPreferredSystemLanguages === 'function'
    ? app.getPreferredSystemLanguages()[0]
    : null

  return preferred || app.getLocale()
}

function getSplashHTML() {
  try {
    const templatePath = path.join(__dirname, '..', 'splash.ejs');

    const template = fs.readFileSync(templatePath, 'utf8');

    return ejs.render(template, {
      t: (key) => {
        return t(key);
      }
    })
  } catch (error) {
    console.error('Error rendering splash template:', error);

    return ''
  }
}

export function createSplash () {
  const splash = new BrowserWindow({
    title: t('main.splashStartTitle'),
    icon: nativeImage.createFromPath(
      path.join(process.resourcesPath, 'icons', 'icon.png')
    ),
    show: false,
    frame: false,
    resizable: false,
    width: 400,
    height: 500,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getSplashHTML())}`)
    .catch(error => {
      console.error('Error loading splash window:', error)
    })

  splash.once('ready-to-show', () => {
    const storedLocale = store.state.app.settings.system.language
    let systemLocale = null

    try {
      systemLocale = resolveSystemLocale()
    } catch (error) {
      console.error('Failed to resolve system locale', error)
    }

    const locale = resolveAppLocale({
      storedLocale,
      systemLocale,
      rendererLocale: systemLocale
    })

    console.log('Locale:', locale, storedLocale, systemLocale)

    const facts = getFacts(locale)
    const randomFact = facts[Math.floor(Math.random() * facts.length)]

    splash.webContents.send('update', {
      payload: {
        text: randomFact,
        type: 'info'
      }
    })

    splash.center()
    splash.show()
    splash.focus()

    splash.on('closed', () => {
      splash.removeAllListeners()
    })
  })

  splash.setMessage = (text, type = 'info', button = false) => {
    try {
      splash.webContents.postMessage('update', {
        payload: {
          text,
          type,
          button
        }
      })
    } catch (error) {
      console.error('Error updating splash window:', error)
    }
  }

  splash.reloadLocale = () => {
    if (splash.isDestroyed() || splash.webContents.isDestroyed()) {
      return
    }

    splash.setTitle(t('main.splashStartTitle'))
    splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getSplashHTML())}`)
      .catch(error => console.error('Error reloading splash window locale:', error))
  }

  return splash
}

ipcMain.handle('save-logs', async () => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: t('main.saveLogsDialog'),
    defaultPath: 'anilibrix-logs.zip',
    properties: ['dontAddToRecent', 'showOverwriteConfirmation']
  })

  if (canceled) {
    return false
  }

  const dir = app.getPath('userData')
  const output = fs.createWriteStream(filePath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  return new Promise((resolve, reject) => {
    output.on('close', function () {
      resolve(true)
    })

    archive.on('warning', reject)
    archive.on('error', reject)

    archive.pipe(output)
    archive.glob('anilibrix.log*', { cwd: dir })
    archive.finalize()
  })
})
