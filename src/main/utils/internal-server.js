import path from 'path';
import { app } from 'electron';

import express from 'express';
import expressProxy from 'express-http-proxy';
import multer from 'multer';
import getPort from 'get-port';

import { APICacheService } from './api-cache/api-cache-service';
import { APIController } from './api-cache/api-cache-controller';
import { CacheManager } from './api-cache/cache-manager';

import mainEndpoint from './api-cache/handlers/api-main-endpoint';
import lazyRutube from './api-cache/handlers/lazy-rutube';
import proxyStatic from './api-cache/handlers/proxy-static';

const server = express()
server.disable('x-powered-by')

const mediaCachePath = path.join(app.getPath('userData'), 'media-cache')
const apiCachePath = path.join(app.getPath('userData'), 'api-cache')
const cacheManager = new CacheManager(mediaCachePath)
const cacheService = new APICacheService(apiCachePath);

global.apiCacheService = cacheService

export async function initInternalServer () {
  const apiController = new APIController(cacheService);
  server.get('/proxy-static', proxyStatic(cacheManager));
  server.post('/public/api/index.php', multer().none(), mainEndpoint(apiController));
  server.get('/rutube/:id/*', lazyRutube)

  server.all('/', (req, res) => res.send('Hello from Anilibrix Plus!'))

  server.get('/public/torrent/download.php', expressProxy(apiController.endpoint));
  server.post('/public/login.php', expressProxy(apiController.endpoint));
  server.post('/public/logout.php', expressProxy(apiController.endpoint, {
    userResDecorator: function(proxyRes, proxyResData) {
      apiController.clearUserData()
      return proxyResData
    }
  }));

  await cacheService.initialize()
  await cacheManager.initialize()
  const port = await getPort()
  server.listen(port)

  return port
}
