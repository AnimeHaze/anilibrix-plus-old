export class APIResponseTransformer {
  static transformRelease(release, episodes, franchises, torrents) {
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
      day: '', // TODO
      description: release.description,
      externalPlaylist: [],
      favorite: { added: true, rating: release.rating },
      franchises: franchises?.map(x => {
        return { // no mutation way
          ...x,
          poster: `http://localhost:${global.internalServerPort}/proxy-static?url=` + x.poster
        }
      }) ?? [],
      genres: release.genres.split(',').map(x => x.trim()),
      id: release.id,
      last: '', // TODO
      members: {
        decorating: [],
        editing: [],
        timing: [],
        translating: [],
        voicing: []
      },
      moon: null, // TODO
      names: [release.title, release.originalName].filter(Boolean),
      playlist: episodes.map(x => {
        return APIResponseTransformer.createPlaylistItem(release, x)
      }),
      poster: release.poster,
      season: release.season,
      series: release.series,
      status: release.status.replace('Сейчас в озвучке', 'В работе').replace('Озвучка завершена', 'Завершен'),
      statusCode: '1',
      torrents,
      type: release.type + (release.series && release.series !== '(0)' ? ` (${release.series.replace(/[\(\)]/g, '')} эп.)` : ''),
      voices: release.voices?.split(',').map(x => x.trim()).filter(x => x !== ''),
      team: release.team?.split(',').map(x => x.trim()).filter(x => x !== ''),
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
