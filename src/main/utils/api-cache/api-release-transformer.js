export class APIResponseTransformer {
  static transformRelease(release, episodes) {
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
      playlist: episodes.map(x => {
        return APIResponseTransformer.createPlaylistItem(release, x)
      }),
      poster: release.poster,
      season: release.season,
      status: release.status,
      series: release.series,
      statusCode: '1',
      torrents: [],
      type: 'ТВ (12 эп.)',
      voices: release.voices.split(', '),
      year: release.year
    };
  }

  static createPlaylistItem(release, episode) {
    return {
      fullhd: episode.hls_1080,
      hd: episode.hls_720,
      sd: episode.hls_480,
      id: episode.ordinal, // episode.id hmmm... if i change it to uuid (text id), broke next / forward for player
      name: episode.name,
      ordinal: episode.ordinal,
      poster: release.poster,
      poster_thumbnail: episode.preview.src,
      rutube_id: null,
      skips: { ending: [episode.ending?.start, episode.ending?.stop].filter(Boolean), opening: [episode.opening?.start, episode.opening?.stop].filter(Boolean) },
      sources: { is_anilibria: true, is_rutube: false, is_youtube: false },
      title: `Серия ${episode.ordinal}`,
      updated_at: new Date(episode.updatedAt) / 1000,
      uuid: episode.id,
      youtube_id: null
    };
  }
}
