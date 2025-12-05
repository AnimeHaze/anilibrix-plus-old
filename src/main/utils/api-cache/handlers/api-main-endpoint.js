export default function (apiController) {
  return async (req, res, next) => {
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
  }
}
