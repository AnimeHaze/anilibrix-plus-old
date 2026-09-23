import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

import { catGirlFetch } from '@utils/fetch';

const FORCED_DOMAIN_FILE = 'forced-video-domain.txt';

async function getForcedDomain() {
  try {
    const filePath = path.join(
      app.getPath('userData'),
      FORCED_DOMAIN_FILE
    );

    const value = (await fs.readFile(filePath, 'utf8')).trim();

    if (!value) {
      return null;
    }

    const normalized = value.includes('://')
      ? value
      : `https://${value}`;

    const url = new URL(normalized);

    return url.host;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to read forced video domain:', error);
    }

    return null;
  }
}

export default async (req, res) => {
  const url = req.params.url;

  try {
    if (!url) {
      return res.status(400).send('URL parameter is required');
    }

    const forcedDomain = await getForcedDomain();

    if (forcedDomain) {
      const forcedUrl = new URL(url);
      forcedUrl.host = forcedDomain;

      console.log(
        `[video] forced domain: ${forcedDomain} -> ${forcedUrl.toString()}`
      );

      const response = await catGirlFetch(forcedUrl.toString());

      return res.send(await response.text());
    }

    const alternative = new URL(url);
    alternative.host = 'cache.libria.fun';

    const alternativeUrl = alternative.toString();

    const fetchPromises = [
      catGirlFetch(url).then(response => ({
        response,
        source: 'original',
        url: url
      })),
      catGirlFetch(alternativeUrl).then(response => ({
        response,
        source: 'alternative',
        url: alternativeUrl
      }))
    ];

    const result = await Promise.any(
      fetchPromises.map(promise =>
        promise.catch(error => {
          console.log('Fetch playlist error: ', error, url)
          throw error;
        })
      )
    );

    console.log(
      `[video] selected ${result.source}: ${result.url}`
    );

    const data = await result.response.text();

    res.send(data)
  } catch (error) {
    console.error('All playlist fetch attempts failed:', error, url);
    return res.status(500).send('Failed to fetch from all sources');
  }
}
