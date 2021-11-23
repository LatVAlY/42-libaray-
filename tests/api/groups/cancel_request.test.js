require('should')
const { authReq, authReqC, getUserGetter, customAuthReq } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=cancel-request'
const { humanName } = require('../fixtures/entities')

describe('groups:update:cancel-request', () => {
  it('should reject without group', done => {
    authReq('put', endpoint, {})
    .catch(err => {
      err.body.status_verbose.should.startWith('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject when no request exists for user', done => {
    groupPromise
    .then(group => authReqC('put', endpoint, { group: group._id }))
    .catch(err => {
      err.body.status_verbose.should.startWith('request not found')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })

  it('should cancel a request', done => {
    const requesterPromise = getUserGetter(humanName())()
    Promise.all([ groupPromise, requesterPromise ])
    .then(([ group, requester ]) => {
      return customAuthReq(requesterPromise, 'put', '/api/groups?action=request', { group: group._id })
      .then(() => getGroup(group))
    })
    .then(group => {
      const requesterCount = group.requested.length
      return customAuthReq(requesterPromise, 'put', endpoint, { group: group._id })
      .then(() => getGroup(group))
      .then(updatedGroup => {
        updatedGroup.requested.length.should.equal(requesterCount - 1)
        done()
      })
    })
    .catch(done)
  })
})
