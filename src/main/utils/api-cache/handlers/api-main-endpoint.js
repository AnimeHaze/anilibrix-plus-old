import { APIResponseTransformer } from '@main/utils/api-cache/api-release-transformer';

export default function (apiController, cacheService) {
  return async (req, res, next) => {
    try {
      const { query } = req.body;

      if (['user', 'favorites'].includes(query)) {
        let response = null
        if (query === 'favorites' && req.body.action) {
          console.log('Favorites action received', req.body)
          response = await apiController.handleFavoritesProxy(req.body.action, req.body.id)
        } else {
          response = await apiController.handleProxyWithCache(query, {
            ...req.body
          })
        }

        if (query === 'favorites' && !response.error && !req.body.action) {
          await cacheService.ensureInitialized()
          response.data.items.forEach((v, i) => {
            v.total_series = cacheService.releases.get(v.id)?.series || '(0)'

            if (!v.playlist || !v.playlist.length) {
              v.playlist = apiController.findEpisodes(v.id)
                .map(x => {
                  return APIResponseTransformer.createPlaylistItem(v, x, null)
                })

              console.log(v.id, v.playlist.length)
            }
          })
        }

        if (response.error) {
          res.status(400).send(response);
        } else {
          res.send(response);
        }

        return
      }

      if (!['list', 'release', 'catalog', 'random_release', 'search', 'years', 'genres'].includes(query)) {
        res.status(404).send({
          error: 'Endpoint not found',
          status: false
        });

        return
      }

      const response = await apiController.handleRequest(req.body, query);

      if (response.error) {
        res.status(400).send(response);
      } else {
        res.send(response);
      }
    } catch (e) {
      console.error(e)
      res.status(400).send({
        error: 'Internal server error',
        status: false
      });
    }
  }
}
