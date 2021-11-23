import articleLiTemplate from './templates/article_li.hbs'
import '../scss/article_li.scss'

export default Marionette.ItemView.extend({
  template: articleLiTemplate,
  className: 'articleLi',
  tagName: 'li',
  serializeData () {
    const attrs = this.model.toJSON()
    return _.extend(attrs, {
      href: this.getHref(),
      hasDate: this.hasDate(),
      hideRefreshButton: true
    })
  },

  getHref () {
    const DOI = this.model.get('claims.wdt:P356.0')
    if (DOI != null) return `https://dx.doi.org/${DOI}`
  },

  hasDate () { return (this.model.get('claims.wdt:P577.0') != null) }
})
