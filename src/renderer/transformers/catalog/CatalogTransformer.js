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
    return {
      id: this.get(release, 'id'),
      year: this.get(release, 'year'),
      type: this.get(release, 'type'),
      names: {
        ru: this._stripHtml(this.get(release, 'names.0')),
        original: this._stripHtml(this.get(release, 'names.1'))
      },
      poster: this.get(release, 'poster'),
      genres: this.get(release, 'genres') || [],
      description: this._stripHtml(this.get(release, 'description')),

      status: this.get(release, 'status'),
      statusCode: this.get(release, 'statusCode'),
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
