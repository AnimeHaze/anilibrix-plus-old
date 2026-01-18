import store from '@store';
import { app } from 'electron';
import { getActiveOperaProxyURL, startOperaProxy, stopOperaProxy } from '@main/utils/opera-proxy';
import proxy from 'node-global-proxy';

const OPERA_PROXY = 'http://opera'
const proxyServerSetting = store.state.app.settings.system.proxy
let proxyServer = ''
let _windows = []

export function getProxy () {
  return proxyServer
}

export async function setProxy (url) {
  if (url) {
    try { new URL(url) } catch (e) { return }

    if (url === OPERA_PROXY) {
      await startOperaProxy()
      proxyServer = getActiveOperaProxyURL()
    } else {
      await stopOperaProxy()
    }

    for (const w of _windows) {
      w.webContents.session.setProxy({ proxyRules: proxyServer })
    }

    proxy.setConfig({
      http: url,
      https: url
    })

    proxy.start();
  } else {
    proxy.system()
  }
}

export async function initProxy (windows) {
  _windows = windows

  if (app.commandLine.hasSwitch('proxy-server') || proxyServerSetting) {
    proxyServer = app.commandLine.getSwitchValue('proxy-server') || proxyServerSetting;

    await setProxy(proxyServer)
  }
}
