import store from '@store'
import { meta, repository } from '@package'
import { Menu, shell } from 'electron'

import { t } from '@main/utils/i18n'

export const createAboutTemplate = () => [
  {
    role: 'about',
    label: t('main.about')
  },
  {
    label: t('main.telegram'),
    click: () => shell.openExternal(meta.links.telegram)
  },
  {
    label: t('main.sourceCode'),
    click: () => shell.openExternal(repository.url)
  },
  {
    type: 'separator'
  },
  {
    label: t('main.anilibria'),
    click: () => shell.openExternal(meta.links.anilibria)
  },
  {
    label: t('main.unofficial'),
    click: () => shell.openExternal(meta.links.unofficial)
  },
  {
    label: t('main.donate'),
    click: () => shell.openExternal(meta.links.donate)
  },
  {
    type: 'separator'
  },
  {
    role: 'minimize',
    label: t('main.minimize')
  },
  {
    role: 'quit',
    label: t('main.quit')
  }
]

export default class AppMenu {
  constructor () {
    this._menu = null
    this._mainWindow = null
    this._torrentWindow = null
  }

  init () {
    this._menu = Menu.buildFromTemplate(this._getMenuTemplate())
    this._mainWindow.setMenu(this._menu)
    this._torrentWindow.setMenu(this._menu)

    return this
  }

  setWindows (main = null, torrent = null) {
    this._mainWindow = main
    this._torrentWindow = torrent

    return this
  }

  _getMenuTemplate () {
    return [
      {
        label: meta.name,
        submenu: createAboutTemplate()
      },
      {
        label: t('main.debug'),
        submenu: [
          {
            role: 'toggledevtools',
            label: t('main.appConsole'),
            click: () => this._mainWindow.showDevTools()
          },
          {
            label: t('main.torrentConsole'),
            click: () => this._torrentWindow.showDevTools()
          },
          {
            type: 'separator'
          },
          {
            label: t('main.addNotification'),
            click: () => store.dispatch('notifications/setRelease', store.state.releases.data[0])
          },
          {
            label: t('main.logStore'),
            click: () => console.log(store.state)
          },
          {
            type: 'separator'
          },
          {
            role: 'forcereload',
            label: t('main.forceReload')
          }
        ]
      },
      {
        label: t('main.window'),
        submenu: [
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      }
    ]
  }
}
