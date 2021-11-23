import { reportError } from 'lib/reports'

export const props = async obj => {
  const keys = []
  const values = []
  for (const key in obj) {
    const value = obj[key]
    keys.push(key)
    values.push(value)
  }

  const res = await Promise.all(values)
  const resultObj = {}
  res.forEach((valRes, index) => {
    const key = keys[index]
    resultObj[key] = valRes
  })
  return resultObj
}

export const tryAsync = async fn => fn()

export const tap = fn => async res => {
  const tapRes = fn(res)
  if (tapRes instanceof Promise) await tapRes
  return res
}

export const map = fn => array => Promise.all(array.map(fn))

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

// Isn't defined in test environment
if (window.addEventListener != null) {
  // see http://2ality.com/2016/04/unhandled-rejections.html
  window.addEventListener('unhandledrejection', event => {
    const err = event.reason
    console.error(`PossiblyUnhandledRejection: ${err.message}\n\n${err.stack}`, err, err.context)
    reportError(err)
  })
}
