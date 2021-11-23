import { isOpenedOutside } from 'lib/utils'
import DonateMenu from '../views/donate_menu'
import FeedbackMenu from '../views/feedback_menu'

export default {
  showLoader () {
    const loader = '<div class="full-screen-loader"><div></div></div>'
    $(app.layout.main.el).html(loader)
  },

  showEntity (e) {
    entityAction(e, 'show:entity')
    if (!isOpenedOutside(e)) {
      // Required to close the ItemShowLayout modal if one was open
      app.execute('modal:close')
    }
  },

  showEntityEdit (e) { entityAction(e, 'show:entity:edit') },
  showEntityCleanup (e) { entityAction(e, 'show:entity:cleanup') },
  showEntityHistory (e) { entityAction(e, 'show:entity:history') },
  showDonateMenu () {
    app.layout.modal.show(new DonateMenu({ navigateOnClose: true }))
    app.navigate('donate')
  },

  showFeedbackMenu (options) {
    // In the case of 'show:feedback:menu', a unique object is passed
    // in which the event object is passed either directly
    // or as the value for the key 'event'
    // but options might also be a click event object
    const event = options?.event || options
    // Known case of missing href: #signalDataError anchors won't have an href
    const ignoreMissingHref = true
    if (!isOpenedOutside(event, ignoreMissingHref)) {
      if (!options) options = {}
      // Do not navigate as that's a  mess to go back then
      // and handle the feedback modals with or without dedicated pathnames
      app.layout.modal.show(new FeedbackMenu(options))
    }
  }
}

const entityAction = function (e, action) {
  const { href } = e.currentTarget
  if (href == null) throw new Error(`couldnt ${action}: href not found`)

  // If the link was Ctrl+clicked or if it was an external link with target='_blank',
  // typically, a link to a Wikidata entity page
  if (!isOpenedOutside(e)) {
    // Any href arriving here should be of the form /entity/:uri(/:label)(/edit)
    const [ uri ] = href.split('/entity/')[1].split('/')
    app.execute(action, uri)
    e.stopPropagation()
  }
}
