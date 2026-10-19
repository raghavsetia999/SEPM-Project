import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CodeXml,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Zap,
} from 'lucide-react'
import {
  AIResponseCard,
  BarChartView,
  ChartCard,
  DonutChart,
  InsightBanner,
  ProblemTable,
  RatingBadge,
  SectionHeader,
  StatCard,
  TopicBadge,
  TrendChart,
} from '../components/AppComponents'
import {
  Avatar,
  Badge,
  Button,
  Card,
  ClampedText,
  Input,
  Label,
  Progress,
  Select,
  Switch,
} from '../components/ui'
import { useAnalytics } from '../context/AnalyticsContext'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../services/apiClient'
import { progressApi } from '../services/progressApi'
import { reportApi } from '../services/reportApi'
import { userApi } from '../services/userApi'

function DataState({ loading, error, onRetry }) {
  if (loading) {
    return <Card className="p-8 text-center text-sm text-slate-500">Loading live analytics…</Card>
  }
  return (
    <Card className="border-rose-400/20 bg-rose-400/[.04] p-6">
      <p className="text-sm text-rose-200">{error || 'No data is available yet.'}</p>
      {onRetry && (
        <Button
          className="mt-4"
          size="sm"
          onClick={async () => {
            const toastId = toast.loading('Retrying...')
            const result = await onRetry()
            if (result) toast.success('Data loaded', { id: toastId })
            else toast.error('Data is still unavailable', { id: toastId })
          }}
        >
          Retry
        </Button>
      )}
    </Card>
  )
}

function displayVerdict(verdict) {
  return (
    {
      WRONG_ANSWER: 'Wrong answer',
      TIME_LIMIT_EXCEEDED: 'Time limit',
      RUNTIME_ERROR: 'Runtime error',
      COMPILATION_ERROR: 'Compilation error',
      MEMORY_LIMIT_EXCEEDED: 'Memory limit',
    }[verdict] || String(verdict || 'Unknown').replaceAll('_', ' ')
  )
}

const defaultProblemFilters = { topic: 'all', rating: 'all', verdict: 'all', priority: 'all' }

function ratingMatches(rating, range) {
  if (range === 'all') return true
  if (range === 'unrated') return rating == null
  if (rating == null) return false
  if (range === 'under-1200') return rating < 1200
  if (range === '1800-plus') return rating >= 1800
  const [minimum, maximum] = range.split('-').map(Number)
  return rating >= minimum && rating < maximum
}

function filterProblems(problems, filters) {
  return problems.filter((problem) => {
    const topicMatches =
      filters.topic === 'all' ||
      (problem.tags || []).some((tag) => tag.toLowerCase() === filters.topic.toLowerCase())
    const verdictMatches =
      filters.verdict === 'all' || String(problem.verdict || '') === filters.verdict
    const priorityMatches =
      filters.priority === 'all' ||
      String(problem.priorityLevel || problem.priority || '') === filters.priority
    return (
      topicMatches &&
      ratingMatches(problem.rating, filters.rating) &&
      verdictMatches &&
      priorityMatches
    )
  })
}

