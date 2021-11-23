export default Backbone.Collection.extend({
  comparator (model) {
    // messages have a 'created' date
    // actions have a 'timestamp' date
    return model.get('created') || model.get('timestamp')
  }
})
