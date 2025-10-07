const originalFetch = require('isomorphic-fetch');

export function catGirlFetch(url, init) {
  return originalFetch(url, init)
}
