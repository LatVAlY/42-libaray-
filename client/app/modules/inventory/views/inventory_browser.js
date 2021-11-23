import FilteredCollection from 'backbone-filtered-collection'
import { localStorageProxy } from 'lib/local_storage'
import assert_ from 'lib/assert_types'
import BrowserSelector from './browser_selector'
import ItemsCascade from './items_cascade'
import ItemsTable from './items_table'
import SelectorsCollection from '../collections/selectors'
import FilterPreview from './filter_preview'
import getIntersectionWorkUris from '../lib/browser/get_intersection_work_uris'
import getUnknownModel from '../lib/browser/get_unknown_model'
import error_ from 'lib/error'
import { startLoading, stopLoading } from 'modules/general/plugins/behaviors'
import inventoryBrowserTemplate from './templates/inventory_browser.hbs'
import 'modules/inventory/scss/inventory_browser.scss'

const selectorsNames = [ 'author', 'genre', 'subject' ]
const selectorsRegions = {}
selectorsNames.forEach(name => { selectorsRegions[`${name}Region`] = `#${name}` })

export default Marionette.LayoutView.extend({
  id: 'inventory-browser',
  template: inventoryBrowserTemplate,
  regions: _.extend(selectorsRegions, {
    filterPreview: '#filterPreview',
    itemsView: '#itemsView'
  }),

  behaviors: {
    PreventDefault: {},
    Loading: {}
  },

  initialize () {
    this.filters = {}

    this.display = localStorageProxy.getItem('inventoryDisplay') || 'cascade'
    this.isMainUser = this.options.isMainUser
    this.groupContext = (this.options.group != null)
  },

  ui: {
    browserControls: '#browserControls',
    currentDisplayOption: '#displayControls .current div'
  },

  events: {
    'click #displayOptions a': 'selectDisplay'
  },

  childEvents: {
    'filter:select': 'onFilterSelect'
  },

  serializeData () {
    const data = {}
    data[this.display] = true
    data.displayMode = this.display
    data.isMainUser = this.isMainUser
    return data
  },

  onShow () {
    this.initBrowser()
  },

  initBrowser () {
    startLoading.call(this, { selector: '#browserFilters', timeout: 180 })
    const { itemsDataPromise } = this.options
    const waitForInventoryData = itemsDataPromise
      .then(this.ifViewIsIntact('spreadData'))
      .then(this.ifViewIsIntact('showItemsListByIds', null))

    const waitForEntitiesSelectors = waitForInventoryData
      .then(this.ifViewIsIntact('showEntitySelectors'))

    waitForEntitiesSelectors
    // Show the controls all at once
    .then(this.ifViewIsIntact('browserControlsReady'))

    this.filterPreview.show(new FilterPreview())
  },

  browserControlsReady () {
    this.ui.browserControls.addClass('ready')
    stopLoading.call(this, '#browserFilters')
  },

  spreadData (data) {
    return ({ worksTree: this.worksTree, workUriItemsMap: this.workUriItemsMap, itemsByDate: this.itemsByDate } = data)
  },

  showEntitySelectors () {
    const authors = Object.keys(this.worksTree.author)
    const genres = Object.keys(this.worksTree.genre)
    const subjects = Object.keys(this.worksTree.subject)

    let allUris = _.flatten([ authors, genres, subjects ])
    // The 'unknown' attribute is used to list works that have no value
    // for one of those selector properties
    // Removing the 'unknown' URI is here required as 'get:entities:models'
    // won't know how to resolve it
    allUris = _.without(allUris, 'unknown')

    return app.request('get:entities:models', { uris: allUris, index: true })
    .then(this.ifViewIsIntact('_showEntitySelectors', authors, genres, subjects))
  },

  _showEntitySelectors (authors, genres, subjects, entities) {
    // Re-adding the 'unknown' entity placeholder
    entities.unknown = getUnknownModel()
    this.showEntitySelector(entities, authors, 'author')
    this.showEntitySelector(entities, genres, 'genre')
    this.showEntitySelector(entities, subjects, 'subject')
  },

  showItemsListByIds (itemsIds) {
    // Default to showing the latest items
    if (!itemsIds) itemsIds = this.itemsByDate
    // - Deduplicate as editions with several P629 values might have generated duplicates
    // - Clone to avoid modifying @itemsByDate
    itemsIds = _.uniq(itemsIds)
    const collection = new Backbone.Collection([])

    const remainingItems = _.clone(itemsIds)
    const hasMore = () => remainingItems.length > 0
    const fetchMore = async () => {
      const batch = remainingItems.splice(0, 20)
      if (batch.length === 0) return
      return app.request('items:getByIds', batch)
      .then(collection.add.bind(collection))
    }

    this.itemsViewParams = {
      collection,
      fetchMore,
      hasMore,
      itemsIds,
      isMainUser: this.isMainUser,
      groupContext: this.groupContext,
      // Regenerate the whole view to re-request the data without the deleted items
      afterItemsDelete: this.initBrowser.bind(this)
    }

    // Fetch a first batch before displaying
    // so that it doesn't start by displaying 'no item here'
    return fetchMore()
    .then(this.ifViewIsIntact('showItemsByDisplayMode'))
  },

  showItemsByDisplayMode () {
    const ItemsList = this.display === 'table' ? ItemsTable : ItemsCascade
    this._lastShownDisplay = this.display
    this.itemsView.show(new ItemsList(this.itemsViewParams))
  },

  showEntitySelector (entities, propertyUris, name) {
    const treeSection = this.worksTree[name]
    const models = _.values(_.pick(entities, propertyUris)).map(addCount(treeSection, name))
    this.showSelector(name, models, treeSection)
  },

  showSelector (name, models, treeSection) {
    const collection = getSelectorsCollection(models)
    this[`${name}Region`].show(new BrowserSelector({ name, collection, treeSection }))
  },

  onFilterSelect (selectorView, selectedOption) {
    const { selectorName } = selectorView
    assert_.string(selectorName)
    const selectedOptionKey = getSelectedOptionKey(selectedOption, selectorName)
    this.filters[selectorName] = selectedOptionKey

    const intersectionWorkUris = getIntersectionWorkUris(this.worksTree, this.filters)
    this.filterSelectors(intersectionWorkUris)
    this.displayFilteredItems(intersectionWorkUris)
    this.filterPreview.currentView.updatePreview(selectorName, selectedOption)
  },

  filterSelectors (intersectionWorkUris) {
    for (const selectorName of selectorsNames) {
      const { currentView } = this[`${selectorName}Region`]
      currentView.filterOptions(intersectionWorkUris)
    }
  },

  displayFilteredItems (intersectionWorkUris) {
    if (intersectionWorkUris == null) return this.showItemsListByIds()

    if (intersectionWorkUris.length === 0) return this.showItemsListByIds([])

    const worksItems = _.pick(this.workUriItemsMap, intersectionWorkUris)
    const itemsIds = _.flatten(_.values(worksItems))
    this.showItemsListByIds(itemsIds)
  },

  selectDisplay (e) {
    const display = e.currentTarget.id
    if (display === this.display) return
    this.display = display
    localStorageProxy.setItem('inventoryDisplay', display)
    this.ui.currentDisplayOption.toggleClass('shown')

    // If @_lastShownDisplay isn't defined, the inventory data probably didn't arrive yet
    // and the items were not shown yet
    if ((this._lastShownDisplay != null) && (this._lastShownDisplay !== display)) {
      this.showItemsByDisplayMode()
    }
  }
})

const getSelectedOptionKey = function (selectedOption, selectorName) {
  if (selectedOption == null) return null
  return selectedOption.get('uri')
}

const addCount = (urisData, name) => function (model) {
  const uri = model.get('uri')
  const uris = urisData[uri]
  if (uris != null) {
    model.set('count', uris.length)
  } else {
    // Known case: a Wikidata redirection that wasn't properly propagated
    error_.report('missing section data', { name, uri })
    model.set('count', 0)
  }
  return model
}

// Using a filtered collection allows browser_selector to filter
// options without re-rendering the whole view
const getSelectorsCollection = models => {
  return new FilteredCollection(new SelectorsCollection(models))
}
