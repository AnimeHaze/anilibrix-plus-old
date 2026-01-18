import store from '@store';
import { app } from 'electron';
import { getActiveOperaProxyURL, startOperaProxy, stopOperaProxy } from '@main/utils/opera-proxy';
import proxy from 'node-global-proxy';
import { getActiveForwardProxyURL, startForwardProxy } from '@main/utils/forward-proxy';

const OPERA_PROXY = 'http://opera'
const proxyServerSetting = store.state.app.settings.system.proxy
let proxyServer = ''
let _windows = []

export function getProxy () {
  return proxyServer
}

export async function setProxy (url) {
  let currentProxy = ''
  if (url) {
    try {
      new URL(url)
    } catch (e) {
      await startForwardProxy()
      return
    }

    if (url === OPERA_PROXY) {
      await startOperaProxy()
      currentProxy = getActiveOperaProxyURL()
    } else {
      await stopOperaProxy()
        .catch(console.error)

      currentProxy = url
    }
  } else {
    await startForwardProxy()
    currentProxy = getActiveForwardProxyURL()
  }

  for (const w of _windows) {
    console.log('Set renderer proxy', w, currentProxy)
    w.webContents.session.setProxy({ proxyRules: currentProxy, proxyBypassRules: 'localhost,127.0.0.1,*.local' })
  }

  proxy.setConfig({
    http: currentProxy,
    https: currentProxy
  })

  // Opera proxy fails when access localhost (why this shit happens only now and works fine for few anilibrix plus versions?)
  global.GLOBAL_AGENT.NO_PROXY = 'localhost,127.0.0.1,*.local';
  process.env.GLOBAL_AGENT_NO_PROXY = 'localhost,127.0.0.1,*.local';

  proxy.start();
}

export async function initProxy (windows) {
  _windows = windows

  if (app.commandLine.hasSwitch('proxy-server')) {
    proxyServer = app.commandLine.getSwitchValue('proxy-server')
  } else {
    proxyServer = proxyServerSetting
  }

  await setProxy(proxyServer)
}
