import { tryAsync } from 'lib/promises'
import preq from 'lib/preq'
import forms_ from 'modules/general/lib/forms'
let username_

export default username_ = {
  pass (username, selector) {
    return forms_.pass({
      value: username,
      tests: usernameTests,
      selector
    })
  },

  verifyAvailability (username, selector) {
    return preq.get(app.API.auth.usernameAvailability(username))
    .catch(err => {
      err.selector = selector
      throw err
    })
  }
}

username_.verifyUsername = (username, selector) => tryAsync(username_.pass.bind(null, username, selector))
.then(username_.verifyAvailability.bind(null, username, selector))

const usernameTests = {
  'username should be 2 characters minimum' (username) { return username.length < 2 },
  'username should be 20 characters maximum' (username) { return username.length > 20 },
  "username can't contain space" (username) { return /\s/.test(username) },
  'username can only contain letters, figures or _' (username) { return /\W/.test(username) }
}
