import { HttpToSocks5Proxy } from './http-to-socks'
import { URL } from 'url'
import getPort from 'get-port';

let proxyInstance = null
let localPort = 0
let activeSocksUrl = null

export async function startSocksHttpProxy(socksUrl) {
  if (proxyInstance && activeSocksUrl === socksUrl) {
    return getActiveSocksHttpProxyURL()
  }

  await stopSocksHttpProxy()

  const parsed = new URL(socksUrl)

  if (!['socks5:', 'socks:'].includes(parsed.protocol)) {
    throw new Error('Only socks5:// is supported')
  }

  const socksHost = parsed.hostname
  const socksPort = parseInt(parsed.port || '1080', 10)
  const socksUser = parsed.username || null
  const socksPass = parsed.password || null

  localPort = await getPort()

  proxyInstance = new HttpToSocks5Proxy({
    localHost: '127.0.0.1',
    localPort,
    socksHost,
    socksPort,
    socksUser,
    socksPass
  })

  await proxyInstance.start()
  activeSocksUrl = socksUrl

  console.log(`[socks-http-proxy] started -> ${getActiveSocksHttpProxyURL()} → ${socksUrl}`)
  return getActiveSocksHttpProxyURL()
}

export function getActiveSocksHttpProxyURL() {
  if (!proxyInstance) return null
  return `http://127.0.0.1:${localPort}`
}

export async function stopSocksHttpProxy() {
  if (proxyInstance) {
    await proxyInstance.stop()
    proxyInstance = null
    activeSocksUrl = null
    console.log('[socks-http-proxy] stopped')
  }
}
