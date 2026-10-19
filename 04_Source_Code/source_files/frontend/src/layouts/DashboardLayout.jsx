import React, { useEffect, useRef, useState } from 'react'
import toast, { resolveValue, useToasterStore } from 'react-hot-toast'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  Check,
  ChevronLeft,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  User,
  X,
} from 'lucide-react'
import { Avatar, Button, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useAnalytics } from '../context/AnalyticsContext'
import { cn } from '../lib/utils'

const groups = [
  {
    label: 'Overview',
    links: [
      ['Dashboard', '/dashboard', LayoutDashboard],
      ['Analyze Handle', '/analyze', Search],
    ],
  },
  {
    label: 'Intelligence',
    links: [
      ['Weakness Report', '/weakness', BrainCircuit],
      ['Rating Analysis', '/rating-analysis', BarChart3],
      ['Verdict Analysis', '/verdict-analysis', Activity],
      ['Upsolving', '/upsolving', Target],
    ],
  },
  {
    label: 'Improve',
    links: [['Progress', '/progress', TrendingUp]],
  },
  {
    label: 'Account',
    links: [
      ['Profile', '/profile', User],
      ['Settings', '/settings', Settings],
    ],
  },
]
export function Brand({ compact = false, to = '/' }) {
  return (
    <NavLink to={to} className="flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-cyan-400 text-slate-950">
        <Gauge size={20} />
        <span className="absolute bottom-0 h-1 w-full bg-violet-500" />
      </span>
      {!compact && (
        <span className="text-[15px] font-bold tracking-tight">
          CP<span className="text-cyan-300">Pulse</span>
        </span>
      )}
    </NavLink>
  )
}

function readNotificationState(storageKey) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey))
    if (Array.isArray(stored?.items) && Array.isArray(stored?.dismissed)) return stored
  } catch {
    // Ignore invalid or older notification storage and start clean.
  }
  return { items: [], dismissed: [] }
}

function relativeTime(value) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Recently'
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (elapsedMinutes < 1) return 'Just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`
  const elapsedDays = Math.floor(elapsedHours / 24)
  return elapsedDays < 7
    ? `${elapsedDays}d ago`
    : new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function notificationEvents(report, error) {
  const events = []
  const snapshotId =
    report?.metadata?.latestSubmissionId || report?.generatedAt || report?.profile?.handle

  if (report?.profile?.handle && snapshotId) {
    const generatedAt = report.generatedAt || new Date().toISOString()
    events.push({
      id: `analysis:${report.profile.handle}:${snapshotId}`,
      title: 'Analytics snapshot ready',
      message: `${report.profile.handle}: ${report.summary.solvedProblems} solved problems and ${report.summary.acRate}% problem conversion.`,
      createdAt: generatedAt,
      href: '/dashboard',
      tone: 'cyan',
      read: false,
    })

    const upsolvingCount = report.upsolvingAnalysis?.length || 0
    if (upsolvingCount > 0) {
      const highPriorityCount = report.upsolvingAnalysis.filter(
        (problem) => problem.priorityLevel === 'High',
      ).length
      events.push({
        id: `upsolving:${report.profile.handle}:${snapshotId}:${upsolvingCount}`,
        title: `${upsolvingCount} problem${upsolvingCount === 1 ? '' : 's'} waiting to upsolve`,
        message: highPriorityCount
          ? `${highPriorityCount} high-priority problem${highPriorityCount === 1 ? '' : 's'} should be reviewed first.`
          : 'Open your queue to continue unfinished problems.',
        createdAt: generatedAt,
        href: '/upsolving',
        tone: 'amber',
        read: false,
      })
    }
  }

  if (error) {
    events.push({
      id: `analytics-error:${error}`,
      title: 'Analytics refresh needs attention',
      message: error,
      createdAt: new Date().toISOString(),
      href: '/dashboard',
      tone: 'rose',
      read: false,
    })
  }

  return events
}

