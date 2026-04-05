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

const operaFile = process.env.NODE_ENV === 'development'
  ? path.join(path.dirname(__dirname), '..', '..', 'build', osMap[process.platform], process.arch, 'opera-proxy' + (process.platform === 'win32' ? '.exe' : ''))
  : path.join(path.dirname(__dirname), '..', '..', 'bin', 'opera-proxy' + (process.platform === 'win32' ? '.exe' : ''))

async function stopOperaProxy() {
  if (spawnedProcess) {
    spawnedProcess.kill()
    spawnedProcess = null
    console.log('Opera Proxy stopped')
  }
}

async function startOperaProxy() {
  if (spawnedProcess) {
    return
  }

  port = await getPort()

  const opera = spawn(operaFile, ['-country', 'EU', '--bind-address', '127.0.0.1:' + port])

  spawnedProcess = opera

  console.log('Opera Proxy started on port ' + port)

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: opera.stderr
    })

    let isResolved = false

    rl.on('close', () => {
      console.log('Opera Proxy closed')
      if (!isResolved) {
        reject(new Error('Opera proxy closed before initialization'))
      }
    })

    rl.on('line', (line) => {
      console.log('Opera Proxy', line)

      if (line.includes('Init complete')) {
        console.log('Opera Proxy initialized successfully', port)
        isResolved = true
        resolve(port)
      }
    })

    opera.on('error', error => {
      console.log('Opera Proxy error:', error)
      if (!isResolved) {
        reject(error)
      }
    })

    setTimeout(() => {
      if (!isResolved) {
        console.warn('Timeout waiting for Opera proxy initialization')
        resolve(port)
      }
    }, 10000)
  })
}

function getActiveOperaProxyURL() {
  return 'http://127.0.0.1:' + port
}

export { startOperaProxy, stopOperaProxy, getActiveOperaProxyURL }