function ProblemFilters({
  problems,
  filters,
  onChange,
  showVerdict = false,
  showPriority = false,
}) {
  const topics = [...new Set(problems.flatMap((problem) => problem.tags || []))].sort((a, b) =>
    a.localeCompare(b),
  )
  const verdicts = [...new Set(problems.map((problem) => problem.verdict).filter(Boolean))].sort()
  const priorities = [
    ...new Set(
      problems.map((problem) => problem.priorityLevel || problem.priority).filter(Boolean),
    ),
  ]
  const update = (key) => (event) => onChange({ ...filters, [key]: event.target.value })

  return (
    <div className="flex max-w-full flex-wrap gap-2">
      <Select aria-label="Filter by topic" value={filters.topic} onChange={update('topic')}>
        <option value="all">All topics</option>
        {topics.map((topic) => (
          <option key={topic} value={topic}>
            {topic}
          </option>
        ))}
      </Select>
      <Select aria-label="Filter by rating" value={filters.rating} onChange={update('rating')}>
        <option value="all">All ratings</option>
        <option value="unrated">Unrated</option>
        <option value="under-1200">Below 1200</option>
        <option value="1200-1400">1200–1399</option>
        <option value="1400-1600">1400–1599</option>
        <option value="1600-1800">1600–1799</option>
        <option value="1800-plus">1800+</option>
      </Select>
      {showVerdict && (
        <Select aria-label="Filter by verdict" value={filters.verdict} onChange={update('verdict')}>
          <option value="all">All verdicts</option>
          {verdicts.map((verdict) => (
            <option key={verdict} value={verdict}>
              {verdict}
            </option>
          ))}
        </Select>
      )}
      {showPriority && (
        <Select
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={update('priority')}
        >
          <option value="all">All priorities</option>
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority} priority
            </option>
          ))}
        </Select>
      )}
    </div>
  )
}
export function UpsolvingPage() {
  const { report, loading, error, refresh } = useAnalytics()
  const [filters, setFilters] = useState(defaultProblemFilters)
  if (!report) return <DataState loading={loading} error={error} onRetry={refresh} />
  const queue = report.upsolvingAnalysis.map((problem) => ({
    ...problem,
    verdict: displayVerdict(problem.lastVerdict),
  }))
  const filteredQueue = filterProblems(queue, filters)
  const highPriority = queue.filter((problem) => problem.priorityLevel === 'High').length
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Turn failures into reps"
        title="Upsolving queue"
        description="Unsolved contest attempts ranked by learning value and urgency."
        action={
          <Button
            onClick={async () => {
              const toastId = toast.loading('Refreshing upsolving queue...')
              const result = await refresh(undefined, { refresh: true })
              if (result) toast.success('Upsolving queue refreshed', { id: toastId })
              else toast.error('Could not refresh the queue', { id: toastId })
            }}
          >
            <RefreshCw size={15} /> Refresh queue
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Waiting to upsolve"
          value={queue.length}
          icon={Target}
          caption={`${highPriority} high priority`}
        />
        <StatCard
          label="Repeated failures"
          value={queue.filter((problem) => problem.attempts >= 3).length}
          icon={RefreshCw}
          caption="Three or more attempts"
        />
        <StatCard
          label="Top priority score"
          value={queue[0]?.priorityScore || 0}
          icon={Clock3}
          caption="Out of 100"
        />
      </div>
      <Card>
        <div className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-semibold">Unsolved attempted problems</h3>
            <p className="mt-1 text-xs text-slate-500">
              Problems you submitted during a contest but never solved
            </p>
          </div>
          <ProblemFilters
            problems={queue}
            filters={filters}
            onChange={setFilters}
            showVerdict
            showPriority
          />
        </div>
        <ProblemTable problems={filteredQueue} />
        {!filteredQueue.length && (
          <p className="border-t border-white/[.06] p-6 text-center text-sm text-slate-500">
            No upsolving problems match these filters.
          </p>
        )}
      </Card>
      <Card className="p-6">
        <SectionHeader
          title="Recommended upsolving order"
          description="An efficient sequence based on dependencies and expected learning gain"
        />
        <div className="grid gap-3 lg:grid-cols-3">
          {filteredQueue.slice(0, 3).map((p, i) => (
            <div
              key={p.contest}
              className="flex gap-4 rounded-xl border border-white/[.06] bg-black/15 p-4"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-400/10 font-mono text-cyan-300">
                0{i + 1}
              </span>
              <div className="min-w-0">
                <ClampedText lines={1} className="text-sm font-medium">
                  {p.name}
                </ClampedText>
                <ClampedText lines={1} className="mt-1 text-xs text-slate-600">
                  {`${p.contest} · ${p.rating ?? 'Unrated'}`}
                </ClampedText>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function ProgressPage() {
  const { user: account } = useAuth()
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('6m')

  const visiblePoints = useMemo(() => {
    const points = progress?.points || []
    if (dateRange === 'all' || !points.length) return points
    const latestTimestamp = Math.max(
      ...points.map((point) => new Date(point.generatedAt).getTime()).filter(Number.isFinite),
    )
    const cutoff = new Date(latestTimestamp)
    cutoff.setMonth(cutoff.getMonth() - (dateRange === '6m' ? 6 : 12))
    return points.filter((point) => new Date(point.generatedAt) >= cutoff)
  }, [dateRange, progress])

  const visibleTopicImprovement = useMemo(() => {
    if (visiblePoints.length < 2) return []
    const firstTopics = visiblePoints[0].topics || {}
    const latestTopics = visiblePoints.at(-1).topics || {}
    return Object.keys(latestTopics)
      .filter((topic) => firstTopics[topic] != null)
      .map((topic) => ({
        topic,
        improvement: firstTopics[topic] - latestTopics[topic],
      }))
      .sort((left, right) => right.improvement - left.improvement)
  }, [visiblePoints])

  async function loadProgress() {
    if (!account?.codeforcesHandle) {
      setError('Add a Codeforces handle before viewing progress.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const nextProgress = await progressApi.get(account.codeforcesHandle)
      setProgress(nextProgress)
      return nextProgress
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProgress()
    // Reload when the tracked handle changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.codeforcesHandle])

  if (!progress) return <DataState loading={loading} error={error} onRetry={loadProgress} />

  if (!progress.hasEnoughData) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Momentum over time"
          title="Progress tracking"
          description="Save at least two reports to compare real performance snapshots."
        />
        <Card className="p-8 text-center">
          <p className="text-3xl font-semibold text-cyan-300">{progress.reportCount}</p>
          <p className="mt-2 text-sm text-slate-500">saved report snapshots available</p>
        </Card>
      </div>
    )
  }

  const first = visiblePoints[0]
  const latest = visiblePoints.at(-1)
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Momentum over time"
        title="Progress tracking"
        description="The trends that matter after the contest ends."
        action={
          <Select
            aria-label="Filter progress by date range"
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
          >
            <option value="6m">Last 6 months</option>
            <option value="12m">Last year</option>
            <option value="all">All time</option>
          </Select>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Solved problems" value={latest.solved} icon={CheckCircle2} />
        <StatCard
          label="Solved improvement"
          value={`+${latest.solved - first.solved}`}
          icon={Target}
        />
        <StatCard
          label="Rating change"
          value={`${(latest.rating || 0) - (first.rating || 0) >= 0 ? '+' : ''}${(latest.rating || 0) - (first.rating || 0)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Weakness change"
          value={latest.weakness - first.weakness}
          icon={TrendingDown}
          caption="Lower is better"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Solved count trend" subtitle="Saved report snapshots">
          <TrendChart data={visiblePoints} dataKey="solved" />
        </ChartCard>
        <ChartCard title="Rating progression" subtitle="Saved report snapshots">
          <TrendChart data={visiblePoints} dataKey="rating" />
        </ChartCard>
        <ChartCard title="Weakness score trend" subtitle="Lower is better">
          <TrendChart data={visiblePoints} dataKey="weakness" />
        </ChartCard>
        <Card className="p-6">
          <SectionHeader
            title="Topic improvement"
            description="Positive means weakness decreased"
          />
          <div className="space-y-3">
            {visibleTopicImprovement.slice(0, 6).map((topic) => (
              <div
                key={topic.topic}
                className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-black/20 p-3"
              >
                <ClampedText as="span" lines={1} className="min-w-0 text-sm">
                  {topic.topic}
                </ClampedText>
                <Badge tone={topic.improvement > 0 ? 'green' : 'amber'}>
                  {topic.improvement > 0 ? '+' : ''}
                  {topic.improvement}
                </Badge>
              </div>
            ))}
            {!visibleTopicImprovement.length && (
              <p className="rounded-xl bg-black/20 p-4 text-sm text-slate-500">
                Save at least two reports in this date range to compare topic improvement.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
export function ProfilePage() {
  const { user: account, updateUser } = useAuth()
  const { report } = useAnalytics()
  const [reports, setReports] = useState([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    reportApi
      .list()
      .then(setReports)
      .catch(() => setReports([]))
  }, [])

  async function saveProfile(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    try {
      const nextUser = await userApi.updateProfile({
        name: form.get('name'),
        targetRating: Number(form.get('targetRating')),
        preferredPracticeMinutes: Number(form.get('preferredPracticeMinutes')),
      })
      updateUser(nextUser)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const profile = report?.profile
  const initials = account?.name
    ?.split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const memberSince = account?.createdAt
    ? new Date(account.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'Unknown'

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Account"
        title="Profile"
        description="Your competitive programming identity and account history."
        action={
          <Button variant="secondary" onClick={() => setEditing((value) => !value)}>
            <User size={15} /> Edit profile
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-cyan-400/20 via-violet-500/15 to-transparent" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="flex items-end gap-4">
              <Avatar
                initials={initials}
                className="h-20 w-20 rounded-2xl border-4 border-[#0e131d] text-xl"
              />
              <div className="pb-1">
                <h2 className="break-words text-xl font-semibold">{account?.name}</h2>
                <p className="text-sm text-slate-500">
                  @{account?.codeforcesHandle || 'No handle connected'}
                </p>
              </div>
            </div>
            <Badge tone={account?.codeforcesHandle ? 'green' : 'amber'}>
              {account?.codeforcesHandle ? '● Codeforces connected' : 'Codeforces not connected'}
            </Badge>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['Email', account?.email],
              ['Current rating', profile?.rating ?? 'Unrated'],
              ['Target rating', account?.targetRating],
              ['Practice time', `${account?.preferredPracticeMinutes || 60} min / day`],
              ['Member since', memberSince],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-black/20 p-4">
                <p className="text-xs text-slate-600">{l}</p>
                <p className="mt-1 text-sm font-medium">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
      {editing && (
        <Card className="p-6">
          <SectionHeader title="Edit profile" description="Changes are saved to your account." />
          <form className="grid gap-5 sm:grid-cols-3" onSubmit={saveProfile}>
            <SettingField label="Full name" name="name" value={account?.name || ''} />
            <SettingField
              label="Target rating"
              name="targetRating"
              value={account?.targetRating || 1600}
              type="number"
            />
            <div>
              <Label>Daily practice time</Label>
              <Select
                name="preferredPracticeMinutes"
                defaultValue={String(account?.preferredPracticeMinutes || 60)}
                className="w-full"
              >
                {[30, 60, 90, 120].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-3 sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
              </Button>
              {error && <p className="text-sm text-rose-300">{error}</p>}
            </div>
          </form>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <SectionHeader title="Connected accounts" />
          <div className="space-y-3">
            <Connected
              icon={Zap}
              name="Codeforces"
              value={account?.codeforcesHandle || 'Not connected'}
              active={Boolean(account?.codeforcesHandle)}
            />
            <Connected icon={CodeXml} name="GitHub" value="Not connected" />
          </div>
        </Card>
        <Card className="p-6">
          <SectionHeader
            title="Recent reports"
            action={
              <Link to="/progress">
                <Button size="sm" variant="ghost">
                  View progress
                </Button>
              </Link>
            }
          />
          <div className="space-y-2">
            {reports.slice(0, 3).map((savedReport) => (
              <Link
                to={`/report/${savedReport._id || savedReport.id}`}
                key={savedReport._id || savedReport.id}
                className="flex items-center justify-between rounded-xl p-3 hover:bg-white/[.03]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={17} className="text-slate-600" />
                  <div className="min-w-0">
                    <ClampedText lines={1} className="text-sm">
                      {`Analysis for ${savedReport.handle}`}
                    </ClampedText>
                    <p className="text-xs text-slate-600">
                      {new Date(savedReport.generatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {savedReport.reportType === 'weekly' && <Badge tone="violet">Weekly</Badge>}
                <ChevronRight size={15} className="text-slate-700" />
              </Link>
            ))}
            {!reports.length && <p className="text-sm text-slate-500">No saved reports yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
function Connected({ icon: Icon, name, value, active }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[.06] p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.04]">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{name}</p>
          <p className="break-words text-xs text-slate-600">{value}</p>
        </div>
      </div>
      {active ? (
        <Link to="/settings">
          <Button variant="ghost" size="sm">
            Manage
          </Button>
        </Link>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            toast('GitHub connection is planned for a later milestone.', { icon: 'ℹ️' })
          }
        >
          Coming later
        </Button>
      )}
    </div>
  )
}

const settingsTabs = ['Account', 'Codeforces', 'Notifications', 'Data Refresh']
export function SettingsPage() {
  const { user: account, updateUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const [tab, setTab] = useState(settingsTabs.includes(requestedTab) ? requestedTab : 'Account')
  const [preferences, setPreferences] = useState(account?.preferences || {})
  const [saving, setSaving] = useState(false)
  const [generatingWeekly, setGeneratingWeekly] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => setPreferences(account?.preferences || {}), [account?.preferences])
  useEffect(() => {
    if (settingsTabs.includes(requestedTab)) setTab(requestedTab)
  }, [requestedTab])

  function selectTab(nextTab) {
    setTab(nextTab)
    setSearchParams({ tab: nextTab })
  }

  async function saveAccount(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setMessage('')
    try {
      const nextUser = await userApi.updateProfile({
        name: form.get('name'),
        targetRating: Number(form.get('targetRating')),
        preferredPracticeMinutes: Number(form.get('preferredPracticeMinutes')),
      })
      updateUser(nextUser)
      setMessage('Account settings saved.')
      toast.success('Account settings saved')
    } catch (requestError) {
      const errorMessage = getApiErrorMessage(requestError)
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  async function savePreferences() {
    setSaving(true)
    setMessage('')
    try {
      const nextUser = await userApi.updatePreferences(preferences)
      updateUser(nextUser)
      setMessage('Preferences saved.')
      toast.success('Preferences saved')
    } catch (requestError) {
      const errorMessage = getApiErrorMessage(requestError)
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  async function saveCodeforces(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setMessage('')
    try {
      let nextUser = account
      const handle = String(form.get('codeforcesHandle')).trim()
      if (handle !== account.codeforcesHandle) nextUser = await userApi.updateHandle(handle)
      nextUser = await userApi.updatePreferences({
        includeGymSubmissions: Boolean(preferences.includeGymSubmissions),
      })
      updateUser(nextUser)
      setMessage('Codeforces settings saved.')
      toast.success('Codeforces settings saved')
    } catch (requestError) {
      const errorMessage = getApiErrorMessage(requestError)
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  async function getWeeklyReport() {
    setGeneratingWeekly(true)
    setMessage('')
    const toastId = toast.loading('Preparing your weekly report...')
    try {
      const nextUser = await userApi.updatePreferences(preferences)
      updateUser(nextUser)
      const result = await reportApi.ensureWeekly()
      const reportId = result.report?.id || result.report?._id
      toast.success(result.generated ? 'Weekly report generated' : 'Latest weekly report opened', {
        id: toastId,
      })
      if (reportId) navigate(`/report/${reportId}`)
    } catch (requestError) {
      const errorMessage = getApiErrorMessage(requestError)
      setMessage(errorMessage)
      toast.error(errorMessage, { id: toastId })
    } finally {
      setGeneratingWeekly(false)
    }
  }

  function togglePreference(key) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Preferences"
        title="Settings"
        description="Tune CP Pulse to match the way you practice."
      />
      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        <Card className="h-fit p-2">
          {settingsTabs.map((x) => (
            <button
              key={x}
              onClick={() => selectTab(x)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${tab === x ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-500 hover:bg-white/[.035]'}`}
            >
              {x}
            </button>
          ))}
        </Card>
        <div className="space-y-4">
          <Card className="p-6">
            <SectionHeader
              title={`${tab} settings`}
              description={
                tab === 'Account'
                  ? 'Manage your core identity and security.'
                  : 'Choose how this part of your workspace behaves.'
              }
            />
            {tab === 'Account' ? (
              <form className="grid gap-5 sm:grid-cols-2" onSubmit={saveAccount}>
                <SettingField label="Full name" name="name" value={account?.name || ''} />
                <SettingField
                  label="Email address"
                  name="email"
                  value={account?.email || ''}
                  readOnly
                />
                <SettingField
                  label="Target rating"
                  name="targetRating"
                  value={account?.targetRating || 1600}
                  type="number"
                />
                <div>
                  <Label>Daily practice time</Label>
                  <Select
                    className="w-full"
                    name="preferredPracticeMinutes"
                    defaultValue={String(account?.preferredPracticeMinutes || 60)}
                  >
                    {[30, 60, 90, 120].map((minutes) => (
                      <option value={minutes} key={minutes}>
                        {minutes} minutes
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    Save changes
                  </Button>
                </div>
              </form>
            ) : tab === 'Codeforces' ? (
              <form className="space-y-5" onSubmit={saveCodeforces}>
                <SettingField
                  label="Codeforces handle"
                  name="codeforcesHandle"
                  value={account?.codeforcesHandle || ''}
                />
                <PreferenceToggle
                  title="Include gym submissions"
                  description="Use gym contests in performance analysis."
                  active={Boolean(preferences.includeGymSubmissions)}
                  onToggle={() => togglePreference('includeGymSubmissions')}
                />
                <Button type="submit" disabled={saving}>
                  Save Codeforces settings
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                {getSettings(tab).map(([key, title, description]) => (
                  <PreferenceToggle
                    key={key}
                    title={title}
                    description={description}
                    active={Boolean(preferences[key])}
                    onToggle={() => togglePreference(key)}
                  />
                ))}
                {tab === 'Notifications' && preferences.weeklyReport && (
                  <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[.04] p-4">
                    <p className="text-sm font-medium text-cyan-200">Weekly report delivery</p>
                    <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                      A fresh snapshot is generated on your next signed-in visit after seven days.
                      You can also open the current weekly report now.
                    </p>
                    <Button
                      className="mt-3"
                      size="sm"
                      onClick={getWeeklyReport}
                      disabled={generatingWeekly}
                    >
                      <FileText size={14} />
                      {generatingWeekly ? 'Preparing...' : 'Get weekly report'}
                    </Button>
                  </div>
                )}
                <Button className="mt-3" onClick={savePreferences} disabled={saving}>
                  Save preferences
                </Button>
              </div>
            )}
            {message && <p className="mt-4 text-sm text-slate-400">{message}</p>}
          </Card>
          {tab === 'Account' && (
            <Card className="border-rose-500/20 p-6">
              <h3 className="font-semibold text-rose-300">Danger zone</h3>
              <p className="mt-2 text-sm text-slate-500">
                Permanently delete your account and all generated reports.
              </p>
              <Button
                variant="danger"
                className="mt-5"
                onClick={() =>
                  toast('Account deletion is not enabled until the recovery flow is implemented.', {
                    icon: 'ℹ️',
                  })
                }
              >
                <Trash2 size={15} /> Delete account
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
function SettingField({ label, value, type = 'text', name, readOnly = false }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input defaultValue={value} type={type} name={name} readOnly={readOnly} />
    </div>
  )
}
function getSettings(tab) {
  const map = {
    Notifications: [
      [
        'weeklyReport',
        'Weekly performance report',
        'Generate a downloadable progress snapshot every seven days when you use CP Pulse.',
      ],
      ['streakReminders', 'Streak reminders', 'Get notified before a streak expires.'],
      ['contestReminders', 'Contest reminder', 'Remind me about upcoming Codeforces rounds.'],
    ],
    'Data Refresh': [
      [
        'automaticRefresh',
        'Automatic refresh',
        'Refresh analytics when your workspace loads after the cache expires.',
      ],
    ],
  }
  return map[tab] || []
}

function PreferenceToggle({ title, description, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-5 rounded-xl border border-white/[.06] p-4 text-left"
    >
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-xs text-slate-600">{description}</span>
      </span>
      <Switch active={active} />
    </button>
  )
}

export function ReportDetailsPage() {
  const { id } = useParams()
  const { user: account } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  async function loadReport() {
    setLoading(true)
    setError('')
    try {
      const nextReport =
        id === 'latest' ? await reportApi.latest(account.codeforcesHandle) : await reportApi.get(id)
      setReport(nextReport)
      return nextReport
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
    // Report identity is controlled by the route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, account?.codeforcesHandle])

  async function exportPdf() {
    const reportId = report?._id || report?.id || id
    if (!reportId || reportId === 'latest') return
    setExporting(true)
    setError('')
    const toastId = toast.loading('Preparing PDF report...')
    try {
      const blob = await reportApi.exportPdf(reportId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `cp-performance-${report.handle}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success('PDF report downloaded', { id: toastId })
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      toast.error(message, { id: toastId })
    } finally {
      setExporting(false)
    }
  }

  if (!report) return <DataState loading={loading} error={error} onRetry={loadReport} />

  const topics = report.topicAnalysis || []
  const weakness = topics.length
    ? Math.round(
        topics.reduce((total, topic) => total + topic.weakness * topic.attempted, 0) /
          topics.reduce((total, topic) => total + topic.attempted, 0),
      )
    : 0
  const ratingProgress = (report.summary.ratingHistory || []).slice(-12).map((change) => ({
    month: new Date(change.changedAt).toLocaleDateString(undefined, { month: 'short' }),
    rating: change.newRating,
  }))
  const queue = (report.upsolvingProblems || []).map((problem) => ({
    ...problem,
    verdict: displayVerdict(problem.lastVerdict),
  }))
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`Generated ${new Date(report.generatedAt).toLocaleString()}`}
        title={
          report.reportType === 'weekly' ? 'Weekly performance report' : 'Full performance report'
        }
        description={`A saved snapshot of ${report.handle} based on ${report.summary.totalSubmissions} submissions.`}
        action={
          <div className="flex gap-2">
            <Badge tone={report.reportType === 'weekly' ? 'violet' : 'green'}>
              {report.reportType === 'weekly' ? 'Weekly report' : 'Saved report'}
            </Badge>
            <Button onClick={exportPdf} disabled={exporting}>
              <Download size={15} /> {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        }
      />
      <InsightBanner>
        Use the verified analytics below to choose the next focused practice block.
      </InsightBanner>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Solved problems" value={report.summary.solvedProblems} icon={Trophy} />
        <StatCard label="Weakness score" value={`${weakness} / 100`} icon={TrendingDown} />
        <StatCard
          label="Current rating"
          value={report.profile.rating ?? 'Unrated'}
          icon={Activity}
        />
        <StatCard
          label="Target gap"
          value={Math.max((account.targetRating || 1600) - (report.profile.rating || 0), 0)}
          icon={Target}
          caption={`To ${account.targetRating || 1600}`}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Weak topic analysis">
          <BarChartView
            data={topics.slice(0, 10)}
            dataKey="weakness"
            nameKey="short"
            color="#fb7185"
          />
        </ChartCard>
        <ChartCard title="Rating gap analysis">
          <TrendChart data={ratingProgress} dataKey="rating" />
        </ChartCard>
        <ChartCard title="Verdict analysis">
          <DonutChart data={report.verdictAnalysis.distribution || []} />
        </ChartCard>
      </div>
      <Card>
        <div className="p-5">
          <SectionHeader
            title="Upsolving priority"
            description="Highest-learning-value unsolved attempts"
          />
        </div>
        <ProblemTable problems={queue.slice(0, 5)} />
      </Card>
    </div>
  )
}
