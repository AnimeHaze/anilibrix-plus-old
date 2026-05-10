// Transformers
import BaseTransformer from '@transformers/BaseTransformer'

// Utils
import stripHtml from 'string-strip-html'
import humanFormat from 'human-format';

export default class ReleaseTransformer extends BaseTransformer {
  /**
   * Transform incoming data
   *
   * @param release
   * @returns {{}}
   */
  fetch (release) {
    const names = {
      ru: this._stripHtml(this.get(release, 'names.ru')) || this._stripHtml(this.get(release, 'names.0')),
      original: this._stripHtml(this.get(release, 'names.original')) || this._stripHtml(this.get(release, 'names.1')),
      en: this._stripHtml(this.get(release, 'names.en'))
    }
    const genres = this.get(release, 'genres') || []
    const genresLocalized = this.get(release, 'genresLocalized') || genres
    const description = this._stripHtml(this.get(release, 'description'))?.split(/Порядок\s+просмотра/)[0]
    const descriptionLocalized = this._stripHtml(this.get(release, 'descriptionLocalized'))?.split(/Порядок\s+просмотра/)[0] || description

    return {
      id: this.get(release, 'id'),
      year: this.get(release, 'year'),
      type: this.get(release, 'type'),
      code: this.get(release, 'code'),
      names,
      displayTitle: this._stripHtml(this.get(release, 'displayTitle')) || names.en || names.ru || names.original,
      displaySubtitle: this._stripHtml(this.get(release, 'displaySubtitle')) || names.original || names.ru || names.en,
      displayDescription: this._stripHtml(this.get(release, 'displayDescription')) || descriptionLocalized || description,
      team: this.get(release, 'team') || [],
      franchises: this.get(release, 'franchises') || [],
      series: this.get(release, 'series'),
      total_series: this.get(release, 'total_series'),
      voices: this.get(release, 'voices') || [],
      genres,
      genresLocalized,
      poster: this.get(release, 'poster'),
      torrents: this.get(release, 'torrents') || [],
      status: this.get(release, 'status'),
      statusLocalized: this._stripHtml(this.get(release, 'statusLocalized')) || this.get(release, 'status'),
      statusCode: this.get(release, 'statusCode'),
      typeLocalized: this._stripHtml(this.get(release, 'typeLocalized')) || this.get(release, 'type'),
      searchAliases: this.get(release, 'searchAliases') || [],
      favoriteRating: this._getFavoriteRating(release),
      datetime: this._getReleaseDatetime(release),
      episodes: {
        playlist: this.get(release, 'playlist'),
        torrents: this.get(release, 'torrents')
      },
      description,
      descriptionLocalized
    }
  }

  /**
   * Get release datetime
   *
   * @param release
   * @return {{system: null, human: string, timestamp: *}}
   */
  _getReleaseDatetime (release) {
    const timestamp = this.get(release, 'last')
    const system = timestamp ? new Date(timestamp * 1000) : null
    const human = system ? new Intl.DateTimeFormat(undefined, {}).format(system) : null

    return {
      timestamp,
      system,
      human
    }
  }

  /**
   * Get release favorite rating
   *
   * @param release
   * @return {{count: (*|number), text: string}}
   */
  _getFavoriteRating (release) {
    const rating = this.get(release, 'favorite.rating')
    const fuckingAPIBrokenRating = this.get(release, 'rating')

    return {
      count: rating,
      text: humanFormat(
        rating || // If api wor  fine
            fuckingAPIBrokenRating || // Fallback to "new api" xD
            0 // Oni-chan kill me,  it makes me want to cry
      )
    }
  }

  /**
   * Strip html tags
   *
   * @param value
   * @return {*}
   * @private
   */
  _stripHtml (value) {
    return value ? stripHtml(value) : null
  }
}