function toastNotification(item, href) {
  const resolvedMessage = resolveValue(item.message, item)
  const message =
    typeof resolvedMessage === 'string' || typeof resolvedMessage === 'number'
      ? String(resolvedMessage)
      : 'A new application update is available.'
  const presentation = {
    error: { title: 'Action needed', tone: 'rose' },
    success: { title: 'Completed', tone: 'cyan' },
    blank: { title: 'Update', tone: 'amber' },
    custom: { title: 'Update', tone: 'amber' },
  }[item.type] || { title: 'Update', tone: 'cyan' }

  return {
    id: `toast:${item.createdAt}:${item.id}`,
    title: presentation.title,
    message,
    createdAt: new Date(item.createdAt).toISOString(),
    href,
    tone: presentation.tone,
    read: false,
    source: 'toast',
  }
}

function NotificationCenter({ user, report, error, navigate }) {
  const location = useLocation()
  const { toasts } = useToasterStore()
  const storageKey = `cp-pulse:notifications:${user?.id || 'anonymous'}`
  const [feed, setFeed] = useState(() => readNotificationState(storageKey))
  const capturedToastIds = useRef(
    new Set(feed.items.filter((item) => item.source === 'toast').map((item) => item.id)),
  )
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('recent')
  const containerRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(feed))
  }, [feed, storageKey])

  useEffect(() => {
    const events = notificationEvents(report, error)
    if (!events.length) return
    setFeed((current) => {
      const existingIds = new Set(current.items.map((item) => item.id))
      const dismissedIds = new Set(current.dismissed)
      const unseenEvents = events.filter(
        (event) => !existingIds.has(event.id) && !dismissedIds.has(event.id),
      )
      if (!unseenEvents.length) return current
      return { ...current, items: [...unseenEvents, ...current.items].slice(0, 25) }
    })
  }, [error, report])

  useEffect(() => {
    const href = `${location.pathname}${location.search}`
    const completedToasts = toasts
      .filter((item) => item.type !== 'loading' && item.notificationFeed !== false)
      .map((item) => toastNotification(item, href))
      .filter((item) => !capturedToastIds.current.has(item.id))

    if (!completedToasts.length) return
    completedToasts.forEach((item) => capturedToastIds.current.add(item.id))
    setFeed((current) => {
      const existingIds = new Set(current.items.map((item) => item.id))
      const dismissedIds = new Set(current.dismissed)
      const unseenToasts = completedToasts.filter(
        (item) => !existingIds.has(item.id) && !dismissedIds.has(item.id),
      )
      if (!unseenToasts.length) return current
      return { ...current, items: [...unseenToasts, ...current.items].slice(0, 25) }
    })
  }, [location.pathname, location.search, toasts])

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const unreadCount = feed.items.filter((item) => !item.read).length
  const visibleItems = (
    view === 'unseen' ? feed.items.filter((item) => !item.read) : feed.items
  ).slice(0, 10)

  function updateItem(id, update) {
    setFeed((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...update } : item)),
    }))
  }

  function openNotification(item) {
    updateItem(item.id, { read: true })
    setOpen(false)
    navigate(item.href)
  }

  function dismissNotification(id) {
    setFeed((current) => ({
      items: current.items.filter((item) => item.id !== id),
      dismissed: [...new Set([...current.dismissed, id])].slice(-100),
    }))
  }

  function clearAll() {
    setFeed((current) => ({
      items: [],
      dismissed: [
        ...new Set([...current.dismissed, ...current.items.map((item) => item.id)]),
      ].slice(-100),
    }))
    toast.success('Notifications cleared', { notificationFeed: false })
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        title="Notifications"
        className="relative"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unseen` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-cyan-400 px-1 font-mono text-[9px] font-bold text-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed left-3 right-3 top-[66px] z-50 overflow-hidden rounded-2xl border border-white/[.09] bg-[#0c111b]/[.98] shadow-2xl shadow-black/50 backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[390px]"
        >
          <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                {unreadCount
                  ? `${unreadCount} unseen update${unreadCount === 1 ? '' : 's'}`
                  : 'You are all caught up'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Mark all as read"
                  aria-label="Mark all notifications as read"
                  onClick={() =>
                    setFeed((current) => ({
                      ...current,
                      items: current.items.map((item) => ({ ...item, read: true })),
                    }))
                  }
                >
                  <Check size={15} />
                </Button>
              )}
              {feed.items.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Clear all notifications"
                  aria-label="Clear all notifications"
                  onClick={clearAll}
                >
                  <Trash2 size={15} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                title="Close notifications"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
              >
                <X size={15} />
              </Button>
            </div>
          </div>

          <div className="flex gap-1 border-b border-white/[.06] p-2">
            {[
              ['recent', `Recent (${feed.items.length})`],
              ['unseen', `Unseen (${unreadCount})`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs transition',
                  view === key
                    ? 'bg-cyan-400/10 text-cyan-300'
                    : 'text-slate-600 hover:bg-white/[.04] hover:text-slate-300',
                )}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className="ml-auto rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-white/[.04] hover:text-slate-300"
              onClick={() => {
                setOpen(false)
                navigate('/settings?tab=Notifications')
              }}
            >
              Settings
            </button>
          </div>

          <div className="max-h-[430px] overflow-y-auto p-2">
            {visibleItems.length ? (
              visibleItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'group mb-1 flex items-start gap-2 rounded-xl border p-2 transition',
                    item.read
                      ? 'border-transparent hover:bg-white/[.025]'
                      : 'border-cyan-400/10 bg-cyan-400/[.025]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openNotification(item)}
                    className="flex min-w-0 flex-1 items-start gap-3 p-1 text-left"
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        item.read
                          ? 'bg-slate-700'
                          : item.tone === 'rose'
                            ? 'bg-rose-400'
                            : item.tone === 'amber'
                              ? 'bg-amber-400'
                              : 'bg-cyan-400',
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-200">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                        {item.message}
                      </span>
                      <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-wider text-slate-700">
                        {relativeTime(item.createdAt)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissNotification(item.id)}
                    title="Dismiss notification"
                    aria-label={`Dismiss ${item.title}`}
                    className="rounded-lg p-1.5 text-slate-700 transition hover:bg-white/[.05] hover:text-slate-300"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center">
                <Bell size={25} className="mx-auto text-slate-700" />
                <p className="mt-3 text-sm font-medium text-slate-400">
                  {view === 'unseen' ? 'No unseen notifications' : 'No recent notifications'}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Analytics, practice alerts, and toast updates will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
function Sidebar({ open, setOpen, collapsed, setCollapsed }) {
  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden',
          open ? 'block' : 'hidden',
        )}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[.07] bg-[#0b0f18]/95 backdrop-blur-2xl transition-all lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[82px]' : 'w-[260px]',
        )}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-white/[.06] px-5">
          <Brand compact={collapsed} to="/dashboard" />
          <button onClick={() => setOpen(false)} className="text-slate-500 lg:hidden">
            <X />
          </button>
        </div>
        <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <div key={group.label} className="mb-5">
              <p
                className={cn(
                  'mb-2 px-3 font-mono text-[9px] uppercase tracking-[.2em] text-slate-700',
                  collapsed && 'text-center',
                )}
              >
                {collapsed ? '•••' : group.label}
              </p>
              {group.links.map(([label, to, Icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'mb-1 flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition',
                      isActive
                        ? 'bg-cyan-400/10 text-cyan-300'
                        : 'text-slate-500 hover:bg-white/[.045] hover:text-slate-200',
                      collapsed && 'justify-center',
                    )
                  }
                >
                  <Icon size={17} />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/[.06] p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-10 w-full items-center justify-center gap-2 rounded-xl text-slate-600 hover:bg-white/[.04] hover:text-slate-300 lg:flex"
          >
            <ChevronLeft size={17} className={cn('transition', collapsed && 'rotate-180')} />
            {!collapsed && <span className="text-xs">Collapse sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
function Topbar({ setOpen, collapsed, user, report, error, onLogout, onRefresh }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem('cp-pulse:high-contrast') === 'true',
  )
  const title =
    groups.flatMap((g) => g.links).find((l) => l[1] === location.pathname)?.[0] || 'Dashboard'
  const initials =
    user?.name
      ?.split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CP'

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast)
    localStorage.setItem('cp-pulse:high-contrast', String(highContrast))
  }, [highContrast])

  async function refreshData() {
    setRefreshing(true)
    const toastId = toast.loading('Refreshing Codeforces analytics...')
    const result = await onRefresh()
    setRefreshing(false)
    if (result) {
      toast.success(result.cache?.cached ? 'Cached analytics loaded' : 'Live analytics refreshed', {
        id: toastId,
      })
    } else {
      toast.error('Refresh failed. Existing cached data was preserved.', { id: toastId })
    }
  }

  async function logout() {
    try {
      await onLogout()
      toast.success('Logged out successfully')
    } catch {
      toast('Local session cleared. The server could not confirm logout.', { icon: 'ℹ️' })
    }
  }

  function submitSearch(event) {
    event.preventDefault()
    const handle = search.trim()
    if (!handle) {
      toast.error('Enter a Codeforces handle to analyze')
      return
    }
    toast.success(`Opening analysis for ${handle}`)
    navigate(`/analyze?handle=${encodeURIComponent(handle)}`)
    setSearch('')
  }

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-30 flex h-[72px] items-center justify-between border-b border-white/[.06] bg-ink/80 px-4 backdrop-blur-xl transition-all sm:px-6',
        collapsed ? 'lg:left-[82px]' : 'lg:left-[260px]',
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/[.05] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu />
        </button>
        <div>
          <p className="text-xs text-slate-600">Workspace</p>
          <h1 className="text-sm font-semibold sm:text-base">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <form className="relative hidden md:block" onSubmit={submitSearch}>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Analyze a handle..."
            className="h-10 w-56 pl-9"
            aria-label="Analyze Codeforces handle"
          />
        </form>
        <Button
          variant="ghost"
          size="icon"
          title="Refresh data"
          onClick={refreshData}
          disabled={refreshing}
        >
          <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
        </Button>
        <NotificationCenter {...{ user, report, error, navigate }} />
        <Button
          variant="ghost"
          size="icon"
          title="Toggle contrast"
          onClick={() => {
            setHighContrast((value) => !value)
            toast.success(highContrast ? 'Standard theme enabled' : 'High-contrast theme enabled')
          }}
        >
          {highContrast ? <Sun size={17} /> : <Moon size={17} />}
        </Button>
        <Avatar initials={initials} className="ml-1 h-9 w-9 text-xs" />
        <Button variant="ghost" size="icon" title="Log out" onClick={logout}>
          <LogOut size={17} />
        </Button>
      </div>
    </header>
  )
}
export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { report, error, refresh } = useAnalytics()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="min-h-screen bg-ink">
      <Sidebar {...{ open, setOpen, collapsed, setCollapsed }} />
      <Topbar
        setOpen={setOpen}
        collapsed={collapsed}
        user={user}
        report={report}
        error={error}
        onLogout={logout}
        onRefresh={() => refresh(undefined, { refresh: true })}
      />
      <main
        className={cn(
          'min-h-screen pt-[72px] transition-all',
          collapsed ? 'lg:pl-[82px]' : 'lg:pl-[260px]',
        )}
      >
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {report && error && (
            <div className="mb-5 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[.06] p-4 text-sm text-amber-100">
              <AlertTriangle size={18} className="shrink-0 text-amber-300" />
              <span>{error}</span>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
