import { getCodeforcesProblemset, getCodeforcesSnapshot } from "../codeforces/codeforces.service.js";
import { ACCEPTED_VERDICT, topicDisplayNames, topicShortNames } from "./analytics.constants.js";
import { groupSubmissionsByProblem } from "./problemAnalyzer.js";
import { analyzeRatingBands } from "./ratingAnalyzer.js";
import { analyzeUpsolving } from "./upsolvingAnalyzer.js";
import { analyzeVerdicts } from "./verdictAnalyzer.js";
import { calculateWeaknessScore } from "./weaknessEngine.js";

export { groupSubmissionsByProblem } from "./problemAnalyzer.js";

function daysBetween(date, now) {
  if (!date) return 30;
  return Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / 86400000));
}

export function analyzeTopics(submissions, now = new Date()) {
  const topics = new Map();
  for (const problem of groupSubmissionsByProblem(submissions)) {
    const acceptedIndex = problem.submissions.findIndex((s) => s.verdict === ACCEPTED_VERDICT);
    const solved = acceptedIndex >= 0;
    const relevant = solved ? problem.submissions.slice(0, acceptedIndex + 1) : problem.submissions;
    const failed = relevant.filter((s) => s.verdict !== ACCEPTED_VERDICT);
    const last = problem.submissions.at(-1);
    for (const rawTag of problem.tags) {
      const topicName = topicDisplayNames[rawTag] || rawTag;
      const key = topicName.toLowerCase();
      const topic = topics.get(key) || {
        topic: topicName,
        short: topicShortNames[key] || topicName,
        attempted: 0,
        solved: 0,
        failed: 0,
        unsolved: 0,
        wrongAnswerCount: 0,
        timeLimitCount: 0,
        runtimeErrorCount: 0,
        attemptsBeforeAcTotal: 0,
        solvedWithAttempts: 0,
        lastPracticedAt: null,
      };
      topic.attempted += 1;
      topic.solved += solved ? 1 : 0;
      topic.unsolved += solved ? 0 : 1;
      topic.failed += failed.length;
      topic.wrongAnswerCount += failed.filter((s) => s.verdict === "WRONG_ANSWER").length;
      topic.timeLimitCount += failed.filter((s) => s.verdict === "TIME_LIMIT_EXCEEDED").length;
      topic.runtimeErrorCount += failed.filter((s) => ["RUNTIME_ERROR", "MEMORY_LIMIT_EXCEEDED"].includes(s.verdict)).length;
      if (solved) {
        topic.attemptsBeforeAcTotal += relevant.length;
        topic.solvedWithAttempts += 1;
      }
      if (last?.createdAt && (!topic.lastPracticedAt || new Date(last.createdAt) > new Date(topic.lastPracticedAt))) {
        topic.lastPracticedAt = last.createdAt;
      }
      topics.set(key, topic);
    }
  }
  return [...topics.values()]
    .map((topic) => {
      const rate = topic.attempted ? Math.round((topic.solved / topic.attempted) * 100) : 0;
      const daysSincePractice = daysBetween(topic.lastPracticedAt, now);
      const { score, components } = calculateWeaknessScore({ ...topic, daysSincePractice });
      return {
        topic: topic.topic,
        short: topic.short,
        attempted: topic.attempted,
        solved: topic.solved,
        failed: topic.failed,
        unsolved: topic.unsolved,
        rate,
        avgAttemptsBeforeAc: topic.solvedWithAttempts ? Number((topic.attemptsBeforeAcTotal / topic.solvedWithAttempts).toFixed(2)) : null,
        weakness: score,
        last: topic.lastPracticedAt,
        components,
        verdicts: { wrongAnswer: topic.wrongAnswerCount, timeLimit: topic.timeLimitCount, runtimeError: topic.runtimeErrorCount },
      };
    })
    .sort((a, b) => b.weakness - a.weakness);
}

export function createSummary(snapshot, topicAnalysis) {
  const problems = groupSubmissionsByProblem(snapshot.submissions);
  const solved = problems.filter((p) => p.submissions.some((s) => s.verdict === ACCEPTED_VERDICT)).length;
  const latestSubmissionId = snapshot.submissions.reduce((max, s) => Math.max(max, s.submissionId || 0), 0);
  return {
    profile: snapshot.profile,
    totalSubmissions: snapshot.submissions.length,
    attemptedProblems: problems.length,
    solvedProblems: solved,
    unsolvedAttemptedProblems: problems.length - solved,
    acRate: problems.length ? Math.round((solved / problems.length) * 100) : 0,
    topWeaknesses: topicAnalysis.slice(0, 5),
    ratingHistory: snapshot.ratingHistory,
    recentActivity: snapshot.submissions.slice(0, 6).map((s) => ({
      submissionId: s.submissionId,
      problemKey: s.problemKey,
      contestId: s.contestId,
      index: s.index,
      name: s.name,
      rating: s.rating,
      verdict: s.verdict,
      createdAt: s.createdAt,
      url: s.url,
    })),
    source: { submissionCount: snapshot.submissions.length, latestSubmissionId, fetchedAt: snapshot.fetchedAt },
  };
}

export async function analyzeHandle(handle, options = {}) {
  const problemsetRequest = getCodeforcesProblemset(options.refreshProblemset ? { forceRefresh: true } : undefined).catch(() => []);
  const [snapshot, problemCatalog] = await Promise.all([getCodeforcesSnapshot(handle, options), problemsetRequest]);
  return buildAnalysisFromSnapshot(snapshot, problemCatalog);
}

export function buildAnalysisFromSnapshot(snapshot, problemCatalog = []) {
  const topicAnalysis = analyzeTopics(snapshot.submissions);
  const ratingAnalysis = analyzeRatingBands(snapshot.submissions);
  const verdictAnalysis = analyzeVerdicts(snapshot.submissions);
  const upsolvingAnalysis = analyzeUpsolving(snapshot.submissions, snapshot.profile, topicAnalysis);
  const summary = createSummary(snapshot, topicAnalysis);
  return {
    profile: snapshot.profile,
    summary,
    topicAnalysis,
    ratingAnalysis,
    verdictAnalysis,
    upsolvingAnalysis,
    generatedAt: snapshot.fetchedAt,
    metadata: summary.source,
    cache: { cached: Boolean(snapshot.cached), stale: Boolean(snapshot.stale) },
  };
}
