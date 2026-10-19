import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Code2,
  Download,
  Info,
  RefreshCw,
  Search,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Card, ClampedText, Input, Progress, Select } from '../components/ui'
import {
  BarChartView,
  ChartCard,
  DonutChart,
  InsightBanner,
  LoadingState,
  RatingBadge,
  SectionHeader,
  StatCard,
  TrendChart,
  VerdictBadge,
  WeaknessCard,
} from '../components/AppComponents'
import { useAuth } from '../context/AuthContext'
import { useAnalytics } from '../context/AnalyticsContext'
import { analyticsApi } from '../services/analyticsApi'
import { getApiErrorMessage } from '../services/apiClient'
import { reportApi } from '../services/reportApi'

function formatVerdict(verdict) {
  const labels = {
    OK: 'Accepted',
    WRONG_ANSWER: 'Wrong answer',
    TIME_LIMIT_EXCEEDED: 'Time limit',
    COMPILATION_ERROR: 'Compilation error',
    RUNTIME_ERROR: 'Runtime error',
    MEMORY_LIMIT_EXCEEDED: 'Memory limit',
  }
  return labels[verdict] || String(verdict || 'Unknown').replaceAll('_', ' ')
}

function formatRelativeTime(value) {
  if (!value) return 'Unknown'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

function formatReadableDate(value) {
  if (!value) return 'No recorded activity'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const dayDifference = Math.round((startOfToday - startOfDate) / 86400000)
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  if (dayDifference === 0) return `Today, ${time}`
  if (dayDifference === 1) return `Yesterday, ${time}`
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatFullDate(value) {
  if (!value) return 'No recorded activity'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function AnalyticsState({ loading, error, onRetry }) {
  if (loading) return <LoadingState />
  async function retry() {
    const toastId = toast.loading('Retrying analytics...')
    const result = await onRetry()
    if (result) toast.success('Analytics loaded', { id: toastId })
    else toast.error('Analytics are still unavailable', { id: toastId })
  }
  return (
    <Card className="flex gap-4 border-rose-400/20 bg-rose-400/[.04] p-5">
      <XCircle className="shrink-0 text-rose-300" />
      <div className="min-w-0">
        <h2 className="font-semibold text-rose-200">Live analytics unavailable</h2>
        <p className="mt-1 break-words text-sm text-slate-500">
          {error || 'No analysis is loaded yet.'}
        </p>
        <Button className="mt-4" size="sm" onClick={retry}>
          Retry
        </Button>
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const { user: account } = useAuth()
  const { report, loading, error, refresh } = useAnalytics()
  const handle = account?.codeforcesHandle

  async function refreshDashboard(force = false) {
    const toastId = toast.loading(
      force ? 'Refreshing live Codeforces data...' : 'Loading analytics...',
    )
    const result = await refresh(undefined, { refresh: force })
    if (result)
      toast.success(force ? 'Live analytics refreshed' : 'Analytics loaded', { id: toastId })
    else toast.error('Could not refresh analytics', { id: toastId })
  }

  if (!report && loading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Live Codeforces data"
          title={`Loading ${handle || 'your handle'}`}
          description="Fetching and analyzing the latest public submission history."
        />
        <LoadingState />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Dashboard" title="Performance overview" />
        <Card className="flex gap-4 border-rose-400/20 bg-rose-400/[.04] p-5">
          <XCircle className="shrink-0 text-rose-300" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-rose-200">Could not load live data</h2>
            <p className="mt-1 break-words text-sm text-slate-500">
              {error || 'Add your Codeforces handle in onboarding before loading the dashboard.'}
            </p>
            <Button className="mt-4" size="sm" onClick={() => refreshDashboard()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const summary = report.summary
  const profile = report.profile || summary.profile
  const ratingGap = Math.max((account.targetRating || 1600) - (profile.rating || 0), 0)
  const ratingProgress = summary.ratingHistory.slice(-12).map((change) => ({
    month: new Date(change.changedAt).toLocaleDateString(undefined, {
      month: 'short',
      year: '2-digit',
    }),
    rating: change.newRating,
  }))
  const topWeakness = summary.topWeaknesses[0]
  const cachedSnapshot = Boolean(error || report.cache?.cached || report.isSaved)

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-6 sm:p-7">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-cyan-400/[.07] to-transparent" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <Badge tone={cachedSnapshot ? 'amber' : 'green'}>
              {cachedSnapshot ? 'Cached performance snapshot' : '● Live Codeforces data'}
            </Badge>
            <h2 className="mt-3 break-words text-2xl font-semibold tracking-tight">
              Welcome back, {profile.handle} <span className="text-slate-600">/</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {profile.rating == null
                ? 'Your profile is currently unrated.'
                : `You’re ${ratingGap} points away from your ${account.targetRating || 1600} target.`}
            </p>
          </div>
          <Button onClick={() => refreshDashboard(true)}>
            <RefreshCw size={16} /> Refresh live data
          </Button>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total submissions" value={summary.totalSubmissions} icon={Code2} />
        <StatCard label="Solved problems" value={summary.solvedProblems} icon={CheckCircle2} />
        <StatCard label="Current rating" value={profile.rating ?? 'Unrated'} icon={BarChart3} />
        <StatCard
          label="Max rating"
          value={profile.maxRating ?? 'Unrated'}
          icon={Trophy}
          caption={profile.rank}
        />
        <StatCard label="Problem AC rate" value={`${summary.acRate}%`} icon={Target} />
        <StatCard
          label="Unsolved attempts"
          value={summary.unsolvedAttemptedProblems}
          icon={AlertTriangle}
          caption="Unique problems"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Topic-wise weakness" subtitle="Higher score means more attention needed">
          <BarChartView
            data={summary.topWeaknesses}
            dataKey="weakness"
            nameKey="short"
            color="#8b5cf6"
          />
        </ChartCard>
        <ChartCard title="Rating progress" subtitle="Your latest rated contests">
          <TrendChart data={ratingProgress} />
        </ChartCard>
      </div>
      <InsightBanner>
        {topWeakness ? (
          <>
            Your highest current weakness is{' '}
            <strong className="text-white">{topWeakness.topic}</strong>, with a score of{' '}
            {topWeakness.weakness}/100 and a {topWeakness.rate}% problem conversion rate.
          </>
        ) : (
          'Not enough tagged submissions are available to calculate topic weaknesses.'
        )}
      </InsightBanner>
      <Card>
        <div className="p-5">
          <SectionHeader
            title="Recent activity"
            description="Your latest Codeforces submissions"
            action={<Badge tone="cyan">Latest {summary.recentActivity.length}</Badge>}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead>
              <tr className="border-y border-white/[.06] text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Problem</th>
                <th className="px-4 font-medium">Rating</th>
                <th className="px-4 font-medium">Verdict</th>
                <th className="px-4 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentActivity.map((activity) => (
                <tr
                  key={activity.submissionId}
                  className="border-b border-white/[.04] last:border-0"
                >
                  <td className="max-w-80 px-5 py-4">
                    <ClampedText
                      as="a"
                      lines={1}
                      expandable={false}
                      href={activity.url || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="block font-medium hover:text-cyan-300"
                      text={activity.name}
                    >
                      {activity.name}
                    </ClampedText>
                    <ClampedText lines={1} className="font-mono text-xs text-slate-600">
                      {activity.problemKey}
                    </ClampedText>
                  </td>
                  <td className="px-4">
                    <RatingBadge>{activity.rating ?? 'Unrated'}</RatingBadge>
                  </td>
                  <td className="px-4">
                    <VerdictBadge>{formatVerdict(activity.verdict)}</VerdictBadge>
                  </td>
                  <td className="px-4 text-slate-500">{formatRelativeTime(activity.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function AnalyzeHandlePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: account } = useAuth()
  const { setReport: cacheReport } = useAnalytics()
  const [state, setState] = useState('idle')
  const [handle, setHandle] = useState(
    searchParams.get('handle') || account?.codeforcesHandle || '',
  )
  const [report, setReport] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const requestedHandle = searchParams.get('handle')
    if (requestedHandle) {
      setHandle(requestedHandle)
      setState('idle')
    }
  }, [searchParams])
  async function analyze() {
    if (!handle.trim()) {
      setErrorMessage('Enter a Codeforces handle to continue.')
      setState('error')
      return
    }
    setErrorMessage('')
    setState('loading')
    try {
      const nextReport = await analyticsApi.analyze(handle.trim(), { refresh: true })
      setReport(nextReport)
      if (handle.trim().toLowerCase() === account?.codeforcesHandle?.toLowerCase()) {
        cacheReport(nextReport, handle.trim())
      }
      toast.success(`Analysis completed for ${nextReport.profile.handle}`)
      setState('done')
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setErrorMessage(message)
      toast.error(message)
      setState('error')
    }
  }
  function chooseHandle(value) {
    setHandle(value)
    setState('idle')
  }
  async function saveReport() {
    setSaving(true)
    setErrorMessage('')
    const toastId = toast.loading('Saving performance report...')
    try {
      const saved = await reportApi.save(handle.trim())
      toast.success('Report saved successfully', { id: toastId })
      navigate(`/report/${saved.id || saved._id}`)
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setErrorMessage(message)
      toast.error(message, { id: toastId })
    } finally {
      setSaving(false)
    }
  }
  async function saveAndDownloadPdf() {
    setExporting(true)
    setErrorMessage('')
    const toastId = toast.loading('Generating PDF report...')
    try {
      const saved = await reportApi.save(handle.trim())
      const reportId = saved.id || saved._id
      const blob = await reportApi.exportPdf(reportId)
      downloadBlob(blob, `cp-performance-${saved.handle || handle.trim()}.pdf`)
      toast.success('PDF report downloaded', { id: toastId })
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setErrorMessage(message)
      toast.error(message, { id: toastId })
    } finally {
      setExporting(false)
    }
  }
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Public profile analysis"
        title="Analyze any Codeforces handle"
        description="Pull a public submission history and turn it into a performance snapshot."
      />
      <Card className="p-6">
        <div className="mx-auto max-w-2xl">
          <label htmlFor="handle" className="text-sm font-medium">
            Codeforces handle
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
              />
              <Input
                id="handle"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value)
                  setState('idle')
                }}
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
                className="pl-10"
                aria-invalid={state === 'error'}
              />
            </div>
            <Button onClick={analyze} disabled={state === 'loading'}>
              <BarChart3 size={16} /> {state === 'loading' ? 'Analyzing…' : 'Analyze handle'}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            Try:{' '}
            {['tourist', 'Benq', 'Um_nik'].map((x) => (
              <button
                key={x}
                onClick={() => chooseHandle(x)}
                className="text-slate-400 transition hover:text-cyan-300"
              >
                {x}
              </button>
            ))}
          </div>
        </div>
      </Card>
      {state === 'loading' && <LoadingState />}
      {state === 'error' && (
        <Card className="flex gap-4 border-rose-400/20 bg-rose-400/[.04] p-5">
          <XCircle className="shrink-0 text-rose-300" />
          <div className="min-w-0">
            <h3 className="font-semibold text-rose-200">Analysis failed</h3>
            <p className="mt-1 break-words text-sm text-slate-500">{errorMessage}</p>
          </div>
        </Card>
      )}
      {state === 'idle' && (
        <Card className="dot-grid grid min-h-64 place-items-center p-8 text-center">
          <div>
            <Search className="mx-auto mb-4 text-slate-700" size={36} />
            <h3 className="font-semibold">Ready when you are</h3>
            <p className="mt-2 text-sm text-slate-500">
              Enter a handle to generate a public performance snapshot.
            </p>
          </div>
        </Card>
      )}
      {state === 'done' && (
        <>
          <Card className="overflow-hidden">
            <div className="border-b border-white/[.06] bg-gradient-to-r from-cyan-400/[.08] to-violet-400/[.06] p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400 font-mono text-xl font-bold text-slate-950">
                  {handle.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{handle}</h2>
                    <Badge tone="green">Valid handle</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {report.summary.profile.rank} · {report.summary.profile.country || 'Codeforces'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-px bg-white/[.05] sm:grid-cols-3 lg:grid-cols-6">
              {[
                ['Handle', handle],
                ['Rank', report.summary.profile.rank],
                ['Rating', report.summary.profile.rating ?? 'Unrated'],
                ['Max rating', report.summary.profile.maxRating ?? 'Unrated'],
                ['Contribution', report.summary.profile.contribution],
                ['Friends', report.summary.profile.friendOfCount],
              ].map(([l, v]) => (
                <div key={l} className="bg-[#0e131d] p-5">
                  <p className="text-xs text-slate-600">{l}</p>
                  <p className="mt-1 font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </Card>
          <InsightBanner>
            We found{' '}
            <strong className="text-white">
              {report.summary.totalSubmissions} submissions across{' '}
              {report.summary.attemptedProblems} problems
            </strong>
            .{' '}
            {report.topicAnalysis[0]
              ? `${report.topicAnalysis[0].topic} is currently the highest-scoring weakness.`
              : 'There is not enough tagged activity to rank weaknesses yet.'}
          </InsightBanner>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={saveAndDownloadPdf} disabled={exporting || saving}>
              <Download size={16} /> {exporting ? 'Generating PDF…' : 'Download PDF'}
            </Button>
            <Button onClick={saveReport} disabled={saving}>
              {saving ? 'Saving report…' : 'Save full report'} <ArrowRight size={16} />
            </Button>
          </div>
          {errorMessage && <p className="text-right text-sm text-rose-300">{errorMessage}</p>}
        </>
      )}
    </div>
  )
}

export function WeaknessReportPage() {
  const { report, loading, error, refresh } = useAnalytics()
  const [sortMode, setSortMode] = useState('weakness')
  if (!report) return <AnalyticsState loading={loading} error={error} onRetry={refresh} />
  const topics = [...report.topicAnalysis].sort((left, right) =>
    sortMode === 'rate'
      ? left.rate - right.rate || right.attempted - left.attempted
      : right.weakness - left.weakness || right.attempted - left.attempted,
  )
  const overallWeakness = topics.length
    ? Math.round(
        topics.reduce((total, topic) => total + topic.weakness * topic.attempted, 0) /
          topics.reduce((total, topic) => total + topic.attempted, 0),
      )
    : 0
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Performance diagnosis"
        title="Weakness report"
        description="Topics ranked by friction, recency, and conversion rate."
        action={<Badge tone="amber">Overall score · {overallWeakness} / 100</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {topics.slice(0, 10).map((x) => (
          <WeaknessCard
            key={x.topic}
            item={{
              ...x,
              lastLabel: formatReadableDate(x.last),
              lastTitle: formatFullDate(x.last),
            }}
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <ChartCard title="Weakness score by topic" subtitle="Composite score from 0–100">
          <BarChartView
            data={topics.slice(0, 10)}
            dataKey="weakness"
            nameKey="short"
            color="#fb7185"
          />
        </ChartCard>
        <Card className="p-6">
          <div className="flex gap-3">
            <Info className="shrink-0 text-cyan-300" size={20} />
            <div>
              <h3 className="font-semibold">How the score works</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Weakness score combines verdict frequency, failed attempts, solved ratio, problem
                difficulty, recency, and unsolved attempted problems.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              ['Solve conversion', 35],
              ['Retry pressure', 20],
              ['Unsolved problems', 25],
              ['Verdict pattern', 10],
              ['Recency', 10],
            ].map(([x, v]) => (
              <div key={x}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-500">{x}</span>
                  <span>{v}%</span>
                </div>
                <Progress value={v * 2} />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <div className="p-5">
          <SectionHeader
            title="Topic detail"
            description="Sort and compare the signals behind each score"
            action={
              <Select
                aria-label="Sort topic details"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
              >
                <option value="weakness">Sort: Weakest first</option>
                <option value="rate">Lowest AC rate</option>
              </Select>
            }
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-y border-white/[.06] text-xs text-slate-500">
                {[
                  'Topic',
                  'Attempted',
                  'Solved',
                  'Failed attempts',
                  'AC rate',
                  'Weakness',
                  'Last practiced',
                ].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topics.map((x) => (
                <tr key={x.topic} className="border-b border-white/[.04] last:border-0">
                  <td className="max-w-56 px-5 py-4 font-medium">
                    <ClampedText as="span" lines={1} className="block">
                      {x.topic}
                    </ClampedText>
                  </td>
                  <td className="px-5 text-slate-400">{x.attempted}</td>
                  <td className="px-5 text-slate-400">{x.solved}</td>
                  <td className="px-5 text-slate-400">{x.failed}</td>
                  <td className="px-5">
                    <span className={x.rate < 55 ? 'text-rose-300' : 'text-slate-300'}>
                      {x.rate}%
                    </span>
                  </td>
                  <td className="px-5">
                    <Badge tone={x.weakness > 70 ? 'red' : x.weakness > 50 ? 'amber' : 'green'}>
                      {x.weakness}
                    </Badge>
                  </td>
                  <td className="px-5 text-slate-500" title={formatFullDate(x.last)}>
                    <span className="whitespace-nowrap">{formatReadableDate(x.last)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function RatingAnalysisPage() {
  const { report, loading, error, refresh } = useAnalytics()
  if (!report) return <AnalyticsState loading={loading} error={error} onRetry={refresh} />
  const buckets = report.ratingAnalysis
  const gap = buckets
    .filter((bucket) => bucket.attempted > 0)
    .sort((left, right) => right.weakness - left.weakness)[0]
  const ratingProgress = report.summary.ratingHistory.slice(-20).map((change) => ({
    month: new Date(change.changedAt).toLocaleDateString(undefined, {
      month: 'short',
      year: '2-digit',
    }),
    rating: change.newRating,
  }))
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Difficulty curve"
        title="Rating analysis"
        description="Find the exact rating band where confidence turns into friction."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {buckets.map((x) => (
          <Card key={x.key} className={`p-5 ${gap?.key === x.key ? 'border-amber-400/20' : ''}`}>
            <div className="flex justify-between">
              <RatingBadge>{x.bucket}</RatingBadge>
              {gap?.key === x.key && <Badge tone="amber">Gap</Badge>}
            </div>
            <p className="mt-5 text-3xl font-semibold">{x.rate}%</p>
            <p className="text-xs text-slate-600">success rate</p>
            <Progress value={x.rate} className="my-4" />
            <div className="flex justify-between text-xs text-slate-500">
              <span>
                {x.solved}/{x.attempted} solved
              </span>
              <span>{x.avg} attempts</span>
            </div>
            {x.weakTags.length > 0 && (
              <ClampedText lines={2} className="mt-3 text-xs leading-5 text-slate-600">
                {`Weak tags · ${x.weakTags.map((tag) => tag.tag).join(', ')}`}
              </ClampedText>
            )}
          </Card>
        ))}
      </div>
      <InsightBanner icon={Target}>
        {gap ? (
          <>
            Your highest-friction range is <strong className="text-white">{gap.bucket}</strong>,
            with a {gap.rate}% conversion rate and weakness score of {gap.weakness}/100.
          </>
        ) : (
          'Complete more rated problems to identify a reliable rating gap.'
        )}
      </InsightBanner>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Success rate by rating bucket"
          subtitle="Exact conversion shown above each discrete rating band"
          chartClassName="h-72"
        >
          <BarChartView
            data={buckets}
            showValues
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
          />
        </ChartCard>
        <ChartCard
          title="Rating progress over time"
          subtitle={`Current ${report.profile.rating ?? 'Unrated'} · Peak ${report.profile.maxRating ?? 'Unrated'}`}
        >
          <TrendChart data={ratingProgress} />
        </ChartCard>
      </div>
    </div>
  )
}

export function VerdictAnalysisPage() {
  const { report, loading, error, refresh } = useAnalytics()
  if (!report) return <AnalyticsState loading={loading} error={error} onRetry={refresh} />
  const verdicts = report.verdictAnalysis
  const total = verdicts.totalSubmissions
  const waTags = verdicts.wrongAnswerHeavyTags.map((item) => item.tag)
  const tleTags = verdicts.timeLimitHeavyTags.map((item) => item.tag)
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Failure patterns"
        title="Verdict analysis"
        description="Understand why submissions fail—not just how often."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Most common failure"
          value={verdicts.mostCommonFailedVerdict?.name || 'None'}
          icon={XCircle}
          caption={
            verdicts.mostCommonFailedVerdict
              ? `${verdicts.mostCommonFailedVerdict.percentage}% of submissions`
              : 'No failed submissions'
          }
        />
        <StatCard
          label="Failed attempts before AC"
          value={verdicts.averageFailedAttemptsBeforeAc}
          icon={RefreshCw}
          caption="Average per solved problem"
        />
        <StatCard
          label="TLE-heavy topics"
          value={tleTags.slice(0, 2).join(' · ') || 'None'}
          icon={Clock3}
          caption={`${verdicts.timeLimitHeavyTags[0]?.count || 0} top-topic TLEs`}
        />
        <StatCard
          label="WA-heavy topics"
          value={waTags.slice(0, 2).join(' · ') || 'None'}
          icon={AlertTriangle}
          caption={`${verdicts.wrongAnswerHeavyTags[0]?.count || 0} top-topic WAs`}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <ChartCard title="Verdict distribution" subtitle={`${total} total submissions`}>
          <DonutChart data={verdicts.distribution} />
        </ChartCard>
        <Card>
          <div className="p-5">
            <h3 className="font-semibold">Verdict breakdown</h3>
            <p className="mt-1 text-xs text-slate-500">Primary topic affected by each verdict</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-y border-white/[.06] text-xs text-slate-500">
                  <th className="px-5 py-3">Verdict</th>
                  <th className="px-5">Count</th>
                  <th className="px-5">Percentage</th>
                  <th className="px-5">Most affected</th>
                </tr>
              </thead>
              <tbody>
                {verdicts.distribution.map((v) => (
                  <tr key={v.key} className="border-b border-white/[.04] last:border-0">
                    <td className="px-5 py-4">
                      <VerdictBadge>{v.name}</VerdictBadge>
                    </td>
                    <td className="px-5 font-mono">{v.value}</td>
                    <td className="px-5 text-slate-400">{v.percentage}%</td>
                    <td className="px-5 text-slate-400">
                      {v.key === 'WRONG_ANSWER'
                        ? waTags[0] || '—'
                        : v.key === 'TIME_LIMIT_EXCEEDED'
                          ? tleTags[0] || '—'
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <InsightBanner icon={Clock3}>
        {verdicts.firstTrySolvedProblems} problems were solved on the first try, while{' '}
        <strong className="text-white">{verdicts.multiAttemptSolvedProblems}</strong> required
        multiple attempts. Review the most painful failures before the next timed set.
      </InsightBanner>
    </div>
  )
}
