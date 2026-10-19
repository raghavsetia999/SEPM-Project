import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '../services/authApi'

const AuthContext = createContext(null)
const cachedUserKey = 'cp-pulse:auth-user'

function readCachedUser() {
  try {
    return JSON.parse(localStorage.getItem(cachedUserKey))
  } catch {
    return null
  }
}

function cacheUser(user) {
  try {
    if (user) localStorage.setItem(cachedUserKey, JSON.stringify(user))
    else localStorage.removeItem(cachedUserKey)
  } catch {
    // The httpOnly cookie remains the source of truth when browser storage is unavailable.
  }
}

function isAuthenticationFailure(error) {
  return (
    error?.response?.status === 401 ||
    ['AUTHENTICATION_REQUIRED', 'INVALID_SESSION'].includes(error?.apiCode)
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser)
  const [loading, setLoading] = useState(true)

  function applyUser(nextUser) {
    setUser(nextUser)
    cacheUser(nextUser)
  }

  useEffect(() => {
    let active = true
    authApi
      .me()
      .then((currentUser) => {
        if (!active) return
        applyUser(currentUser)
        const params = new URLSearchParams(window.location.search)
        if (params.get('oauth') === 'success') {
          toast.success('Signed in with Google')
          params.delete('oauth')
          const query = params.toString()
          window.history.replaceState(
            {},
            '',
            `${window.location.pathname}${query ? `?${query}` : ''}`,
          )
        }
      })
      .catch((error) => {
        if (active && isAuthenticationFailure(error)) applyUser(null)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(credentials) {
        const currentUser = await authApi.login(credentials)
        applyUser(currentUser)
        return currentUser
      },
      async register(details) {
        const currentUser = await authApi.register(details)
        applyUser(currentUser)
        return currentUser
      },
      async resetPassword(details) {
        const currentUser = await authApi.resetPassword(details)
        applyUser(currentUser)
        return currentUser
      },
      async logout() {
        try {
          await authApi.logout()
        } finally {
          applyUser(null)
        }
      },
      updateUser(nextUser) {
        applyUser(nextUser)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
