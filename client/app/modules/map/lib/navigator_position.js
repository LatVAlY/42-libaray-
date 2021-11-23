import log_ from 'lib/loggers'
import { truncateDecimals } from './geo'
import pTimeout from 'p-timeout'

// doc: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
const currentPosition = () => new Promise((resolve, reject) => {
  if (navigator.geolocation?.getCurrentPosition == null) {
    const err = new Error('getCurrentPosition isnt accessible')
    return reject(err)
  }

  // getCurrentPosition throws PositionError s that aren't instanceof Error
  // thus the need to create a new error from it
  const formattedReject = err => reject(new Error(err.message || 'getCurrentPosition error'))

  // The timeout option doesn't seem to have any effect
  const options = { timeout: 10 * 1000 }

  navigator.geolocation.getCurrentPosition(resolve, formattedReject, options)
})

const normalizeCoords = function (position) {
  const { latitude, longitude } = position.coords
  return { lat: truncateDecimals(latitude), lng: truncateDecimals(longitude) }
}

const returnPlaceholderCoords = function (err) {
  log_.warn(err, "couldn't obtain user's position: returning placeholder coordinates")
  return {
    lat: 46.2324,
    lng: 6.0450,
    zoom: 3
  }
}

export default containerId => {
  return pTimeout(currentPosition(), 10 * 1000)
  .then(normalizeCoords)
  .then(log_.Info('current position'))
  .catch(returnPlaceholderCoords)
}
