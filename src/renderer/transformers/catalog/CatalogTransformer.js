import stripHtml from 'string-strip-html'
import BaseTransformer from '@transformers/BaseTransformer'
import humanFormat from 'human-format'

export default class CatalogTransformer extends BaseTransformer {
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
    const description = this._stripHtml(this.get(release, 'description'))
    const descriptionLocalized = this._stripHtml(this.get(release, 'descriptionLocalized')) || description

    return {
      id: this.get(release, 'id'),
      year: this.get(release, 'year'),
      type: this.get(release, 'type'),
      names,
      displayTitle: this._stripHtml(this.get(release, 'displayTitle')) || names.en || names.ru || names.original,
      displaySubtitle: this._stripHtml(this.get(release, 'displaySubtitle')) || names.original || names.ru || names.en,
      displayDescription: this._stripHtml(this.get(release, 'displayDescription')) || descriptionLocalized || description,
      poster: this.get(release, 'poster'),
      genres,
      genresLocalized,
      description,
      descriptionLocalized,

      status: this.get(release, 'status'),
      statusLocalized: this._stripHtml(this.get(release, 'statusLocalized')) || this.get(release, 'status'),
      statusCode: this.get(release, 'statusCode'),
      typeLocalized: this._stripHtml(this.get(release, 'typeLocalized')) || this.get(release, 'type'),
      searchAliases: this.get(release, 'searchAliases') || [],
      favoriteRating: this._getFavoriteRating(release),
      episodes: this.get(release, 'playlist') || []
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

  _getFavoriteRating (release) {
    const rating = this.get(release, 'favorite.rating')

    return { count: rating, text: humanFormat(rating) }
  }
}
