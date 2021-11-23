// A middleware to catch other middlewares errors and repackage them
// in JSON and with more readable error reports
const error_ = require('lib/error/error')
const { logoutRedirect } = require('controllers/auth/connection')

module.exports = (err, req, res, next) => {
  // Repackaging errors generated by body-parser
  if ((err.name === 'SyntaxError') && err.message.startsWith('Unexpected token')) {
    error_.bundle(req, res, 'invalid JSON body', 400)
  } else if (err.name === 'SessionError') {
    const { pathname } = req._parsedUrl
    logoutRedirect(`/login?redirect=${pathname}`, req, res, next)
  } else {
    error_.handler(req, res, err)
  }
}