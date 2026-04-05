import store from '@store'
import { meta, repository } from '@package'
import { Menu, shell } from 'electron'

export const aboutTemplate = [
  {
    role: 'about',
    label: 'About the application'
  },
  {
    label: 'Telegram Channel',
    click: () => shell.openExternal(meta.links.telegram)
  },
  {
    label: 'Source code on GitHub',
    click: () => shell.openExternal(repository.url)
  },
  {
    type: 'separator'
  },
  {
    label: 'Anilibria',
    click: () => shell.openExternal(meta.links.anilibria)
  },
  {
    label: 'Channel of unofficial releases',
    click: () => shell.openExternal(meta.links.unofficial)
  },
  {
    label: 'Support the project',
    click: () => shell.openExternal(meta.links.donate)
  },
  {
    type: 'separator'
  },
  {
    role: 'minimize',
    label: 'Minimize application'
  },
  {
    role: 'quit',
    label: 'Quit the application'
  }
]

export default class AppMenu {
  constructor () {
    this._menu = null
    this._mainWindow = null
    this._torrentWindow = null
  }

  /**
   * Init menu
   *
   * @return AppMenu
   */
  init () {
    // Build from template
    this._menu = Menu.buildFromTemplate(this._getMenuTemplate())

    // Set menu
    this._mainWindow.setMenu(this._menu)
    this._torrentWindow.setMenu(this._menu)

    return this
  }

  /**
   * Set window
   *
   * @param main
   * @param torrent
   * @return {AppMenu}
   */
  setWindows (main = null, torrent = null) {
    this._mainWindow = main
    this._torrentWindow = torrent

    return this
  }

  /**
   * Get menu template
   *
   * @return Array
   * @private
   */
  _getMenuTemplate () {
    return [
      {
        label: meta.name,
        submenu: aboutTemplate
      },
      {
        label: 'Debugging',
        submenu: [
          {
            role: 'toggledevtools',
            label: 'Application console',
            click: () => this._mainWindow.showDevTools()
          },
          {
            label: 'Console torrent server',
            click: () => this._torrentWindow.showDevTools()
          },
          {
            type: 'separator'
          },
          {
            label: 'Add notification to storage',
            click: () => store.dispatch('notifications/setRelease', store.state.releases.data[0])
          },
          {
            label: 'Show storage data in console',
            click: () => console.log(store.state)
          },
          {
            type: 'separator'
          },
          {
            role: 'forcereload',
            label: 'Restart the application'
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      }
    ]
  }
};
