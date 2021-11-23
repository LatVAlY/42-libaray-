import fetchEntitiesSequentially from './fetch_entities_sequentially'
import extractIsbns from './extract_isbns'
import getCandidatesFromEntitiesDocs from './get_candidates_from_entities_docs'

export default async text => {
  window.ISBN = window.ISBN || (await import('isbn3')).default
  // window.ISBN should now be initalized
  const isbnsData = extractIsbns(text)

  if (isbnsData.length === 0) return []

  return fetchEntitiesSequentially(isbnsData)
  .then(parseResults)
}

const parseResults = function (data) {
  const { results, isbnsIndex } = data
  const newCandidates = getCandidatesFromEntitiesDocs(results.entities, isbnsIndex)

  return newCandidates
    .concat(results.notFound, results.invalidIsbn)
    // Make sure to display candidates in the order they where input
    // to help the user fill the missing information
    .sort(byIndex(isbnsIndex))
}

const byIndex = isbnsIndex => (a, b) => {
  return isbnsIndex[a.normalizedIsbn].index - isbnsIndex[b.normalizedIsbn].index
}
