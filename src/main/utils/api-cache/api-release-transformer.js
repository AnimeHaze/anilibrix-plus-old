import { t } from '@main/utils/i18n'

export class APIResponseTransformer {
  static transformRelease(release, episodes, franchises, torrents, localized = null) {
    const rawGenres = release.genres?.split(',').map(x => x.trim()).filter(Boolean) || []
    const rawStatus = release.status.replace('Сейчас в озвучке', 'В работе').replace('Озвучка завершена', 'Завершен')
    const rawType = release.type + (release.series && release.series !== '(0)' ? ` (${release.series.replace(/[\(\)]/g, '')} эп.)` : '')

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
      descriptionLocalized: localized?.descriptionLocalized || release.description,
      displayDescription: localized?.displayDescription || localized?.descriptionLocalized || release.description,
      displaySubtitle: localized?.displaySubtitle || release.originalName || release.title,
      displayTitle: localized?.displayTitle || localized?.names?.en || release.title,
      externalPlaylist: [],
      favorite: { added: true, rating: release.rating },
      franchises: franchises?.map(x => {
        return { // no mutation way
          ...x,
          poster: `http://localhost:${global.internalServerPort}/proxy-static?url=` + x.poster
        }
      }) ?? [],
      genres: rawGenres,
      genresLocalized: localized?.genresLocalized || rawGenres,
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
      names: {
        ru: release.title || null,
        original: release.originalName || null,
        en: localized?.names?.en || null
      },
      playlist: episodes.map(x => {
        return APIResponseTransformer.createPlaylistItem(release, x, localized)
      }),
      poster: release.poster,
      searchAliases: localized?.searchAliases || [],
      season: release.season,
      series: release.series,
      status: rawStatus,
      statusCode: '1',
      statusLocalized: localized?.statusLocalized || rawStatus,
      torrents,
      type: rawType,
      typeLocalized: localized?.typeLocalized || rawType,
      voices: release.voices?.split(',').map(x => x.trim()).filter(x => x !== ''),
      team: release.team?.split(',').map(x => x.trim()).filter(x => x !== ''),
      year: release.year
    };
  }

  static createPlaylistItem(release, episode, localized = null) {
    const nameLocalized = localized?.episodeNamesByOrdinal?.[episode.ordinal] || episode.name || null

    return {
      fullhd: episode.hls_1080,
      hd: episode.hls_720,
      sd: episode.hls_480,
      id: episode.ordinal, // episode.id hmmm... if i change it to uuid (text id), broke next / forward for player
      name: episode.name,
      nameLocalized,
      ordinal: episode.ordinal,
      poster: release.poster,
      poster_thumbnail: episode.preview.src,
      rutube_id: null,
      skips: { ending: [episode.ending?.start, episode.ending?.stop].filter(Boolean), opening: [episode.opening?.start, episode.opening?.stop].filter(Boolean) },
      sources: { is_anilibria: true, is_rutube: false, is_youtube: false },
      title: t('generated.episode', { number: episode.ordinal }),
      updated_at: new Date(episode.updatedAt) / 1000,
      uuid: episode.id,
      youtube_id: null
    };
  }
}
