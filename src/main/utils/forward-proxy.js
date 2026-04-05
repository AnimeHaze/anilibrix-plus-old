const path = require('path');
const readline = require('readline');
const getPort = require('get-port');
const spawn = require('cross-spawn');

const osMap = {
  darwin: 'mac',
  win32: 'win',
  linux: 'linux'
}

let port
let spawnedProcess

const forwardFile = process.env.NODE_ENV === 'development'
  ? path.join(path.dirname(__dirname), '..', '..', 'build', osMap[process.platform], process.arch, 'forward-proxy' + (process.platform === 'win32' ? '.exe' : ''))
  : path.join(path.dirname(__dirname), '..', '..', 'bin', 'forward-proxy' + (process.platform === 'win32' ? '.exe' : ''))

async function stopForwardProxy() {
  if (spawnedProcess) {
    spawnedProcess.kill()
    spawnedProcess = null
    console.log('forward Proxy stopped')
  }
}

async function startForwardProxy() {
  if (spawnedProcess) {
    console.log('Forward Proxy already started, skipping')
    return
  }

  let resolve, reject
  const forwardPromise = new Promise((_r, _rj) => {
    resolve = _r
    reject = _rj
  })

  port = await getPort()

  const forward = spawn(forwardFile, ['-port', port, '-host', '127.0.0.1', '-verbose'])

  spawnedProcess = forward

  forward.stdout.on('data', (data) => {
    if (data.toString().includes('OK_SUCCESS')) {
      resolve()
      console.log('Forward Proxy send OK_SUCCESS')
      return
    }
    console.log('Forward Proxy:', data.toString())
  })

  forward.on('error', error => {
    console.log(error)
    reject()
  })

  forward.on('close', () => {
    console.log('forward Proxy closed')
    reject()
  })

  forward.on('disconnect', () => {
    console.log('forward Proxy disconnected')
    reject()
  })

  return forwardPromise
}

function getActiveForwardProxyURL() {
  return 'http://127.0.0.1:' + port
}

export { startForwardProxy, stopForwardProxy, getActiveForwardProxyURL }
