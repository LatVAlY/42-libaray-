import { findNextActions, isArchived as _isArchived } from './transactions'
import * as infoPartials from './info_partials'
import actionsData from './actions_data'

export const getNextActionsData = function (transaction) {
  const nextActions = proxyFindNextActions(transaction)
  let data = actionsData()[nextActions]
  if (data == null) return
  data = addTransactionInfo(data, transaction)
  return grabOtherUsername(transaction, data)
}

// TODO: remove the adapter now that the lib isn't shared with the server anymore
const proxyFindNextActions = transaction => findNextActions(sharedLibAdapter(transaction))

const sharedLibAdapter = transaction => ({
  name: transaction.get('transaction'),
  state: transaction.get('state'),
  mainUserIsOwner: transaction.mainUserIsOwner
})

const addTransactionInfo = function (data, transaction) {
  const transactionMode = transaction.get('transaction')
  return data.map(action => {
    action[transactionMode] = true
    action.itemId = transaction.get('item')
    const infoData = infoPartials[transactionMode][action.text]
    if (infoData != null) _.extend(action, infoData)
    return action
  })
}

const grabOtherUsername = function (transaction, actions) {
  const username = transaction.otherUser()?.get('username')
  return actions.map(action => _.extend({}, action, { username }))
}

export function isArchived (transaction) {
  return _isArchived(sharedLibAdapter(transaction))
}
