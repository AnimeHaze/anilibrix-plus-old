import { SocksClient } from 'socks'
import http from 'http'

const { URL } = require('url');

export class HttpToSocks5Proxy {
  /**
   * @param {Object} options
   * @param {string} [options.localHost='127.0.0.1']
   * @param {number} [options.localPort=8080]
   * @param {string} [options.socksHost='127.0.0.1']
   * @param {number} [options.socksPort=1080]
   * @param {string|null} [options.socksUser=null]
   * @param {string|null} [options.socksPass=null]
   */
  constructor(options = {}) {
    this.localHost = options.localHost || '127.0.0.1';
    this.localPort = options.localPort || 8080;
    this.socksHost = options.socksHost || '127.0.0.1';
    this.socksPort = options.socksPort || 1080;
    this.socksUser = options.socksUser || null;
    this.socksPass = options.socksPass || null;

    this.server = null;
  }

  _createSocksOptions(host, port) {
    const opts = {
      proxy: {
        host: this.socksHost,
        port: this.socksPort,
        type: 5
      },
      command: 'connect',
      destination: { host, port }
    };

    if (this.socksUser && this.socksPass) {
      opts.proxy.userId = this.socksUser;
      opts.proxy.password = this.socksPass;
    }

    return opts;
  }

  _handleHttpRequest(clientReq, clientRes) {
    let target;
    try {
      target = new URL(clientReq.url);
    } catch {
      clientRes.writeHead(400);
      clientRes.end('Bad Request');
      return;
    }

    const destHost = target.hostname;
    const destPort = parseInt(target.port || '80', 10);

    SocksClient.createConnection(this._createSocksOptions(destHost, destPort))
      .then(({ socket }) => {
        const path = target.pathname + target.search;
        let headers = `${clientReq.method} ${path} HTTP/${clientReq.httpVersion}\r\n`;

        for (const [key, value] of Object.entries(clientReq.headers)) {
          const lower = key.toLowerCase();
          if (['proxy-connection', 'connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'upgrade'].includes(lower)) {
            continue;
          }
          headers += `${key}: ${value}\r\n`;
        }
        headers += '\r\n';

        socket.write(headers);
        clientReq.pipe(socket);
        socket.pipe(clientRes);

        socket.on('error', (err) => {
          console.error('[HTTP]', err.message);
          if (!clientRes.headersSent) {
            clientRes.writeHead(502);
            clientRes.end('Bad Gateway');
          }
        });
      })
      .catch((err) => {
        console.error('[HTTP] SOCKS error:', err.message);
        clientRes.writeHead(502);
        clientRes.end('Bad Gateway');
      });
  }

  _handleConnect(req, clientSocket, head) {
    const [host, portStr] = req.url.split(':');
    const port = parseInt(portStr || '443', 10);

    SocksClient.createConnection(this._createSocksOptions(host, port))
      .then(({ socket }) => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');

        if (head && head.length) {
          socket.write(head);
        }

        socket.pipe(clientSocket);
        clientSocket.pipe(socket);

        socket.on('error', (err) => {
          console.error('[CONNECT]', err.message);
          clientSocket.destroy();
        });

        clientSocket.on('error', (err) => {
          console.error('[CLIENT]', err.message);
          socket.destroy();
        });
      })
      .catch((err) => {
        console.error('[CONNECT] SOCKS error:', err.message);
        clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
        clientSocket.destroy();
      });
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this._handleHttpRequest(req, res));

      this.server.on('connect', (req, socket, head) => this._handleConnect(req, socket, head));

      this.server.on('error', (err) => {
        console.error('Server error:', err);
        reject(err);
      });

      this.server.listen(this.localPort, this.localHost, () => {
        console.log(`HTTP(S) -> SOCKS5 proxy listening on ${this.localHost}:${this.localPort}`);
        console.log(`Upstream SOCKS5: ${this.socksHost}:${this.socksPort}`);
        if (this.socksUser) console.log(`Auth: ${this.socksUser}:****`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.server) return resolve();
      this.server.close(() => {
        console.log('Proxy socks stopped');
        resolve();
      });
    });
  }
}
