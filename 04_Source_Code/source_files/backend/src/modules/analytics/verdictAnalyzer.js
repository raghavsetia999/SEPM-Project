import { analyzeProblemGroups } from './problemAnalyzer.js'

const verdictLabels = {
  OK: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  COMPILATION_ERROR: 'Compilation Error',
  RUNTIME_ERROR: 'Runtime Error',
  MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
  IDLENESS_LIMIT_EXCEEDED: 'Idleness Limit Exceeded',
  CHALLENGED: 'Challenged',
  SKIPPED: 'Skipped',
  TESTING: 'Testing',
  UNKNOWN: 'Unknown',
}

const verdictColors = {
  OK: '#22d3ee',
  WRONG_ANSWER: '#8b5cf6',
  TIME_LIMIT_EXCEEDED: '#f59e0b',
  COMPILATION_ERROR: '#64748b',
  RUNTIME_ERROR: '#f43f5e',
  MEMORY_LIMIT_EXCEEDED: '#fb7185',
}

function topTagCounts(counts, limit = 5) {
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
    .slice(0, limit)
}

export function analyzeVerdicts(submissions) {
  const totalSubmissions = submissions.length
  const verdictCounts = new Map()
  const wrongAnswerTags = new Map()
  const timeLimitTags = new Map()

  for (const submission of submissions) {
    const verdict = submission.verdict || 'UNKNOWN'
    verdictCounts.set(verdict, (verdictCounts.get(verdict) || 0) + 1)
    const target =
      verdict === 'WRONG_ANSWER'
        ? wrongAnswerTags
        : verdict === 'TIME_LIMIT_EXCEEDED'
          ? timeLimitTags
          : null
    if (target) {
      for (const tag of submission.tags) target.set(tag, (target.get(tag) || 0) + 1)
    }
  }

  const distribution = [...verdictCounts.entries()]
    .map(([key, value]) => ({
      key,
      name: verdictLabels[key] || key.replaceAll('_', ' '),
      value,
      percentage: totalSubmissions ? Number(((value / totalSubmissions) * 100).toFixed(1)) : 0,
      color: verdictColors[key] || '#94a3b8',
    }))
    .sort((left, right) => right.value - left.value)

  const failedDistribution = distribution.filter((item) => item.key !== 'OK')
  const problems = analyzeProblemGroups(submissions)
  const solvedProblems = problems.filter((problem) => problem.solved)
  const firstTrySolvedProblems = solvedProblems.filter(
    (problem) => problem.relevantSubmissions.length === 1,
  ).length
  const multiAttemptSolvedProblems = solvedProblems.length - firstTrySolvedProblems
  const failedBeforeAc = solvedProblems.reduce(
    (total, problem) => total + problem.failedSubmissions.length,
    0,
  )

  const mostPainfulProblems = problems
    .map((problem) => ({
      problemKey: problem.problemKey,
      name: problem.name,
      rating: problem.rating,
      tags: problem.tags,
      solved: problem.solved,
      failedAttempts: problem.failedSubmissions.length,
      totalAttempts: problem.relevantSubmissions.length,
      lastVerdict: problem.lastSubmission?.verdict || 'UNKNOWN',
      url: problem.url,
    }))
    .filter((problem) => problem.failedAttempts > 0)
    .sort(
      (left, right) =>
        right.failedAttempts - left.failedAttempts || Number(left.solved) - Number(right.solved),
    )
    .slice(0, 10)

  return {
    totalSubmissions,
    acceptedCount: verdictCounts.get('OK') || 0,
    failedCount: totalSubmissions - (verdictCounts.get('OK') || 0),
    distribution,
    mostCommonFailedVerdict: failedDistribution[0] || null,
    wrongAnswerHeavyTags: topTagCounts(wrongAnswerTags),
    timeLimitHeavyTags: topTagCounts(timeLimitTags),
    averageFailedAttemptsBeforeAc: solvedProblems.length
      ? Number((failedBeforeAc / solvedProblems.length).toFixed(2))
      : 0,
    firstTrySolvedProblems,
    multiAttemptSolvedProblems,
    mostPainfulProblems,
  }
}
