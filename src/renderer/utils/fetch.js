import { lookup } from 'dns'

const originalFetch = require('isomorphic-fetch')

const ROUTES = [
  {
    name: 'WWND',
    host: 'wwnd.space'
  },
  {
    name: 'WWND REWRITE',
    host: 'wwnd.space',
    rewriteIp: '31.184.217.238'
  },
  {
    name: 'ANILIBRIA',
    host: 'anilibria.tv'
  }
]

const DOMAIN = 'wwnd.space'
const OLD_IP = '78.46.255.254'

let fixWwndChecked = false
let fixWwndNeeded = false

function statusPriority(status) {
  if (status >= 200 && status < 300) {
    return 3
  }

  if (status >= 300 && status < 400) {
    return 2
  }

  if (status >= 400 && status < 500) {
    return 1
  }

  if (status >= 500 && status < 600) {
    return 0
  }

  return -1
}

async function checkWwndRewrite() {
  if (fixWwndChecked) {
    return fixWwndNeeded
  }

  try {
    const result = await new Promise((resolve) => {
      lookup(DOMAIN, { family: 4 }, (err, address) => {
        if (err) {
          resolve({
            ok: false,
            error: err
          })

          return
        }

        resolve({
          ok: true,
          address
        })
      })
    })

    if (!result.ok) {
      console.log(
        `[WWND DNS] DNS lookup failed: ${result.error.code || result.error.message}`
      )

      fixWwndNeeded = false
      fixWwndChecked = true

      return false
    }

    console.log(
      `[WWND DNS] ${DOMAIN} resolved to ${result.address}`
    )

    if (result.address === OLD_IP) {
      fixWwndNeeded = true

      console.log(
        `[WWND DNS] OLD IP detected (${OLD_IP}), rewrite route ENABLED`
      )
    } else {
      fixWwndNeeded = false

      console.log(
        `[WWND DNS] IP is not ${OLD_IP}, rewrite route DISABLED`
      )
    }

    fixWwndChecked = true

    return fixWwndNeeded
  } catch (error) {
    console.log(
      `[WWND DNS] Unexpected DNS error: ${error.code || error.message}`
    )

    fixWwndNeeded = false
    fixWwndChecked = true

    return false
  }
}

function buildRouteRequest(route, originalUrl, originalInit, signal) {
  if (route.original) {
    return {
      url: originalUrl,
      init: {
        ...(originalInit || {}),
        headers: new Headers(originalInit?.headers || {}),
        redirect: 'follow',
        follow: 10,
        signal
      }
    }
  }

  const url = new URL(originalUrl)

  const init = {
    ...(originalInit || {}),
    headers: new Headers(originalInit?.headers || {}),
    redirect: 'follow',
    follow: 10,
    signal
  }

  if (route.rewriteIp) {
    url.hostname = route.rewriteIp
    init.headers.set('Host', route.host)
  } else {
    url.hostname = route.host
  }

  return {
    url: url.toString(),
    init
  }
}

async function requestRoute(
  route,
  originalUrl,
  originalInit,
  controller
) {
  const startedAt = Date.now()

  const request = buildRouteRequest(
    route,
    originalUrl,
    originalInit,
    controller.signal
  )

  const routeLabel =
    `[${route.name}][${route.rewriteIp || 'ORIG IP'}]`

  console.log(
    `[FETCH] ${routeLabel} START ${request.url}`
  )

  try {
    const response = await originalFetch(
      request.url,
      request.init
    )

    const elapsed = Date.now() - startedAt

    console.log(
      `[FETCH] ${routeLabel} HTTP ${response.status} ${response.statusText || ''} (${elapsed} ms)`
    )

    return {
      route,
      response,
      elapsed,
      available: true,
      priority: statusPriority(response.status)
    }
  } catch (error) {
    const elapsed = Date.now() - startedAt

    if (
      error?.name === 'AbortError' ||
      controller.signal.aborted
    ) {
      console.log(
        `[FETCH] ${routeLabel} ABORTED (${elapsed} ms)`
      )

      return {
        route,
        response: null,
        elapsed,
        available: false,
        aborted: true,
        error,
        priority: -1
      }
    }

    console.log(
      `[FETCH] ${routeLabel} FAILED (${elapsed} ms)`
    )

    console.log(
      `[FETCH] ${routeLabel} ERROR ${error.code || error.name || 'Error'}: ${error.message}`
    )

    return {
      route,
      response: null,
      elapsed,
      available: false,
      aborted: false,
      error,
      priority: -1
    }
  }
}

