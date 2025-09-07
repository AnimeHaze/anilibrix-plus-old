export class APIResponseTransformer {
  static transformRelease(release) {
    return {
      announce: release.announce,
      blockedInfo: {
        bakanim: false,
        blocked: false,
        kinopoisk: false,
        reason: null,
        wakanim: false
      },
      code: release.code,
      day: '4',
      description: release.description,
      externalPlaylist: [],
      favorite: { added: true, rating: release.rating },
      franchises: [],
      genres: release.genres.split(', '),
      id: release.id,
      last: '1756533921',
      members: {
        decorating: [],
        editing: [],
        timing: [],
        translating: [],
        voicing: []
      },
      moon: null,
      names: [release.title, release.originalName].filter(Boolean),
      playlist: [APIResponseTransformer.createPlaylistItem(release)],
      poster: release.poster,
      season: release.season,
      series: '1-9',
      status: release.status,
      statusCode: '1',
      torrents: [],
      type: 'ТВ (12 эп.)',
      voices: release.voices.split(', '),
      year: release.year
    };
  }

  static createPlaylistItem(release) {
    const baseUrl = 'https://cache-rfn.libria.fun/videos/media/ts/9992/9';

    return {
      fullhd: `${baseUrl}/1080/33a7d13676bf25d78b4acf3c48b55ca2.m3u8`,
      hd: `${baseUrl}/720/d91c30829ba20bb7ed5f1890295913a2.m3u8`,
      id: 9,
      name: 'Поле битвы - Хайдерат',
      ordinal: 9,
      poster: release.poster,
      poster_thumbnail: release.poster,
      rutube_id: null,
      sd: `${baseUrl}/480/a10860cdd77fc7ed3e3e5cb3f7021c78.m3u8`,
      skips: { ending: [], opening: [273, 363] },
      sources: { is_anilibria: true, is_rutube: false, is_youtube: false },
      srcHd: 'https://vk.com/anilibria?w=wall-37468416_493445',
      srcSd: 'https://vk.com/anilibria?w=wall-37468416_493445',
      title: 'Серия 9',
      updated_at: 1756832430,
      uuid: '9fc16c77-5032-496c-a9eb-71dfddcb6661',
      youtube_id: null
    };
  }
}
