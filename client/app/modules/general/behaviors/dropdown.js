export default Marionette.Behavior.extend({
  ui: {
    dropdown: '.dropdown'
  },

  events: {
    'click .has-dropdown': 'toggleDropdown'
  },

  toggleDropdown (e) {
    const $hasDropdown = $(e.currentTarget)
    const isDisabled = $hasDropdown.hasClass('disabled')
    const $dropdown = $hasDropdown.find('.dropdown')
    const isVisible = $dropdown.css('display') !== 'none'
    if (isVisible) {
      return hide($dropdown)
    } else if (!isDisabled) {
      show($dropdown)
      // Let a delay so that the toggle click itself isn't catched by the listener
      return this.view.setTimeout(closeOnClick.bind(this, $dropdown), 100)
    }
  }
})

const hide = function ($dropdown) {
  $dropdown.hide()
  return $dropdown.removeClass('hover')
}

const show = function ($dropdown) {
  $dropdown.show()
  return $dropdown.addClass('hover')
}

const closeOnClick = function ($dropdown) {
  this.listenToOnce(app.vent, 'body:click', hide.bind(null, $dropdown))
}
