import { catGirlFetch } from '@utils/fetch';

export default (req, res) => {
  catGirlFetch(`https://rutube.ru/api/play/options/${req.params.id}/?no_404=true&referer&pver=v2`)
    .then(x => x.json())
    .then(x => {
      res.redirect(x.video_balancer.m3u8)
    })
    .catch(x => res.status(500).send())
}
