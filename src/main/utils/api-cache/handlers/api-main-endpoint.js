export default function (apiController) {
  return async (req, res) => {
    const { query } = req.body;

    if (['user', 'favorites'].includes(query)) {
      const response = await apiController.handleProxyWithCache(query, {
        ...req.body
      })

      if (response.error) {
        res.status(400).send(response);
      } else {
        res.send(response);
      }

      return
    }

    if (!['list', 'release', 'catalog', 'random_release'].includes(query)) {
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
