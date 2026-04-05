import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { catGirlFetch } from '@utils/fetch';

const CACHE_SETTINGS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024
};

export class CacheManager {
  constructor(cachePath) {
    this.cachePath = cachePath;
  }

  async initialize() {
    try {
      await fs.mkdir(this.cachePath, { recursive: true });
      console.log(`Cache initialized at: ${this.cachePath}`);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }

  async getCacheKey(url) {
    return crypto.createHash('md5')
      .update(url)
      .digest('hex');
  }

  async getCache(cacheName, originalUrl) {
    try {
      const filePath = path.join(this.cachePath, `${cacheName}.dat`);
      const file = await fs.readFile(filePath);

      // [4 bytes - length of meta][meta][data]
      const metaLength = file.readUInt32BE(0);
      const metaEnd = 4 + metaLength;

      if (metaEnd >= file.length) {
        throw new Error('Invalid cache format: metadata out of bounds');
      }

      const meta = JSON.parse(file.subarray(4, metaEnd).toString());
      const buf = file.subarray(metaEnd);

      return {
        meta,
        buf,
        fromCache: true
      };
    } catch (cacheError) {
      console.warn(`Cache miss (${cacheName}):`, cacheError.message);

      const result = await catGirlFetch(originalUrl);

      if (!result.ok && result.status !== 404) {
        throw new Error(`Failed to fetch: ${result.status}`);
      }

      const buf = Buffer.from(await result.arrayBuffer());

      const headers = new Headers({
        'content-type': result.headers.get('content-type'),
        'x-cache-hit': 'false',
        'x-cache-age': '0'
      });

      if (buf.length > CACHE_SETTINGS.MAX_FILE_SIZE) {
        console.warn(`File too large (${buf.length} bytes), not caching`);
        return {
          meta: {
            headers: Object.fromEntries(headers.entries()),
            status: result.status,
            timestamp: Date.now()
          },
          buf,
          fromCache: false
        };
      }

      const meta = {
        headers: Object.fromEntries(headers.entries()),
        status: result.status,
        timestamp: Date.now()
      };

      this.setCache(cacheName, buf, meta)
        .catch(e => console.error('Cache update failed:', e));

      return { meta, buf, fromCache: false };
    }
  }

  async setCache(cacheName, data, meta) {
    try {
      const metaBuffer = Buffer.from(JSON.stringify(meta));
      const header = Buffer.alloc(4);
      header.writeUInt32BE(metaBuffer.length, 0);

      await fs.writeFile(
        path.join(this.cachePath, `${cacheName}.dat`),
        Buffer.concat([header, metaBuffer, data])
      );
    } catch (err) {
      console.error('Failed to write cache:', err);
      throw err;
    }
  }
}
