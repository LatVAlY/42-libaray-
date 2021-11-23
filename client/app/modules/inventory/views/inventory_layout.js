import preq from 'lib/preq'
import InventoryNav from './inventory_nav'
import InventoryBrowser from './inventory_browser'
import UserProfile from './user_profile'
import GroupProfile from './group_profile'
import ShelfBox from '../../shelves/views/shelf_box'
import ShelvesSection from '../../shelves/views/shelves_section'
import InventoryNetworkNav from './inventory_network_nav'
import InventoryPublicNav from './inventory_public_nav'
import showPaginatedItems from 'modules/welcome/lib/show_paginated_items'
import screen_ from 'lib/screen'
import InventoryWelcome from './inventory_welcome'
import inventoryLayoutTemplate from './templates/inventory_layout.hbs'
import '../scss/inventory_layout.scss'
import error_ from 'app/lib/error'

const navs = {
  network: InventoryNetworkNav,
  public: InventoryPublicNav
}

export default Marionette.LayoutView.extend({
  id: 'inventoryLayout',
  template: inventoryLayoutTemplate,
  regions: {
    inventoryNav: '#inventoryNav',
    sectionNav: '#sectionNav',
    groupProfile: '#groupProfile',
    userProfile: '#userProfile',
    shelvesList: '#shelvesList',
    shelfInfo: '#shelfInfo',
    itemsList: '#itemsList'
  },

  initialize () {
    ({ user: this.user, group: this.group, shelf: this.shelf, standalone: this.standalone } = this.options)
    this.listenTo(app.vent, 'inventory:select', this.showSelectedInventory.bind(this))
  },

  childEvents: {
    'close:shelf': 'closeShelf'
  },

  onShow () {
    if (this.user != null) {
      this.startFromUser(this.user, this.shelf)
      this.showUserShelves(this.user)
    } else if (this.group != null) {
      this.startFromGroup(this.group)
    } else {
      const { section, filter } = this.options
      this.showInventoryNav(section)
      this.showSectionNav(section)
      if (filter == null) this.showSectionLastItems(section)
    }
  },

  startFromUser (user, shelf) {
    return app.request('resolve:to:userModel', user)
    .then(userModel => {
      if (userModel.deleted) {
        const { _id: id, username } = userModel.attributes
        throw error_.new('This user has been deleted', 400, { id, username })
      }
      this._lastShownType = 'user'
      this._lastShownUser = userModel
      if (shelf) {
        this.showShelf(shelf)
      } else {
        this.showUserInventory(userModel)
        app.navigateFromModel(userModel)
      }
      this.showUserProfile(userModel)
      let section = userModel.get('itemsCategory')
      if (section === 'personal') section = 'user'
      this.showInventoryNav(section)
      this.showSectionNav(section, 'user', userModel)
      // Do not scroll when showing the main user's inventory
      // to keep the other nav elements visible
      if (section !== 'user') scrollToSection(this.userProfile)
    })
    .catch(app.Execute('show:error'))
  },

  startFromGroup (group) {
    app.request('resolve:to:groupModel', group)
    .then(async groupModel => {
      if (!this.isIntact()) return
      await this.showGroupInventory(groupModel)
      if (!this.isIntact()) return
      this.showInventoryNav()
      this.showGroupProfile(groupModel)
      app.navigateFromModel(groupModel)
      scrollToSection(this.groupProfile)
    })
    .catch(app.Execute('show:error'))
  },

  showShelf (shelf) {
    const itemsDataPromise = getItemsData('shelf', shelf)
    const isMainUser = app.user.id === shelf.get('owner')
    this.shelfInfo.show(new ShelfBox({ model: shelf }))
    this.itemsList.show(new InventoryBrowser({ itemsDataPromise, isMainUser }))
    this.waitForShelvesList.then(() => scrollToSection(this.shelfInfo))
  },

  showUserShelves (userIdOrModel) {
    this.waitForShelvesList = app.request('resolve:to:userModel', userIdOrModel)
      .then(userModel => {
        if ((this.shelvesList.currentView != null) && (userModel === this._lastShownUser)) return
        const shelvesCount = userModel.get('shelvesCount')
        if (shelvesCount === 0) return
        const username = userModel.get('username')
        this.shelvesList.show(new ShelvesSection({ username }))
        return this.shelvesList.currentView.waitForList
      })
      .catch(app.Execute('show:error'))
  },

  showUserInventory (userModel) {
    if ((userModel === app.user) && (userModel.get('itemsCount') === 0)) {
      this.showInventoryWelcome()
    } else {
      this.showInventoryBrowser('user', userModel)
    }
  },

  showInventoryWelcome () {
    this.itemsList.show(new InventoryWelcome())
  },

  async showGroupInventory (groupModel) {
    await groupModel.beforeShow()
    if (this.isIntact()) this.showInventoryBrowser('group', groupModel)
  },

  async showMemberInventory (member) {
    const memberModel = await app.request('resolve:to:userModel', member)
    if (!this.isIntact()) return
    this.showUserProfile(memberModel)
    this.showInventoryBrowser('user', memberModel)
    scrollToSection(this.userProfile)
  },

  showGroupProfile (groupModel) {
    this.groupProfile.show(new GroupProfile({ model: groupModel }))
  },

  showUserProfile (userModel) {
    this.userProfile.show(new UserProfile({ model: userModel }))
  },

  showInventoryNav (section) {
    if (!app.user.loggedIn) return
    section = !this.standalone || (section === 'user') ? section : undefined
    this.inventoryNav.show(new InventoryNav({ section }))
  },

  showSectionNav (section, type, model) {
    if (this.standalone || !app.user.loggedIn) return
    const SectionNav = navs[section]
    if (SectionNav == null) return
    const options = (type != null) && (model != null) ? { [type]: model } : {}
    options.filter = this.options.filter
    this.sectionNav.show(new SectionNav(options))
  },

  showInventoryBrowser (type, model) {
    const itemsDataPromise = getItemsData(type, model)
    const isMainUser = model?.isMainUser
    this.itemsList.show(new InventoryBrowser({ itemsDataPromise, isMainUser }))
  },

  showSectionLastItems (section) {
    if (section === 'public' && app.user.get('position') == null) {
      // Hide loading spinner
      // (somehow not accessible from this.itemsList.$el)
      $('#itemsList').hide()
    } else {
      showPaginatedItems({
        request: sectionRequest[section],
        region: this.itemsList,
        limit: 20,
        allowMore: true,
        showDistance: section === 'public'
      })
    }
  },

  closeShelf () {
    this.showInventoryBrowser(this._lastShownType, this._lastShownUser)
    scrollToSection(this.userProfile)
    this.shelfInfo.empty()
    app.navigateFromModel(this._lastShownUser, { preventScrollTop: true })
  },

  showSelectedInventory (type, model) {
    if (type === 'user') {
      this._lastShownType = type
      this._lastShownUser = model
      this.showUserInventory(model)
      this.showUserProfile(model)
      this.groupProfile.empty()
      this.shelvesList.empty()
      this.showUserShelves(model)
      scrollToSection(this.userProfile)
    } else if (type === 'group') {
      this.showGroupProfile(model)
      this.userProfile.empty()
      this.shelfInfo.empty()
      this.shelvesList.empty()
      this.showGroupInventory(model)
      scrollToSection(this.groupProfile)
    } else if (type === 'member') {
      this._lastShownType = type
      this._lastShownUser = model
      this.showMemberInventory(model)
      this.showUserShelves(model)
    } else if (type === 'shelf') {
      const userId = model.get('owner')
      this.showUserShelves(userId)
      this.showShelf(model)
    }

    app.navigateFromModel(model, { preventScrollTop: true })
  }
})

const getItemsData = function (type, model) {
  const modelId = model.get('_id')
  const params = { [type]: modelId }
  return preq.get(app.API.items.inventoryView(params))
}

const sectionRequest = {
  network: 'items:getNetworkItems',
  public: 'items:getNearbyItems'
}

const scrollToSection = region => screen_.scrollTop({ $el: region.$el, marginTop: 10, delay: 100 })
