import { ACCEPTED_VERDICT } from './analytics.constants.js'

export function groupSubmissionsByProblem(submissions) {
  const groups = new Map()

  for (const submission of [...submissions].sort(
    (left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0),
  )) {
    const group = groups.get(submission.problemKey) || {
      problemKey: submission.problemKey,
      name: submission.name,
      contestId: submission.contestId,
      index: submission.index,
      rating: submission.rating,
      tags: submission.tags,
      url: submission.url,
      participantType: submission.participantType,
      submissions: [],
    }
    group.submissions.push(submission)
    groups.set(submission.problemKey, group)
  }

  return [...groups.values()]
}

export function summarizeProblemGroup(problem) {
  const acceptedIndex = problem.submissions.findIndex(
    (submission) => submission.verdict === ACCEPTED_VERDICT,
  )
  const solved = acceptedIndex >= 0
  const relevantSubmissions = solved
    ? problem.submissions.slice(0, acceptedIndex + 1)
    : problem.submissions
  const failedSubmissions = relevantSubmissions.filter(
    (submission) => submission.verdict !== ACCEPTED_VERDICT,
  )

  return {
    ...problem,
    solved,
    acceptedIndex,
    relevantSubmissions,
    failedSubmissions,
    lastSubmission: problem.submissions.at(-1) || null,
  }
}

export function analyzeProblemGroups(submissions) {
  return groupSubmissionsByProblem(submissions).map(summarizeProblemGroup)
}