export async function catGirlFetch(
  url,
  init,
  bypassMulti = true
) {
  if (bypassMulti) {
    return originalFetch(url, {
      ...(init || {}),
      redirect: 'follow',
      follow: 10
    })
  }

  const originalUrl = new URL(url)
  const rewriteEnabled = await checkWwndRewrite()
  const originalHostname = originalUrl.hostname.toLowerCase()

  const routes = [
    {
      name: 'ORIGINAL',
      original: true
    },
    ...ROUTES
  ].filter((route) => {
    if (route.rewriteIp && !rewriteEnabled) {
      return false
    }

    if (
      !route.original &&
      !route.rewriteIp &&
      route.host === originalHostname
    ) {
      return false
    }

    return true
  })

  console.log(
    `[FETCH] REQUEST ${originalUrl.toString()}`
  )

  console.log(
    `[FETCH] ROUTES ${routes
      .map((route) => route.name)
      .join(', ')}`
  )

  const controllers = new Map(
    routes.map((route) => [
      route,
      new AbortController()
    ])
  )

  const requests = routes.map((route) =>
    requestRoute(
      route,
      url,
      init,
      controllers.get(route)
    )
  )

  const results = []

  let winner = null

  await new Promise((resolve) => {
    let completed = 0
    let resolved = false

    for (const request of requests) {
      request.then((result) => {
        completed++
        results.push(result)

        if (resolved) {
          return
        }

        if (!result.available) {
          if (completed === requests.length) {
            resolved = true
            resolve()
          }

          return
        }

        if (
          result.response.status >= 200 &&
          result.response.status < 300
        ) {
          winner = result
          resolved = true

          console.log(
            `[FETCH] WINNER [${result.route.name}][${result.route.rewriteIp || 'ORIG IP'}] HTTP ${result.response.status}`
          )

          for (const route of routes) {
            if (route !== result.route) {
              const controller = controllers.get(route)

              if (controller && !controller.signal.aborted) {
                console.log(
                  `[FETCH] ABORT [${route.name}][${route.rewriteIp || 'ORIG IP'}]`
                )

                controller.abort()
              }
            }
          }

          resolve()

          return
        }

        if (completed === requests.length) {
          resolved = true
          resolve()
        }
      })
    }
  })

  if (winner) {
    console.log(
      `[FETCH] SELECTED [${winner.route.name}][${winner.route.rewriteIp || 'ORIG IP'}] HTTP ${winner.response.status}`
    )

    return winner.response
  }

  const httpResults = results
    .filter((result) => result.available)
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }

      return a.response.status - b.response.status
    })

  if (httpResults.length) {
    winner = httpResults[0]

    console.log(
      '[FETCH] NO 2XX RESPONSE'
    )

    console.log(
      `[FETCH] SELECTED [${winner.route.name}][${winner.route.rewriteIp || 'ORIG IP'}] HTTP ${winner.response.status}`
    )

    console.log(
      `[FETCH] HTTP RESULTS ${httpResults
        .map(
          (result) =>
            `${result.route.name}[${result.route.rewriteIp || 'ORIG IP'}]=${result.response.status}`
        )
        .join(', ')}`
    )

    return winner.response
  }

  console.log(
    '[FETCH] ALL ROUTES FAILED'
  )

  for (const result of results) {
    if (result.aborted) {
      continue
    }

    console.log(
      `[FETCH] [${result.route.name}][${result.route.rewriteIp || 'ORIG IP'}] UNAVAILABLE: ${
        result.error?.code ||
        result.error?.name ||
        'Error'
      }: ${
        result.error?.message ||
        'Unknown error'
      }`
    )
  }

  const errorResult = results
    .filter(
      (result) =>
        !result.available &&
        !result.aborted
    )
    .sort((a, b) => a.elapsed - b.elapsed)[0]

  throw errorResult?.error || new Error(
    'All configured routes are unavailable'
  )
}
