import { Mutex } from 'async-mutex'
import store from '@store'

const logs = !!process.env.DISCORD_RICH_PRESENCE_DEBUG
const logger = logs ? console.log : () => {}

const RECONNECT_DELAY = 1000
const UPDATE_INTERVAL = 1000

const CLEAR_ATTEMPTS = 5
const CLEAR_RETRY_DELAY = 200

export function discordActivity() {
  let client = null
  let activity = null
  let destroyed = false
  let connecting = false
  let reconnectTimeout = null
  let RPCClient = null

  const mutex = new Mutex()

  let stateVersion = 0
  let activityCleared = false

  const ensureReadableStream = () => {
    if (!global.ReadableStream) {
      const { ReadableStream } = require('readable-stream-polyfill')
      global.ReadableStream = ReadableStream
    }
  }

  const getDRPCClient = () => {
    if (!RPCClient) {
      const RPC = require('@xhayper/discord-rpc')
      RPCClient = RPC.Client
    }

    return RPCClient
  }

  const sleep = ms => {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  const scheduleReconnect = () => {
    if (destroyed || reconnectTimeout) {
      return
    }

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null
      connect()
    }, RECONNECT_DELAY)
  }

  const clearActivity = async currentClient => {
    if (activityCleared) {
      return true
    }

    const version = stateVersion

    for (let attempt = 1; attempt <= CLEAR_ATTEMPTS; attempt++) {
      if (
        destroyed ||
        currentClient !== client ||
        version !== stateVersion
      ) {
        return false
      }

      try {
        await currentClient.user.clearActivity()

        logger(
          `Discord clear activity (${attempt}/${CLEAR_ATTEMPTS})`
        )
      } catch (error) {
        logger(
          `Discord clear activity error (${attempt}/${CLEAR_ATTEMPTS})`,
          error
        )
      }

      if (
        destroyed ||
        currentClient !== client ||
        version !== stateVersion
      ) {
        return false
      }

      if (attempt < CLEAR_ATTEMPTS) {
        await sleep(CLEAR_RETRY_DELAY)
      }
    }

    activityCleared = true

    logger('Discord activity cleared')

    return true
  }

  const syncActivity = () => {
    return mutex.runExclusive(async () => {
      if (
        destroyed ||
        !client ||
        !client.isConnected
      ) {
        return
      }

      const currentClient = client
      const version = stateVersion
      const enabled = store.state.app.settings.system.drpc_enabled

      if (!enabled || !activity) {
        await clearActivity(currentClient)
        return
      }

      activityCleared = false

      if (
        version !== stateVersion ||
        currentClient !== client ||
        destroyed
      ) {
        return
      }

      try {
        await currentClient.user.setActivity(activity)

        logger('Discord set activity', activity)
        if (version !== stateVersion) {
          syncActivity()
        }
      } catch (error) {
        logger('Discord activity sync error', error)
      }
    })
  }

  const connect = async () => {
    if (destroyed || connecting || client) {
      return
    }

    connecting = true

    try {
      ensureReadableStream()

      const Client = getDRPCClient()

      client = new Client({
        clientId: process.env.DISCORD_CLIENT_ID
      })

      client.on('disconnected', async () => {
        logger('Discord rich presence disconnected')

        const disconnectedClient = client

        client = null
        stateVersion++
        activityCleared = false

        try {
          await disconnectedClient.destroy()
        } catch {}

        scheduleReconnect()
      })

      client.on('error', error => {
        logger('Discord rich presence error', error)
      })

      client.on('ready', () => {
        logger('Discord rich presence ready')

        stateVersion++
        activityCleared = false

        syncActivity()
      })

      await client.login()
    } catch (error) {
      logger('Discord login failed', error)

      client = null

      scheduleReconnect()
    } finally {
      connecting = false
    }
  }

  connect()

  const interval = setInterval(syncActivity, UPDATE_INTERVAL)

  return {
    setActivity(discordPresence) {
      activity = discordPresence
      stateVersion++

      activityCleared = false

      syncActivity()
    },

    async destroy() {
      if (destroyed) {
        return
      }

      destroyed = true
      stateVersion++

      clearInterval(interval)

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }

      const currentClient = client
      client = null

      logger('Discord rich presence destroyed')

      if (!currentClient) {
        return
      }

      await mutex.runExclusive(async () => {
        try {
          await currentClient.user?.clearActivity()
          await currentClient.user?.clearActivity()
          await currentClient.user?.clearActivity()
          logger('Discord clear activity')
        } catch (error) {
          logger('Discord clear activity error', error)
        }

        try {
          await currentClient.destroy()
        } catch (error) {
          logger('Discord destroy error', error)
        }
      })
    }
  }
}
