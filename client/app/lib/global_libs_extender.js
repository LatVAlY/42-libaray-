import FilteredCollection from 'backbone-filtered-collection'
// Sets $(selector).visible function
import 'jquery-visible'
// Sets $.event.special.inview
import 'jquery-inview'

import assert_ from 'lib/assert_types'
import log_ from 'lib/loggers'
import preq from 'lib/preq'
import error_ from 'lib/error'

// Workaround XSS vulnerability https://github.com/advisories/GHSA-gxr4-xjj5-5px2
// until we can upgrade or get rid of jquery
window.jQuery.htmlPrefilter = function (html) {
  return html
}

// changing the default attribute to fit CouchDB
Backbone.Model.prototype.idAttribute = '_id'

const ArrayHandler = function (handler) {
  return function (attr, value) {
    let array = this.get(attr) || []
    assert_.array(array)
    array = handler(array, value)
    this.set(attr, array)
    return triggerChange(this, attr, value)
  }
}

Backbone.Model.prototype.push = ArrayHandler((array, value) => {
  array.push(value)
  return array
})

Backbone.Model.prototype.unshift = ArrayHandler((array, value) => {
  array.unshift(value)
  return array
})

Backbone.Model.prototype.without = ArrayHandler((array, value) => _.without(array, value))

// attaching related models to a model in a standard way
// - requesting it to whatever modules handles it
// - adding a reference to the model
// - triggering events

// Get several attributes at once.
// Especially useful conbined with destructuring assignment:
// [ a, b, c ] = model.gets 'a', 'b', 'c'
Backbone.Model.prototype.gets = function (...attributes) {
  if (_.isArray(attributes[0])) {
    throw new Error('gets expects attributes as different arguments')
  }
  return attributes.map(this.get.bind(this))
}

Backbone.Model.prototype.reqGrab = async function (request, id, name, refresh) {
  if (!refresh && this[name] != null) return this[name]

  try {
    const model = await app.request(request, id)
    return this.grab(name, model)
  } catch (err) {
    log_.error(err, `reqGrab ${request} ${id} ${name}`)
    throw err
  }
}

Backbone.Model.prototype.grab = function (name, model) {
  if (model == null) throw error_.new('grab failed: missing model', arguments)

  this[name] = model
  this.triggerGrab(name, model)
  return model
}

Backbone.Model.prototype.triggerGrab = function (name, model) {
  this.trigger('grab', name, model)
  this.trigger(`grab:${name}`, model)
}

// Wrapping Backbone internal functions to get custom error handling
// and A-promises instead of jQuery errors and promises
const WrapModelRequests = function (ClassObj, fnName) {
  const originalFn = ClassObj.prototype[fnName]

  const wrappedFn = async function () {
    const result = originalFn.apply(this, arguments)
    // Backbone classes have some inconsistent APIs
    // like Model::delete that can return 'false' instead of a jQuery promise
    if (result.then != null) {
      return preq.wrap(result, arguments)
    } else {
      return result
    }
  }

  ClassObj.prototype[fnName] = wrappedFn
}

WrapModelRequests(Backbone.Model, 'save')
WrapModelRequests(Backbone.Model, 'destroy')
WrapModelRequests(Backbone.Model, 'fetch')
WrapModelRequests(Backbone.Collection, 'fetch')
WrapModelRequests(Backbone.Collection, 'destroy')

Backbone.Collection.prototype.findOne = function () { return this.models[0] }
// Legacy alias
Backbone.Collection.prototype.byId = Backbone.Collection.prototype.get
Backbone.Collection.prototype.byIds = function (ids) { return ids.map(id => this._byId[id]) }
Backbone.Collection.prototype.attributes = function () { return this.toJSON() }

FilteredCollection.prototype.filterByText = function (text, reset = true) {
  if (reset) this.resetFilters()

  // Not completly raw, we are not barbarians
  const rawText = text.trim()
    // Replace any double space by a simple space
    .replace(/\s{2,}/g, ' ')

  const regexText = rawText
    // Escape regex special characters
    // especially to prevent errors of type "Unterminated group"
    .replace(specialRegexCharactersRegex, '\\$1')

  const filterRegex = new RegExp(regexText, 'i')

  return this.filterBy('text', model => model.matches(filterRegex, rawText))
}

// The 'update' event will be added when updating to Backbone >= 1.2.0
// but meanwhile we got to do without it
// See https://backbonejs.org/#Changelog
Backbone.Collection.prototype.triggerUpdateEvents = function () {
  const lazyTriggerUpdate = _.debounce(triggerUpdate.bind(this), 200)
  this.on('change', lazyTriggerUpdate)
}

const triggerUpdate = function (...args) {
  this.trigger('update', ...args)
}

// Use in promise chains when the view might be about to be re-rendered
// and calling would thus trigger error as the method depends on regions
// being populated (which happens at render), typically in an onRender call.
Marionette.View.prototype.ifViewIsIntact = function (fn, ...args) {
  return result => {
    // Pass if the view was destroyed or let the onRender hook re-call the function
    if (!this.isIntact()) return

    args.push(result)
    // Accept a method name in place of a function
    if (_.isString(fn)) fn = this[fn]
    return fn.apply(this, args)
  }
}
Marionette.View.prototype.isIntact = function () {
  return this.isRendered && !this.isDestroyed
}

Marionette.View.prototype.setTimeout = function (fn, timeout) {
  const runUnlessViewIsDestroyed = () => {
    if (!this.isDestroyed) return fn()
  }
  return setTimeout(runUnlessViewIsDestroyed, timeout)
}

Marionette.View.prototype.updateClassName = function () {
  // Use in 'onRender' hooks to update the view el classes on re-render
  this.$el[0].className = this.className()
}

// JQUERY
// aliasing once to one to match Backbone vocabulary
$.fn.once = $.fn.one

Marionette.View.prototype.displayError = err => app.execute('show:error:other', err)

Marionette.View.prototype.lazyRender = function (focusSelector) {
  if (this.render == null) throw new Error('lazyRender called without view as context')

  if (this._lazyRender == null) {
    const delay = this.lazyRenderDelay || 100
    this._lazyRender = LazyRender(this, delay)
  }
  this._lazyRender(focusSelector)
}

Marionette.Region.prototype.showSvelteComponent = function (SvelteComponent, options) {
  const el = (typeof this.el === 'string') ? document.querySelector(this.el) : this.el
  options.target = el
  // Svelte only appends to the target, thus the need to empty it before mounting
  $(el).empty()
  return new SvelteComponent(options)
}

const triggerChange = function (model, attr, value) {
  model.trigger('change', model, attr, value)
  model.trigger(`change:${attr}`, model, value)
}

const specialRegexCharacters = '()[]$^\\'
  .split('')
  .map(char => '\\' + char)
  .join('')

const specialRegexCharactersRegex = new RegExp(`([${specialRegexCharacters}])`, 'g')

const LazyRender = function (view, timespan = 200) {
  const cautiousRender = function (focusSelector) {
    if (view.isRendered && !(view.isDestroyed || view._preventRerender)) {
      view.render()
      if (_.isString(focusSelector)) view.$el.find(focusSelector).focus()
    }
  }

  return _.debounce(cautiousRender, timespan)
}
