import { catGirlFetch } from '@utils/fetch';

export default async (req, res) => {
  try {
    const url = req.params.url;

    if (!url) {
      return res.status(400).send('URL parameter is required');
    }

    const u = new URL(url);
    u.host = 'cache.libria.fun'

    const alternativeUrl = u.toString()

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

    const data = await result.response.text();

    res.send(data)
  } catch (error) {
    console.error('All playlist fetch attempts failed:', error, url);
    return res.status(500).send('Failed to fetch from all sources');
  }
}
