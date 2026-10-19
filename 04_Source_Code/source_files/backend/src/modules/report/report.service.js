import { analyzeHandle } from "../analytics/analytics.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { caseInsensitiveHandleFilter } from "../../utils/codeforcesHelpers.js";
import { Report } from "./report.model.js";

function overallWeakness(topics = []) {
  const attempted = topics.reduce((total, topic) => total + (topic.attempted || 0), 0);
  if (!attempted) return 0;
  return Math.round(
    topics.reduce((total, topic) => total + (topic.weakness || 0) * (topic.attempted || 0), 0) /
      attempted,
  );
}

export function buildWeeklyComparison(previousReport, analysis) {
  if (!previousReport) return { hasBaseline: false };
  return {
    hasBaseline: true,
    previousGeneratedAt: previousReport.generatedAt,
    solvedChange:
      (analysis.summary?.solvedProblems || 0) - (previousReport.summary?.solvedProblems || 0),
    ratingChange: (analysis.profile?.rating || 0) - (previousReport.profile?.rating || 0),
    weaknessChange:
      overallWeakness(analysis.topicAnalysis) - overallWeakness(previousReport.topicAnalysis),
  };
}

export function buildReportPayload(userId, analysis, options = {}) {
  return {
    userId,
    handle: analysis.profile.handle,
    reportType: options.reportType || "manual",
    profile: analysis.profile,
    summary: analysis.summary,
    topicAnalysis: analysis.topicAnalysis,
    ratingAnalysis: analysis.ratingAnalysis,
    verdictAnalysis: analysis.verdictAnalysis,
    upsolvingProblems: analysis.upsolvingAnalysis,
    weeklyComparison: options.weeklyComparison || null,
    generatedAt: options.generatedAt || analysis.generatedAt || new Date(),
    metadata: {
      source: "codeforces",
      analyticsVersion: 1,
      reportType: options.reportType || "manual",
      ...analysis.metadata,
    },
    source: analysis.metadata,
    isSaved: true,
  };
}

export async function saveReportForUser(
  user,
  handle,
  dependencies = { analyze: analyzeHandle, model: Report },
  options = {},
) {
  const analysis = await dependencies.analyze(handle, { forceRefresh: true });
  const report = await dependencies.model.create(buildReportPayload(user.id, analysis, options));
  return report.toJSON ? report.toJSON() : report;
}

export async function ensureWeeklyReportForUser(
  user,
  dependencies = { analyze: analyzeHandle, model: Report },
  now = new Date(),
) {
  if (!user.preferences?.weeklyReport) {
    throw new ApiError(403, "WEEKLY_REPORTS_DISABLED", "Enable weekly reports first.");
  }
  if (!user.codeforcesHandle) {
    throw new ApiError(400, "CODEFORCES_HANDLE_REQUIRED", "Add a Codeforces handle first.");
  }

  const latest = await dependencies.model
    .findOne({
      userId: user.id,
      handle: caseInsensitiveHandleFilter(user.codeforcesHandle),
      reportType: "weekly",
    })
    .sort({ generatedAt: -1 })
    .lean();
  const nextEligibleAt = latest
    ? new Date(new Date(latest.generatedAt).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;

  if (latest && nextEligibleAt > now) {
    return { report: latest, generated: false, nextEligibleAt };
  }

  const analysis = await dependencies.analyze(user.codeforcesHandle, { forceRefresh: true });
  const weeklyComparison = buildWeeklyComparison(latest, analysis);
  const report = await dependencies.model.create(
    buildReportPayload(user.id, analysis, {
      reportType: "weekly",
      weeklyComparison,
      generatedAt: now,
    }),
  );
  const serialized = report.toJSON ? report.toJSON() : report;
  return {
    report: serialized,
    generated: true,
    nextEligibleAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
}

export async function listReportsForUser(userId) {
  return Report.find({ userId })
    .sort({ generatedAt: -1 })
    .select("handle reportType profile summary generatedAt metadata createdAt")
    .lean();
}

export async function getReportForUser(userId, reportId) {
  const report = await Report.findOne({ _id: reportId, userId }).lean();
  if (!report) throw new ApiError(404, "REPORT_NOT_FOUND", "Report not found.");
  return report;
}

export async function getLatestReportForHandle(userId, handle, model = Report) {
  const report = await model
    .findOne({ userId, handle: caseInsensitiveHandleFilter(handle) })
    .sort({ generatedAt: -1 })
    .lean();
  if (!report) throw new ApiError(404, "REPORT_NOT_FOUND", "No saved report found.");
  return report;
}

export async function deleteReportForUser(userId, reportId) {
  const report = await Report.findOneAndDelete({ _id: reportId, userId });
  if (!report) throw new ApiError(404, "REPORT_NOT_FOUND", "Report not found.");
  return { deleted: true, id: reportId };
}
