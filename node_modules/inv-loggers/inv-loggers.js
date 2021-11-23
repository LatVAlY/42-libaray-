const chalk = require('tiny-chalk')
const { grey } = chalk
const print = str => process.stdout.write(str + '\n')

const log = (obj, label, color = 'cyan') => {
  if ((typeof obj === 'string') && (label == null)) {
    print(chalk[color](obj))
    return obj
  } else {
    // converting arguments object to array for readablilty
    if (isArguments(obj)) obj = toArray(obj)
    if (label != null) {
      print(grey('****** ') + chalk[color](label.toString()) + grey(' ******'))
    } else {
      print(chalk[color]('******************************'))
    }
    let objCopy = obj
    let context
    if (obj && obj.context) {
      context = obj.context
      objCopy = Object.assign({}, obj)
      delete objCopy.context
    }
    if (typeof objCopy === 'object') console.log(objCopy)
    else print(objCopy)
    if (context != null) {
      console.log('Context:', context)
    }
    print(grey('-----'))
    return obj
  }
}

const isArguments = obj => obj && obj.toString && obj.toString() === '[object Arguments]'
const toArray = obj => [].slice.call(obj)

const logs_ = {
  log,
  success: (obj, label) => log(obj, label, 'green'),
  info: (obj, label) => log(obj, label, 'blue'),
  // warn and error do not return the result
  warn: (obj, label) => { log(obj, label, 'yellow') },
  error: (err, label) => { log(err, label, 'red') },
  errorRethrow: (err, label) => {
    logs_.error(err, label)
    throw err
  }
}

const partialLogger = logger => label => obj => logger(obj, label)

logs_.Log = partialLogger(logs_.log)
logs_.Error = partialLogger(logs_.error)
logs_.Warn = partialLogger(logs_.warn)
logs_.Info = partialLogger(logs_.info)
logs_.Success = partialLogger(logs_.success)
logs_.ErrorRethrow = partialLogger(logs_.errorRethrow)
// Exposing partialLogger to ease the creation of other loggers
logs_.partialLogger = partialLogger

module.exports = logs_
