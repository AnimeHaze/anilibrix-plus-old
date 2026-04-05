import { lookup } from 'dns';

const originalFetch = require('isomorphic-fetch');

let fixWwndChecked = false
let fixWwwdNeeded = false
const DOMAIN = 'wwnd.space'
const OLD_IP = '78.46.255.254'
const NEW_IP = '31.184.217.238'

export async function catGirlFetch(url, init) {
  if (!fixWwndChecked) {
    await new Promise((resolve) => {
      lookup(DOMAIN, (err, address, family) => {
        if (!err) {
          if (address === OLD_IP && family === 4) {
            fixWwwdNeeded = true
          }

          fixWwndChecked = true
        }

        resolve()
      })
    })

    console.log('EU IP OF WWND.SPACE FOUND, ENABLE REWRITE')
  }

  const u = new URL(url)

  if (!init) {
    init = {}
  }

  if (fixWwwdNeeded && u.host === DOMAIN) {
    url = url.replace(DOMAIN, NEW_IP)

    if (!init.headers) {
      init.headers = {}
    }

    init.headers.Host = DOMAIN
    console.log('FIX WWND.SPACE REQUEST')
  }

  init.redirect = 'follow'
  init.follow = 10000

  return originalFetch(url, init)
}
