import { isNonEmptyString } from 'lib/boolean_tests'
import log_ from 'lib/loggers'
// A behavior to preserve input text from being lost on a view re-render
// by saving it at every change and recovering it on re-render
// This behavior should probably be added to any view with input or textarea
// that is suceptible to be re-rendered due to some event listener
export default Marionette.Behavior.extend({
  events: {
    'change input, textarea': 'backup',
    'click a': 'forget'
  },

  initialize () {
    this._backup = {
      byId: {},
      byName: {}
    }
  },

  backup (e) {
    // log_.info @_backup, 'backup form data'
    const { id, value, type, name } = e.currentTarget

    if (!isNonEmptyString(value)) return
    if ((type !== 'text') && (type !== 'textarea')) return

    if (isNonEmptyString(id)) {
      this._backup.byId[id] = value
    } else if (isNonEmptyString(name)) {
      this._backup.byName[name] = value
    }
  },

  recover () {
    customRecover(this.$el, this._backup.byId, buildIdSelector)
    customRecover(this.$el, this._backup.byName, buildNameSelector)
  },

  // Listen on clicks on anchor with a 'data-forget' attribute
  // to delete the data associated with the form element related to this anchor.
  // Typically used on 'cancel' buttons
  forget (e) {
    const forgetAttr = e.currentTarget.attributes['data-forget']?.value
    if (forgetAttr != null) {
      log_.info(forgetAttr, 'form:forget')
      if (forgetAttr[0] === '#') {
        const id = forgetAttr.slice(1)
        delete this._backup.byId[id]
      } else {
        const name = forgetAttr
        delete this._backup.byName[name]
      }
    }
  },

  onRender () { this.recover() }
})

const customRecover = ($el, store, selectorBuilder) => {
  for (const key in store) {
    const value = store[key]
    log_.info(value, key)
    const selector = selectorBuilder(key)
    $el.find(selector).val(value)
  }
}

const buildIdSelector = id => `#${id}`
const buildNameSelector = name => `[name='${name}']`
