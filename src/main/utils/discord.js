import store from "@store";

const RPC = require('discord-rpc')

const logs = !!process.env.DISCORD_RICH_PRESENCE_DEBUG
const logger = logs ? console.log : () => {}

export function discordActivity () {
  let client
  let closed = false

  const assembleClient = (timeout = 5000, old = true) => {
    if (old && client !== null && client.transport.socket !== null) client.destroy()
    client = new RPC.Client({ transport: 'ipc' })
    client.on('error', (err) => logger(err))
    client.on('ready', () => {
      logger('Discord rich presence ready')

      client.transport.socket.on('close', () => {
        if (closed) return
        logger('Discord rich presence reconnect')
        assembleClient()
      })
    })

    setTimeout(async () => {
      try {
        await client.login({ clientId: process.env.DISCORD_CLIENT_ID })
      } catch (e) {
        logger(e)
        setTimeout(() => {
          logger('Discord rich presence reconnect')
          assembleClient()
        }, 5000)
      }
    }, timeout)
  }

  assembleClient(1000, false)

  process.on('unhandledRejection', (e) => {
    if (e.message === 'Could not connect') {
      logger('Discord rich presence: Could not connect ! Retrying...')
      assembleClient()
    } else {
      throw e
    }
  })

  let activity = {}

  const interval = setInterval(() => {
    if (store.state.app.settings.system.drpc_enabled) {
      if (client && client.transport.socket) {
        if (Object.keys(activity).length > 0) {
          client.setActivity(activity)
            .then(() => logger('Discord set activity', activity))
            .catch(err => logger('Discord set activity error', err))
        } else {
          client.clearActivity().catch(() => {})
        }
      }
    } else {
      client.clearActivity().catch(() => {})
    }
  }, 1000)

  return {
    setActivity: function (discordPresence) {
      activity = discordPresence
    },
    destroy: () => {
      closed = true
      clearInterval(interval)
      if (client && client.transport.socket) client.destroy()
    }
  }
}
