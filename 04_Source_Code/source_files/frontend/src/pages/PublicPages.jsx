import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Braces,
  Check,
  ChevronRight,
  CodeXml,
  LineChart,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  WandSparkles,
  Zap,
} from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'
import { Badge, Button, Card, Input, Label, Progress, Select } from '../components/ui'
import { BarChartView, InsightBanner } from '../components/AppComponents'
import { useAuth } from '../context/AuthContext'
import { ratingData, topicData } from '../data/mockData'
import { analyticsApi } from '../services/analyticsApi'
import { getApiErrorMessage } from '../services/apiClient'
import { authApi } from '../services/authApi'
import { userApi } from '../services/userApi'

const features = [
  [Target, 'Weak Topic Detection', 'Pinpoint the exact concepts costing you accepted submissions.'],
  [BarChart3, 'Rating Gap Analysis', 'See where your solve rate drops across difficulty bands.'],
  [Activity, 'Verdict Pattern Insights', 'Find recurring WA, TLE, and runtime error patterns.'],
  [Bot, 'AI Upsolving Coach', 'Turn raw performance signals into a focused next step.'],
  [
    WandSparkles,
    'Personalized Roadmap',
    'Get a practical weekly plan shaped around your schedule.',
  ],
  [TrendingUp, 'Progress Tracking', 'Watch weakness scores fall as your consistency climbs.'],
]
function MiniHeroDashboard() {
  return (
    <Card className="relative mx-auto max-w-3xl overflow-hidden border-white/[.1] bg-[#0d121d]/90 p-3 shadow-[0_30px_100px_rgba(0,0,0,.5)] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-600">Performance overview</p>
          <p className="text-sm font-semibold">Good evening, raghav_setia</p>
        </div>
        <Badge tone="green">● Data synced</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Current rating', '1,231'],
          ['Problems solved', '218'],
          ['AC rate', '67%'],
          ['Weakness score', '49'],
        ].map(([l, v], i) => (
          <div key={l} className="rounded-xl border border-white/[.06] bg-white/[.03] p-3">
            <p className="text-[10px] text-slate-600">{l}</p>
            <p
              className={`mt-1 font-mono text-lg font-semibold ${i === 3 ? 'text-amber-300' : ''}`}
            >
              {v}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-white/[.06] bg-black/15 p-3">
          <p className="mb-3 text-xs font-medium">Success by rating</p>
          <div className="h-36">
            <BarChartView data={ratingData.slice(0, 4)} />
          </div>
        </div>
        <div className="rounded-xl border border-white/[.06] bg-black/15 p-3">
          <p className="mb-3 text-xs font-medium">AI insight</p>
          <div className="rounded-lg bg-violet-400/[.07] p-3 text-xs leading-5 text-slate-400">
            <Sparkles size={15} className="mb-2 text-violet-300" />
            Focus on DP transitions in the 1300–1500 range this week.
          </div>
          <Progress value={68} className="mt-4" />
        </div>
      </div>
    </Card>
  )
}
export function LandingPage() {
  return (
    <div className="mesh min-h-screen overflow-hidden">
      <Navbar />
      <main>
        <section className="dot-grid relative px-5 pb-24 pt-36 text-center sm:pt-44">
          <div className="mx-auto max-w-5xl">
            <Badge tone="cyan" className="mb-6 gap-2">
              <Sparkles size={12} /> Competitive programming, decoded
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-6xl lg:text-7xl">
              Turn your Codeforces history into a{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                clear improvement roadmap.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Analyze weak topics, rating gaps, verdict patterns, and get AI-guided upsolving plans
              built around the way you actually compete.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/onboarding">
                <Button size="lg">
                  Analyze my handle <ArrowRight size={17} />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="secondary">
                  View live demo <ChevronRight size={17} />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-600">
              No credit card · Your first analysis takes under a minute
            </p>
          </div>
          <div id="demo" className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute inset-12 bg-cyan-400/10 blur-[80px]" />
            <MiniHeroDashboard />
          </div>
        </section>
        <section id="features" className="border-y border-white/[.05] bg-black/15 px-5 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="font-mono text-xs uppercase tracking-[.2em] text-cyan-400">
                Signal over noise
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Know what to practice next
              </h2>
              <p className="mt-3 text-slate-500">
                A complete picture of your competitive programming performance, translated into
                decisions.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(([Icon, title, text]) => (
                <Card
                  key={title}
                  className="group p-6 transition hover:-translate-y-1 hover:border-cyan-400/20"
                >
                  <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-slate-950">
                    <Icon size={20} />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section id="how" className="px-5 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-xl">
              <p className="font-mono text-xs uppercase tracking-[.2em] text-violet-400">
                From history to action
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                Four steps. One sharper practice loop.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['01', 'Enter your handle', 'Tell us where your Codeforces history lives.'],
                [
                  '02',
                  'Fetch your history',
                  'We organize submissions, tags, ratings, and verdicts.',
                ],
                ['03', 'Expose weak areas', 'Patterns become clear across topics and difficulty.'],
                ['04', 'Get your AI plan', 'Receive a focused upsolving roadmap.'],
              ].map(([n, t, d], i) => (
                <div key={n} className="relative">
                  <Card className="h-full p-6">
                    <span className="font-mono text-xs text-cyan-400">{n}</span>
                    <h3 className="mt-8 font-semibold">{t}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{d}</p>
                  </Card>
                  {i < 3 && (
                    <ArrowRight
                      className="absolute -right-3 top-1/2 z-10 hidden text-slate-700 md:block"
                      size={18}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-5 py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-[.2em] text-cyan-400">
                Built for the climb
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                Your submissions already tell a story. We make it useful.
              </h2>
              <p className="mt-5 leading-7 text-slate-500">
                CP Pulse connects the tiny signals—repeat wrong answers, abandoned topics, rating
                cliffs—to show where your next hundred rating points can come from.
              </p>
              <div className="mt-7 space-y-3">
                {[
                  'Topic and rating-level breakdowns',
                  'Unsolved attempts ranked by learning value',
                  'Plans that adjust to your available time',
                ].map((x) => (
                  <p key={x} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
                      <Check size={12} />
                    </span>
                    {x}
                  </p>
                ))}
              </div>
            </div>
            <Card className="p-5">
              <p className="mb-4 text-sm font-semibold">Topic weakness score</p>
              <div className="h-72">
                <BarChartView data={topicData} dataKey="weakness" nameKey="short" color="#30a2e3" />
              </div>
            </Card>
          </div>
        </section>
        <section className="px-5 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[.2em] text-violet-400">
                  Used in the arena
                </p>
                <h2 className="mt-3 text-3xl font-semibold">Less guessing. Better reps.</h2>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                [
                  '“It showed me I wasn’t bad at graphs—I was bad at modeling 1400-rated graph problems. That distinction changed my practice.”',
                  'Aarav M.',
                  'Specialist · 1482',
                ],
                [
                  '“The upsolving queue is the first thing that made me revisit failed contest problems consistently.”',
                  'Nisha K.',
                  'Pupil · 1276',
                ],
                [
                  '“My weekly plan finally feels specific enough to follow after work. No giant random problem lists.”',
                  'Daniel T.',
                  'Expert · 1711',
                ],
              ].map(([q, n, r]) => (
                <Card key={n} className="p-6">
                  <p className="text-sm leading-7 text-slate-300">{q}</p>
                  <div className="mt-6 border-t border-white/[.06] pt-4">
                    <p className="text-sm font-semibold">{n}</p>
                    <p className="text-xs text-slate-600">{r}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="px-5 py-20">
          <Card className="relative mx-auto max-w-6xl overflow-hidden border-cyan-400/20 px-6 py-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/[.07] via-transparent to-violet-500/[.09]" />
            <div className="relative">
              <Zap className="mx-auto mb-5 text-cyan-300" />
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Your next rating milestone starts with clarity.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-500">
                Transform Codeforces history into weakness insights and AI-guided upsolving plans.
              </p>
              <Link to="/register">
                <Button size="lg" className="mt-8">
                  Build my roadmap <ArrowRight size={17} />
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  )
}
function Footer() {
  return (
    <footer className="border-t border-white/[.06] px-5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold">
            CP<span className="text-cyan-300">Pulse</span>
          </p>
          <p className="mt-1 text-xs text-slate-600">Built for people who keep submitting.</p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs text-slate-500">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <CodeXml size={16} />
        </div>
      </div>
    </footer>
  )
}

function AuthVisual() {
  return (
    <div className="mesh hidden min-h-screen place-items-center border-l border-white/[.06] p-12 lg:grid">
      <div className="max-w-lg">
        <Badge tone="cyan">Live performance intelligence</Badge>
        <h2 className="mt-5 text-4xl font-semibold leading-tight">
          Stop practicing more.
          <br />
          Start practicing sharper.
        </h2>
        <p className="mt-4 text-slate-500">See the patterns hiding in your submission history.</p>
        <Card className="mt-9 p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-slate-500">Weekly trajectory</p>
              <p className="mt-1 text-lg font-semibold">+8.4% solve efficiency</p>
            </div>
            <TrendingUp className="text-emerald-400" />
          </div>
          <div className="mt-6 grid grid-cols-8 items-end gap-2">
            {[30, 44, 38, 55, 47, 64, 72, 83].map((v, i) => (
              <div
                key={i}
                className="rounded-t bg-gradient-to-t from-violet-500 to-cyan-400"
                style={{ height: v }}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-5 py-8 sm:px-10">
        <Link to="/" className="font-semibold">
          CP<span className="text-cyan-300">Pulse</span>
        </Link>
        <div className="m-auto w-full max-w-md py-10">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer}
        </div>
      </div>
      <AuthVisual />
    </div>
  )
}
const Field = ({ label, icon: Icon, ...props }) => (
  <div>
    <Label>{label}</Label>
    <div className="relative">
      {Icon && (
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
      )}
      <Input className={Icon ? 'pl-10' : ''} {...props} />
    </div>
  </div>
)
function FormError({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-400/20 bg-rose-400/[.06] p-3 text-sm text-rose-200"
    >
      {message}
    </div>
  )
}

function GoogleAuthButton({ label = 'Continue with Google' }) {
  const [checking, setChecking] = useState(false)

  async function startGoogleSignIn() {
    setChecking(true)
    try {
      const { configured } = await authApi.googleStatus()
      if (!configured) {
        toast.error('Google sign-in needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.')
        return
      }
      toast.loading('Opening Google sign-in…', { id: 'google-auth' })
      window.location.assign(authApi.googleLoginUrl())
    } catch (error) {
      toast.error(getApiErrorMessage(error), { id: 'google-auth' })
    } finally {
      setChecking(false)
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      onClick={startGoogleSignIn}
      disabled={checking}
    >
      <span className="font-bold text-white">G</span>{' '}
      {checking ? 'Checking Google sign-in…' : label}
    </Button>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    setSubmitting(true)
    try {
      await login({ email: form.get('email'), password: form.get('password') })
      toast.success('Welcome back! Live analytics are loading.')
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Continue your climb with a clearer next step."
      footer={
        <p className="mt-7 text-center text-sm text-slate-500">
          New to CP Pulse?{' '}
          <Link to="/register" className="font-medium text-cyan-300">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {searchParams.get('oauth') && (
          <FormError
            message={
              searchParams.get('oauth') === 'denied'
                ? 'Google sign-in was cancelled.'
                : 'Google sign-in could not be completed. Please try again.'
            }
          />
        )}
        <FormError message={error} />
        <Field
          label="Email"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <div>
          <div className="flex justify-between">
            <Label>Password</Label>
            <Link to="/forgot-password" className="text-xs text-cyan-300">
              Forgot password?
            </Link>
          </div>
          <Field
            icon={LockKeyhole}
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'} <ArrowRight size={16} />
        </Button>
        <Divider />
        <GoogleAuthButton />
      </form>
    </AuthShell>
  )
}
function Divider() {
  return (
    <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-700">
      <span className="h-px flex-1 bg-white/[.07]" />
      or
      <span className="h-px flex-1 bg-white/[.07]" />
    </div>
  )
}
export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get('password') !== form.get('confirmPassword')) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await register({
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        codeforcesHandle: form.get('codeforcesHandle'),
        targetRating: Number(form.get('targetRating')),
      })
      toast.success('Account created successfully')
      navigate('/onboarding', { replace: true })
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Your first performance map is a few details away."
      footer={
        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-cyan-300">
            Log in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormError message={error} />
        <Field label="Full name" icon={User} name="name" placeholder="Raghav Setia" required />
        <Field
          label="Email"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Password"
            icon={LockKeyhole}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="••••••••"
            required
          />
          <Field
            label="Confirm password"
            icon={LockKeyhole}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Codeforces handle"
            icon={Braces}
            name="codeforcesHandle"
            placeholder="raghav_setia"
          />
          <div>
            <Label>Target rating</Label>
            <Select name="targetRating" className="w-full" defaultValue="1600">
              <option value="1400">1400 — Specialist</option>
              <option value="1600">1600 — Expert</option>
              <option value="1900">1900 — Candidate Master</option>
            </Select>
          </div>
        </div>
        <Button className="mt-2 w-full" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create free account'} <ArrowRight size={16} />
        </Button>
        <Divider />
        <GoogleAuthButton label="Sign up with Google" />
      </form>
    </AuthShell>
  )
}
export function ForgotPasswordPage() {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    setSubmitting(true)
    try {
      const result = await authApi.forgotPassword(form.get('email'))
      setSent(true)
      setDevResetUrl(result.devResetUrl || '')
      toast.success('Password reset request accepted')
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We’ll send a secure reset link to your inbox."
      footer={
        <p className="mt-7 text-center text-sm">
          <Link to="/login" className="text-cyan-300">
            ← Back to login
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormError message={error} />
        {sent && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-4 text-sm text-emerald-100">
            If an account exists for that email, a reset link has been prepared.
          </div>
        )}
        <Field
          label="Email address"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? 'Preparing reset link…' : 'Send reset link'} <ArrowRight size={16} />
        </Button>
        <div className="flex gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-4">
          <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
          <p className="text-xs leading-5 text-slate-500">
            For privacy, the response is the same whether or not that email has an account. Reset
            links expire automatically.
          </p>
        </div>
        {devResetUrl && (
          <a
            href={devResetUrl}
            className="block rounded-xl border border-amber-400/20 bg-amber-400/[.06] p-4 text-sm text-amber-200 hover:border-amber-400/40"
          >
            SMTP is not configured. Open the development reset link →
          </a>
        )}
      </form>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const token = searchParams.get('token') || ''

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get('password') !== form.get('confirmPassword')) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await resetPassword({ token, password: form.get('password') })
      toast.success('Password updated. You are signed in.')
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use at least eight characters. This reset link can only be used once."
      footer={
        <p className="mt-7 text-center text-sm">
          <Link to="/login" className="text-cyan-300">
            ← Back to login
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormError message={!token ? 'This reset link is missing its security token.' : error} />
        <Field
          label="New password"
          icon={LockKeyhole}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Field
          label="Confirm new password"
          icon={LockKeyhole}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Button className="w-full" type="submit" disabled={submitting || !token}>
          {submitting ? 'Updating password…' : 'Update password'} <ArrowRight size={16} />
        </Button>
      </form>
    </AuthShell>
  )
}
export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [topics, setTopics] = useState(
    user?.difficultTopics?.length
      ? user.difficultTopics
      : ['Dynamic Programming', 'Graphs', 'Binary Search'],
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const availableTopics = [
    'Dynamic Programming',
    'Graphs',
    'Binary Search',
    'Greedy',
    'Number Theory',
    'Combinatorics',
  ]

  function toggleTopic(topic) {
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic],
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const handle = String(form.get('codeforcesHandle')).trim()
    setError('')
    setSubmitting(true)
    try {
      await analyticsApi.analyze(handle, { refresh: true })
      await userApi.updateProfile({
        targetRating: Number(form.get('targetRating')),
        preferredPracticeMinutes: Number(form.get('preferredPracticeMinutes')),
        difficultTopics: topics,
      })
      const nextUser = await userApi.updateHandle(handle)
      updateUser(nextUser)
      toast.success('Profile connected. Your analytics are ready.')
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mesh min-h-screen px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-semibold">
            CP<span className="text-cyan-300">Pulse</span>
          </Link>
          <span className="text-xs text-slate-600">Setup · 2 min</span>
        </div>
        <div className="mt-12">
          <Badge tone="cyan">Personalize your analysis</Badge>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Let’s map your next milestone.
          </h1>
          <p className="mt-2 text-slate-500">
            A few details help tune your analysis to the goals you can actually follow.
          </p>
        </div>
        <Card className="mt-8 p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormError message={error} />
            </div>
            <Field
              label="Codeforces handle"
              icon={Braces}
              name="codeforcesHandle"
              defaultValue={user?.codeforcesHandle || ''}
              placeholder="raghav_setia"
              required
            />
            <Field
              label="Target rating"
              name="targetRating"
              defaultValue={user?.targetRating || 1600}
              min="800"
              max="4000"
              type="number"
              required
            />
            <div>
              <Label>Practice time per day</Label>
              <Select
                name="preferredPracticeMinutes"
                className="w-full"
                defaultValue={String(user?.preferredPracticeMinutes || 60)}
              >
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">2 hours</option>
              </Select>
            </div>
            <div>
              <Label>Rating is verified automatically</Label>
              <div className="flex h-11 items-center rounded-xl border border-white/[.08] bg-black/20 px-3.5 text-sm text-slate-500">
                Pulled from your public Codeforces profile
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>Topics you already find difficult</Label>
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => {
                  const selected = topics.includes(topic)
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      aria-pressed={selected}
                      className={`rounded-xl border px-3 py-2 text-sm ${selected ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' : 'border-white/[.08] text-slate-500'}`}
                    >
                      {selected && <Check size={13} className="mr-1 inline" />}
                      {topic}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button size="lg" className="w-full" type="submit" disabled={submitting}>
                {submitting ? 'Analyzing Codeforces history…' : 'Generate my first analysis'}
                <Sparkles size={17} />
              </Button>
            </div>
          </form>
        </Card>
        <p className="mt-5 text-center text-xs text-slate-600">
          We only read public Codeforces data. Your credentials are never requested.
        </p>
      </div>
    </div>
  )
}
export function NotFoundPage() {
  return (
    <div className="dot-grid grid min-h-screen place-items-center px-5 text-center">
      <div>
        <p className="font-mono text-8xl font-semibold text-white/[.06]">404</p>
        <h1 className="-mt-5 text-3xl font-semibold">This page went out of bounds.</h1>
        <p className="mt-3 text-slate-500">Even binary search couldn’t find it.</p>
        <Link to="/dashboard">
          <Button className="mt-7">
            Back to dashboard <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  )
}
