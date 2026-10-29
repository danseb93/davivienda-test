export function createSearchExpression(searchTerm: string): RegExp | null {
  const term = searchTerm.trim()
  if (!term) return null

  const exactPhrase = /^".*"$/.test(term)
  if (exactPhrase) {
    const phrase = term.slice(1, -1).trim()
    if (!phrase) return null
    return new RegExp(
      phrase.split(/\s+/).map(escapeRegExp).join('\\s+'),
      'giu',
    )
  }

  const words = term.match(/[\p{L}\p{N}_]+/gu) ?? []
  if (!words.length) return null
  const alternatives = [...new Set(words)]
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
  return new RegExp(`\\b(?:${alternatives.join('|')})[\\p{L}\\p{N}_]*`, 'giu')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
