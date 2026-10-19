import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { Brand } from '../layouts/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { Avatar, Button } from './ui'
export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { loading, logout, user } = useAuth()
  const initials =
    user?.name
      ?.split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CP'

  async function handleLogout() {
    try {
      await logout()
      toast.success('Logged out successfully')
    } catch {
      toast('Local session cleared. The server could not confirm logout.', { icon: 'ℹ️' })
    } finally {
      setOpen(false)
    }
  }

  const accountControls = user ? (
    <>
      <Link
        to="/profile"
        className="flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/[.04]"
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <Avatar initials={initials} className="h-9 w-9 text-xs" />
        )}
        <span className="hidden min-w-0 text-left xl:block">
          <span className="block max-w-36 truncate text-sm font-semibold text-slate-200">
            {user.name}
          </span>
          <span className="block max-w-36 truncate text-[11px] text-slate-500">
            {user.codeforcesHandle ? `@${user.codeforcesHandle}` : user.email}
          </span>
        </span>
      </Link>
      <Link to="/dashboard">
        <Button variant="secondary">
          <LayoutDashboard size={16} /> Dashboard
        </Button>
      </Link>
      <Button variant="ghost" size="icon" title="Log out" onClick={handleLogout}>
        <LogOut size={16} />
      </Button>
    </>
  ) : (
    <>
      <Link to="/login">
        <Button variant="ghost">Log in</Button>
      </Link>
      <Link to="/register">
        <Button>Start free</Button>
      </Link>
    </>
  )

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[.06] bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex">
          {[
            ['Features', '#features'],
            ['How It Works', '#how'],
            ['Demo', '#demo'],
            ['Pricing', '#pricing'],
          ].map(([l, h]) => (
            <a key={l} href={h} className="text-sm text-slate-500 hover:text-white">
              {l}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">{!loading && accountControls}</div>
        <button
          type="button"
          aria-label="Toggle navigation"
          className="text-slate-400 md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/[.06] p-5 md:hidden">
          <div className="flex flex-col gap-4">
            {[
              ['Features', '#features'],
              ['How It Works', '#how'],
              ['Demo', '#demo'],
              ['Pricing', '#pricing'],
            ].map(([l, h]) => (
              <a key={l} onClick={() => setOpen(false)} href={h} className="text-sm text-slate-400">
                {l}
              </a>
            ))}
            {!loading &&
              (user ? (
                <>
                  <div className="flex items-center gap-3 border-t border-white/[.06] pt-4">
                    <Avatar initials={initials} className="h-9 w-9 text-xs" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {user.codeforcesHandle ? `@${user.codeforcesHandle}` : user.email}
                      </p>
                    </div>
                  </div>
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <Button className="w-full">Open dashboard</Button>
                  </Link>
                  <Button variant="secondary" className="w-full" onClick={handleLogout}>
                    <LogOut size={16} /> Log out
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button className="w-full">Log in</Button>
                </Link>
              ))}
          </div>
        </div>
      )}
    </header>
  )
}
