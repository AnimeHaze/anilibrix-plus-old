import stripHtml from 'string-strip-html'
import BaseTransformer from '@transformers/BaseTransformer'

export default class SearchTransformer extends BaseTransformer {
  /**
   * Fetch search data
   *
   * @param release
   * @return {*}
   */
  fetch (release) {
    const names = {
      ru: this._stripHtml(this.get(release, 'names.ru')) || this._stripHtml(this.get(release, 'names.0')),
      original: this._stripHtml(this.get(release, 'names.original')) || this._stripHtml(this.get(release, 'names.1')),
      en: this._stripHtml(this.get(release, 'names.en'))
    }

    return {
      id: this.get(release, 'id'),
      names,
      displayTitle: this._stripHtml(this.get(release, 'displayTitle')) || names.en || names.ru || names.original,
      displaySubtitle: this._stripHtml(this.get(release, 'displaySubtitle')) || names.original || names.ru || names.en,
      displayDescription: this._stripHtml(this.get(release, 'displayDescription')),
      genresLocalized: this.get(release, 'genresLocalized') || [],
      statusLocalized: this._stripHtml(this.get(release, 'statusLocalized')) || this._stripHtml(this.get(release, 'status')),
      typeLocalized: this._stripHtml(this.get(release, 'typeLocalized')) || this._stripHtml(this.get(release, 'type')),
      searchAliases: this.get(release, 'searchAliases') || [],
      poster: this.get(release, 'poster')
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
