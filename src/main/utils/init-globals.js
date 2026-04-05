import fsp from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { catGirlFetch } from '@utils/fetch';
import * as dns from 'dns';

const defaultsValues = {
  upstreamDomainV1Tv: process.env.DEFAULT_V1_TV,
  cacheURL: process.env.CACHE_URL,
  cacheHashesURL: process.env.CACHE_HASHES_URL,
  overrideNet: false
}

const dnsGoogleURL = 'https://dns.google/resolve?type=TXT&name='
const dnsCloudflareURL = 'https://one.one.one.one/dns-query?type=TXT&name='
const dnsCloudflareAdGuardSecure = 'https://94.140.14.140/resolve?type=TXT&name='

function parseTxtRecord(record) {
  if (record.startsWith('"') && record.endsWith('"')) {
    return record.slice(1, -1)
  }

  return record
}

async function resolveTxtRecordGoogle(domain) {
  let timeoutId
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 600);

    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });

    return await catGirlFetch(dnsGoogleURL + domain, {
      cache: 'no-cache',
      signal: controller.signal
    })
      .then(e => e.json())
      .then(response => parseTxtRecord(response.Answer.pop().data))
  } finally {
    clearTimeout(timeoutId)
  }
}

async function resolveTxtRecordCloudflare(domain) {
  let timeoutId
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 600);

    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });

    return await catGirlFetch(dnsCloudflareURL + domain, {
      headers: {
        accept: 'application/dns-json'
      },
      cache: 'no-cache',
      signal: controller.signal
    })
      .then(e => e.json())
      .then(response => parseTxtRecord(response.Answer.pop().data))
  } finally {
    clearTimeout(timeoutId)
  }
}

async function resolveTxtRecordDefaultDns (domain) {
  let timeoutId
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 600);

    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });

    return new Promise((resolve, reject) => {
      if (controller.signal.aborted) {
        reject(new Error('Aborted'))
      }

      controller.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });

      dns.resolveTxt(domain, (err, addresses) => {
        if (err) {
          reject(err)
        } else {
          const addr = addresses?.pop()?.pop()

          if (!addr) {
            reject(new Error('No addresses found'))
          }

          resolve(addr)
        }
      })
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function resolveTxtRecordAdGuardSecure(domain) {
  let timeoutId
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 600);

    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });

    return await catGirlFetch(dnsCloudflareAdGuardSecure + domain, {
      headers: {
        accept: 'application/dns-json'
      },
      cache: 'no-cache',
      signal: controller.signal
    })
      .then(e => e.json())
      .then(response => parseTxtRecord(response.Answer.pop().data))
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function initGlobals() {
  try {
    const defaults = await fsp.readFile(path.join(app.getPath('userData'), 'defaults.json'), 'utf-8')
    const parsedDefaults = JSON.parse(defaults)
    defaultsValues.cacheURL = parsedDefaults.cacheURL
    defaultsValues.upstreamDomainV1Tv = parsedDefaults.upstreamDomainV1Tv
    defaultsValues.overrideNet = parsedDefaults.overrideNet

    console.log('Defaults file read', parsedDefaults)
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Defaults file not found, using default values')
    } else {
      console.error('Can\'t read defaults file', e)
    }
  }

  if (defaultsValues.overrideNet) {
    if (defaultsValues.upstreamDomainV1Tv) {
      global.upstreamDomainV1Tv = defaultsValues.upstreamDomainV1Tv
    }

    if (defaultsValues.cacheURL) {
      global.cacheURL = defaultsValues.cacheURL
    }

    if (defaultsValues.cacheHashesURL) {
      global.cacheHashesURL = defaultsValues.cacheHashesURL
    }
    return
  }

  let promiseResolve = null
  let promiseReject = null
  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })

  let resolved = false
  let count = 4

  function processResult (provider, success) {
    return function (result) {
      if (success) {
        if (!resolved) {
          count--
          const [upstreamDomainV1Tv, cacheURL] = result
          defaultsValues.upstreamDomainV1Tv = upstreamDomainV1Tv
          defaultsValues.cacheURL = cacheURL
          resolved = true
          console.log(`Winner resolved txt record with ${provider}`, result)
          promiseResolve()
        }
      } else if (!resolved) {
        count--
        if (count === 0) {
          promiseReject()
          console.log('Failed to resolve txt record with all providers')
        } else {
          console.log(`Failed to resolve txt record with ${provider} (${result.message}). Wait for ${count} others.`)
        }
      }
    }
  };

  async function startResolve () {
    await Promise.all([
      Promise.all([
        resolveTxtRecordGoogle('anilibrix-plus-v1-tv.animehaze.me'),
        resolveTxtRecordGoogle('anilibrix-plus-cache.animehaze.me'),
        resolveTxtRecordGoogle('anilibrix-plus-cache-hashes.animehaze.me')
      ]).then(processResult('google', true)).catch(processResult('google', false)),
      Promise.all([
        resolveTxtRecordCloudflare('anilibrix-plus-v1-tv.animehaze.me'),
        resolveTxtRecordCloudflare('anilibrix-plus-cache.animehaze.me'),
        resolveTxtRecordCloudflare('anilibrix-plus-cache-hashes.animehaze.me')
      ]).then(processResult('cloudflare', true)).catch(processResult('cloudflare', false)),
      Promise.all([
        resolveTxtRecordAdGuardSecure('anilibrix-plus-v1-tv.animehaze.me'),
        resolveTxtRecordAdGuardSecure('anilibrix-plus-cache.animehaze.me'),
        resolveTxtRecordAdGuardSecure('anilibrix-plus-cache-hashes.animehaze.me')
      ]).then(processResult('adguard', true)).catch(processResult('adguard', false))
    ])

    if (!resolved) {
      Promise.all([
        resolveTxtRecordDefaultDns('anilibrix-plus-v1-tv.animehaze.me'),
        resolveTxtRecordDefaultDns('anilibrix-plus-cache.animehaze.me'),
        resolveTxtRecordDefaultDns('anilibrix-plus-cache-hashes.animehaze.me')
      ]).then(processResult('default-dns', true)).catch(processResult('default-dns', false))
    }
  }

  startResolve()

  try {
    await promise
    console.log('Txt record resolved successfully')
    global.upstreamDomainV1Tv = defaultsValues.upstreamDomainV1Tv
    global.cacheURL = defaultsValues.cacheURL
    global.cacheHashesURL = defaultsValues.cacheHashesURL
  } catch (e) {
    console.error('Failed to resolve txt record, using default values', e)
    global.upstreamDomainV1Tv = defaultsValues.upstreamDomainV1Tv
    global.cacheURL = defaultsValues.cacheURL
    global.cacheHashesURL = defaultsValues.cacheHashesURL
  }
}
