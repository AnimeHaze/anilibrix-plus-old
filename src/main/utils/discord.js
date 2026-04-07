import store from '@store'

const logs = !!process.env.DISCORD_RICH_PRESENCE_DEBUG
const logger = logs ? console.log : () => {}

const RECONNECT_DELAY = 1000
const UPDATE_INTERVAL = 1000

export function discordActivity() {
  let client = null
  let activity = null
  let destroyed = false
  let reconnectTimeout = null
  let RPCClient = null

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
    } else {
      return RPCClient
    }
  }

  const scheduleReconnect = () => {
    if (destroyed || reconnectTimeout) return

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null
      connect()
    }, RECONNECT_DELAY)
  }

  const connect = async () => {
    if (destroyed) return

    try {
      ensureReadableStream()

      const Client = getDRPCClient()

      client = new Client({
        clientId: process.env.DISCORD_CLIENT_ID
      })

      client.on('disconnected', async () => {
        logger('Discord rich presence disconnected')

        try {
          await client.destroy()
        } catch {}

        client = null
        scheduleReconnect()
      })

      client.on('error', logger)

      client.on('ready', () => {
        logger('Discord rich presence ready')
      })

      await client.login()
    } catch (error) {
      logger('Discord login failed', error)
      scheduleReconnect()
    }
  }

  const syncActivity = async () => {
    if (
      destroyed ||
      !client ||
      !client.isConnected
    ) {
      return
    }

    const enabled = store.state.app.settings.system.drpc_enabled

    try {
      if (!enabled || !activity) {
        await client.user.clearActivity()
        return
      }

      await client.user.setActivity(activity)
      logger('Discord set activity', activity)
    } catch (error) {
      logger('Discord activity sync error', error)
    }
  }

  connect()

  const interval = setInterval(syncActivity, UPDATE_INTERVAL)

  return {
    setActivity(discordPresence) {
      activity = discordPresence
    },

    destroy() {
      destroyed = true
      clearInterval(interval)

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }

      logger('Discord rich presence destroyed')

      if (client) {
        client.destroy().catch(logger)
      }
    }
  }
}
