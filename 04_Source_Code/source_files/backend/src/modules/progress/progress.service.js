import { caseInsensitiveHandleFilter } from '../../utils/codeforcesHelpers.js'
import { Report } from '../report/report.model.js'

function overallWeakness(topics = []) {
  const attempted = topics.reduce((total, topic) => total + topic.attempted, 0)
  if (!attempted) return 0
  return Math.round(
    topics.reduce((total, topic) => total + topic.weakness * topic.attempted, 0) / attempted,
  )
}

export function buildProgressHistory(reports) {
  const ordered = [...reports].sort(
    (left, right) => new Date(left.generatedAt) - new Date(right.generatedAt),
  )
  const points = ordered.map((report) => ({
    reportId: String(report._id || report.id),
    generatedAt: report.generatedAt,
    month: new Date(report.generatedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    solved: report.summary?.solvedProblems || 0,
    rating: report.profile?.rating ?? null,
    weakness: overallWeakness(report.topicAnalysis),
    topics: Object.fromEntries(
      (report.topicAnalysis || []).map((topic) => [topic.topic, topic.weakness]),
    ),
  }))

  const topicImprovement = []
  if (points.length >= 2) {
    const first = points[0].topics
    const latest = points.at(-1).topics
    for (const topic of Object.keys(latest)) {
      if (first[topic] == null) continue
      topicImprovement.push({
        topic,
        previous: first[topic],
        current: latest[topic],
        improvement: first[topic] - latest[topic],
      })
    }
    topicImprovement.sort((left, right) => right.improvement - left.improvement)
  }

  return {
    hasEnoughData: points.length >= 2,
    reportCount: points.length,
    points,
    topicImprovement,
  }
}

export async function getProgressForUser(userId, handle, model = Report) {
  const reports = await model
    .find({ userId, handle: caseInsensitiveHandleFilter(handle) })
    .sort({ generatedAt: 1 })
    .select('profile summary topicAnalysis generatedAt')
    .lean()
  return buildProgressHistory(reports)
}
