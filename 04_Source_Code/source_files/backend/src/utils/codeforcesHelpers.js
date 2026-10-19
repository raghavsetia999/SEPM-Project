export function createProblemKey(problem = {}) {
  if (problem.contestId != null && problem.index) {
    return `${problem.contestId}-${problem.index}`
  }

  const name = String(problem.name || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `unrated-${name || 'unknown'}`
}

export function codeforcesProblemUrl(contestId, index) {
  if (contestId == null || !index) return null
  return `https://codeforces.com/problemset/problem/${contestId}/${index}`
}

export function normalizeTag(tag) {
  return String(tag).trim().toLowerCase()
}

export function caseInsensitiveHandleFilter(handle) {
  const escaped = String(handle || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped}$`, 'i')
}
