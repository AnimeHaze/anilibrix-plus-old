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
    return
  }

  port = await getPort()

  const forward = spawn(forwardFile, ['-port', port, '-host', '127.0.0.1', '-verbose'])

  spawnedProcess = forward

  console.log('forward Proxy started on port ' + port)

  const rl = readline.createInterface({
    input: forward.stderr
  })

  rl.on('close', () => {
    console.log('forward Proxy closed')
  })

  rl.on('line', (line) => {
    console.log('forward Proxy', line)
  })

  forward.on('error', error => {
    console.log(error)
  })
}

function getActiveForwardProxyURL() {
  return 'http://127.0.0.1:' + port
}

export { startForwardProxy, stopForwardProxy, getActiveForwardProxyURL }
