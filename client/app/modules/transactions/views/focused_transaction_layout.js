import { isOpenedOutside } from 'lib/utils'
import { i18n } from 'modules/user/lib/i18n'
import behaviorsPlugin from 'modules/general/plugins/behaviors'
import messagesPlugin from 'modules/general/plugins/messages'
import forms_ from 'modules/general/lib/forms'
import error_ from 'lib/error'
import screen_ from 'lib/screen'
import Event from './event'
import focusedTransactionLayout from './templates/focused_transaction_layout.hbs'
import '../scss/focused_transaction_layout.scss'

export default Marionette.CompositeView.extend({
  template: focusedTransactionLayout,
  id: 'focusedTransactionLayout',
  behaviors: {
    AlertBox: {},
    ElasticTextarea: {},
    PreventDefault: {},
    BackupForm: {}
  },

  initialize () {
    this.collection = this.model.timeline
    this.initPlugins()
    this.model.beforeShow()
  },

  initPlugins () {
    _.extend(this, behaviorsPlugin, messagesPlugin)
  },

  serializeData () { return this.model.serializeData() },

  onShow () {
    this.model.markAsRead()
    if (screen_.isSmall() && !this.options.nonExplicitSelection) {
      screen_.scrollTop(this.$el)
    }
  },

  modelEvents: {
    grab: 'lazyRender',
    change: 'lazyRender'
  },

  childViewContainer: '.timeline',
  childView: Event,

  ui: {
    message: 'textarea.message',
    avatars: '.avatar img'
  },

  events: {
    'click .sendMessage': 'sendMessage',
    'click .accept': 'accept',
    'click .decline': 'decline',
    'click .confirm': 'confirm',
    'click .returned': 'returned',
    'click .archive': 'archive',
    'click .item': 'showItem',
    'click .owner': 'showOwner',
    'click .cancel': 'cancel',
    // Those anchors being generated within the i18n shortkeys flow
    // that's the best selector we can get
    'click .info a[href^="/items/"]': 'showItem'
  },

  sendMessage () {
    this.postMessage('transaction:post:message', this.model.timeline)
  },

  accept () { this.updateState('accepted') },
  decline () { this.updateState('declined') },
  confirm () { this.updateState('confirmed') },
  returned () { this.updateState('returned') },
  archive () { this.updateState('archive') },

  updateState (state) {
    this.model.updateState(state)
    .catch(error_.Complete('.actions'))
    .catch(forms_.catchAlert.bind(null, this))
  },

  showItem (e) {
    if (isOpenedOutside(e)) return

    // Case when the item was successfully grabbed by the transaction model
    if (this.model.item != null) {
      app.execute('show:item', this.model.item)
    } else {
      app.execute('show:item:byId', this.model.get('item'))
    }
  },

  showOwner (e) {
    if (!isOpenedOutside(e)) {
      app.execute('show:inventory:user', this.model.owner)
    }
  },

  cancel () {
    app.execute('ask:confirmation', {
      confirmationText: i18n('transaction_cancel_confirmation'),
      action: this.model.cancelled.bind(this),
      selector: '.cancel'
    })
  }
})
