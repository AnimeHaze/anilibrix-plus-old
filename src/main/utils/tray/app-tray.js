import { createAboutTemplate } from '../menu/app-menu'
import { Menu, nativeImage, Tray } from 'electron'

export default class {
  constructor () {
    this._tray = null
  }

  /**
   * Get tray template
   *
   * @return Array
   */
  getTemplate () {
    return [...createAboutTemplate()]
  }

  /**
   * Create tray icon
   *
   * @param MainWindow
   * @param iconPath
   * @return this
   */
  createTrayIcon ({ iconPath }) {
    this._tray = new Tray(nativeImage.createFromPath(iconPath))
    this._tray.setContextMenu(Menu.buildFromTemplate(this.getTemplate()))
    this._tray.setIgnoreDoubleClickEvents(true)

    return this
  };

  /**
   * Set tooltip
   *
   * @param tooltip
   * @return this
   */
  setTooltip (tooltip) {
    this._tray.setToolTip(tooltip)

    return this
  }

  refreshMenu () {
    if (this._tray) {
      this._tray.setContextMenu(Menu.buildFromTemplate(this.getTemplate()))
    }

    return this
  }
}
