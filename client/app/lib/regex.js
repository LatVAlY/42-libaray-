// Keep in sync with server/lib/regex

// adapted from http://stackoverflow.com/a/14582229/3324977
const urlPattern = '^(https?:\\/\\/)' + // protocol
  '(\\w+:\\w+@)?' + // auth?
  '((([a-z\\d]([a-z\\d-_]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))|' + // OR ip (v4) address
  '(localhost)' + // OR localhost
  '(\\:\\d+)?' + // port?
  '(\\/[-a-z\\d%_.~+]*)*' + // path
  '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string?
  '(\\#[-a-z\\d_]*)?$' // fragment?

export const Url = new RegExp(urlPattern, 'i')
export const ImageHash = /^[0-9a-f]{40}$/
export const Email = /^[^@]+@[^@]+\.[^@]+$/
export const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
export const CouchUuid = /^[0-9a-f]{32}$/
export const Lang = /^\w{2}$/
export const LocalImg = /^\/img\/(entities|groups|users)\/[0-9a-f]{40}$/
export const AssetImg = /^\/img\/assets\/\w/
export const UserImg = /^\/img\/users\/[0-9a-f]{40}$/
export const Username = /^\w{2,20}$/
export const EntityUri = /^(wd:Q\d+|inv:[0-9a-f]{32}|isbn:\w{10}(\w{3})?)$/
export const PropertyUri = /^(wdt|invp):P\d+$/
export const SimpleDay = /^-?([1-9]{1}[0-9]{0,3}|0)(-\d{2})?(-\d{2})?$/
