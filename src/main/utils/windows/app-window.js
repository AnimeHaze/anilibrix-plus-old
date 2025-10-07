import { BrowserWindow, app  } from 'electron'
import windowStateKeeper from 'electron-window-state'
import path from 'path'

export default class Window {
  /**
   * Constructor
   *
   * @return Window
   */
  constructor () {
    this._window = null
  }

  /**
   * Get window configuration
   *
   * @return Object
   */
  getWindowConfiguration () {
    return {}
  }

  /**
   * Get window url
   *
   * @return String|null
   */
  getWindowUrl () {
    return null
  }

  /**
   * Get window
   *
   * @return {BrowserWindow|null}
   */
  getWindow () {
    return this._window
  }

  /**
   * Create window
   *
   * @return this
   */
  createWindow (configuration) {
    const windowsConfig = this.getWindowConfiguration()
    let opts = { ...windowsConfig, ...configuration }

    const mainWindowState = windowStateKeeper({
      file: 'window-state.json',
      defaultWidth: opts.width,
      defaultHeight: opts.height,
      fullScreen: false
    })

    console.log('Window-state: is Main?', this.isMain ?? false)

    if (this.isMain === true) {
      // Create the window using the state information
      opts = Object.assign(opts, {
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height
      })

      this._window = new BrowserWindow(opts)

      // Let us register listeners on the window, so we can update the state
      // automatically (the listeners will be removed when the window is closed)
      // and restore the maximized or full screen state
      mainWindowState.manage(this._window)
    } else {
      this._window = new BrowserWindow(opts)
    }

    return this
  }

  /**
   * Load window url
   *
   * @return this
   */
  loadUrl () {
    const window = this.getWindow()
    const windowUrl = this.getWindowUrl()

    if (window && windowUrl) {
      window.loadURL(windowUrl)
    }

    return this
  }

  /**
   * Send to window
   *
   * @param channel
   * @param payload
   */
  sendToWindow (channel, payload) {
    const window = this.getWindow()
    if (window) {
      window.webContents.send(channel, payload)

      if (process.env.NODE_ENV === 'development') {
        console.log({
          channel,
          payload
        })
      }
    }

    return this
  }

  /**
   * Show devtools
   *
   * @return void
   */
  showDevTools () {
    this.getWindow().openDevTools({ mode: 'detach' })
  }
}
