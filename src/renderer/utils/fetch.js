const originalFetch = require('isomorphic-fetch');
const fetchRetry = require('fetch-retry')(originalFetch)

const attempt = Symbol('attempt')

export function catGirlFetch(url, init = {}, timeout = 5000) {
  init[attempt] || (init[attempt] = 0)
  init.retryOn = function (attempt, error) {
    if (attempt > 10) return false // Stop retry after 10 attempt

    if (error !== null) {
      console.log(`Oh fuck, retrying, attempt number ${attempt + 1}`);
      return true // Retry every fucking error
    }
  }

  init.retryDelay = function (attempt, error, response) {
    return Math.pow(2, attempt) * 1000; // 1000, 2000, 4000
  }

  return Promise.race([
    fetchRetry(url, init)
      .then(x => {
        if (!x.ok && x.status === 404 && init.bypass404 !== true) {
          const err = new Error('Not found')
          err.status = 404
          throw err
        }

        return x
      })
      .then(async x => {
        if (init.raw) return x

        const text = await x.text()
        try {
          return JSON.parse(text)
        } catch (e) {
          console.log(text)
          throw e
        }
      })
      .catch(err => {
        if (err.status === 404) throw err

        init[attempt]++
        console.log('Parse err', init[attempt])
        if (init[attempt] > 5) return Promise.reject(err)
        return catGirlFetch(url, init)
      }),

    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout, mazafaka!')), timeout)
    )
  ])
}
