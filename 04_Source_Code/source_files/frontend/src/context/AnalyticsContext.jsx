import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { analyticsApi } from '../services/analyticsApi'
import { getApiErrorMessage } from '../services/apiClient'
import { reportApi } from '../services/reportApi'
import { useAuth } from './AuthContext'

const AnalyticsContext = createContext(null)

function normalizeReport(report) {
  if (!report) return null
  return {
    ...report,
    profile: report.profile || report.summary?.profile || {},
    upsolvingAnalysis: report.upsolvingAnalysis || report.upsolvingProblems || [],
  }
}

function storageKey(user, handle) {
  return user?.id && handle ? `cp-pulse:analytics:${user.id}:${handle.toLowerCase()}` : null
}

function readStoredReport(key) {
  if (!key) return null
  try {
    return normalizeReport(JSON.parse(sessionStorage.getItem(key)))
  } catch {
    return null
  }
}

function storeReport(key, report) {
  if (!key || !report) return
  try {
    sessionStorage.setItem(key, JSON.stringify(report))
  } catch {
    // Analytics still work when browser storage is unavailable or full.
  }
}

export function AnalyticsProvider({ children }) {
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateReport(nextReport, handle = user?.codeforcesHandle) {
    const normalized = normalizeReport(nextReport)
    setReport(normalized)
    storeReport(storageKey(user, handle), normalized)
    return normalized
  }

  async function refresh(handle = user?.codeforcesHandle, options = {}) {
    if (!handle) {
      setReport(null)
      setError('Add a Codeforces handle in onboarding to load analytics.')
      return null
    }
    setLoading(true)
    setError('')
    try {
      const nextReport = await analyticsApi.analyze(handle, options)
      return updateReport(nextReport, handle)
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(report ? `${message} Showing the cached report.` : message)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const handle = user?.codeforcesHandle
    if (!handle) {
      setReport(null)
      setLoading(false)
      setError('')
      return () => {
        active = false
      }
    }

    const key = storageKey(user, handle)
    const stored = readStoredReport(key)
    setReport(stored)
    setLoading(!stored)
    setError('')

    async function hydrate() {
      let fallback = stored
      if (!fallback) {
        try {
          fallback = normalizeReport(await reportApi.latest(handle))
          if (active) {
            setReport(fallback)
            storeReport(key, fallback)
            toast('Latest saved report loaded while live data refreshes.', { icon: '📄' })
          }
        } catch {
          // A saved report is optional; continue to the live cache/API path.
        }
      }

      try {
        const live = normalizeReport(await analyticsApi.analyze(handle))
        if (active) {
          setReport(live)
          storeReport(key, live)
          setError('')
          toast.success(
            live.cache?.cached ? 'Cached analytics ready' : 'Live Codeforces analytics ready',
          )
        }
      } catch (requestError) {
        if (active) {
          const message = getApiErrorMessage(requestError)
          setError(fallback ? `${message} Showing the cached report.` : message)
          toast.error(
            fallback ? 'Live refresh failed; cached analytics remain available.' : message,
          )
        }
      } finally {
        if (active) setLoading(false)
      }

      if (active && user?.preferences?.weeklyReport) {
        try {
          const weekly = await reportApi.ensureWeekly()
          if (active && weekly.generated) {
            toast.success('Your new weekly performance report is ready.')
          }
        } catch {
          // Weekly generation is non-blocking; live analytics remain usable if it fails.
        }
      }
    }

    hydrate()
    return () => {
      active = false
    }
  }, [user?.id, user?.codeforcesHandle])

  const value = useMemo(
    () => ({ report, loading, error, refresh, setReport: updateReport }),
    [report, loading, error],
  )

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) throw new Error('useAnalytics must be used inside AnalyticsProvider')
  return context
}
