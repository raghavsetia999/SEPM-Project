import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

const CLAMP_CLASSES = { 1: 'truncate', 2: 'line-clamp-2', 3: 'line-clamp-3' }

export function ClampedText({
  text,
  as: Tag = 'p',
  lines = 2,
  className,
  expandable = true,
  children,
  ...props
}) {
  const ref = useRef(null)
  const [clamped, setClamped] = useState(false)
  const [everClamped, setEverClamped] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [tipRect, setTipRect] = useState(null)
  const fullText =
    text ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const measure = () => {
      const overflowed =
        el.scrollHeight - el.clientHeight > 1 || el.scrollWidth - el.clientWidth > 1
      setClamped(overflowed)
      if (overflowed) setEverClamped(true)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children, expanded])

  useEffect(() => {
    if (!tipRect) return undefined
    const hide = () => setTipRect(null)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [tipRect])

  const interactive = expandable && everClamped
  const showable = clamped && !expanded

  function showTip() {
    const el = ref.current
    if (!el) return
    setTipRect(el.getBoundingClientRect())
  }
  function hideTip() {
    setTipRect(null)
  }
  function toggle(event) {
    if (!interactive) return
    event.stopPropagation()
    setTipRect(null)
    setExpanded((value) => !value)
  }

  const handlers = {}
  if (showable) {
    handlers.onMouseEnter = showTip
    handlers.onMouseLeave = hideTip
    handlers.onFocus = showTip
    handlers.onBlur = hideTip
  }
  if (interactive) {
    handlers.onClick = toggle
    handlers.onKeyDown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        toggle(event)
      } else if (event.key === 'Escape') {
        setExpanded(false)
        setTipRect(null)
      }
    }
  }

  let tipLeft = 0
  if (tipRect) {
    const half = Math.min(352, window.innerWidth - 24) / 2
    tipLeft = Math.min(
      Math.max(tipRect.left + tipRect.width / 2, 12 + half),
      window.innerWidth - 12 - half,
    )
  }

  return (
    <>
      <Tag
        {...props}
        ref={ref}
        className={cn(
          className,
          expanded ? '' : CLAMP_CLASSES[lines] || CLAMP_CLASSES[2],
          'break-words',
          interactive && 'cursor-pointer',
        )}
        tabIndex={interactive ? 0 : undefined}
        aria-expanded={interactive ? expanded : undefined}
        {...handlers}
      >
        {children}
        {interactive && expanded && (
          <span className="ml-1 inline-block align-middle text-[11px] font-medium text-cyan-400/70">
            Show less
          </span>
        )}
      </Tag>
      {tipRect &&
        fullText &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[999] max-w-[min(22rem,80vw)] rounded-xl border border-white/[.08] bg-slate-950/95 px-3 py-2 text-left text-xs font-normal leading-5 text-slate-300 shadow-[0_12px_40px_rgba(0,0,0,.5)] backdrop-blur"
            style={
              tipRect.top > 96
                ? {
                    left: tipLeft,
                    top: tipRect.top - 8,
                    transform: 'translate(-50%, -100%)',
                  }
                : {
                    left: tipLeft,
                    top: tipRect.bottom + 8,
                    transform: 'translate(-50%, 0)',
                  }
            }
          >
            {fullText}
          </div>,
          document.body,
        )}
    </>
  )
}

export function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
  const variants = {
    primary:
      'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_8px_28px_rgba(34,211,238,.18)]',
    secondary: 'bg-white/[.07] text-white hover:bg-white/[.11] border border-white/[.08]',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/[.06]',
    danger: 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20',
  }
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-[15px]',
    icon: 'h-10 w-10',
  }
  return (
    <button
      className={cn(
        'inline-flex max-w-full shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'glass min-w-0 max-w-full rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,.18)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-11 min-w-0 w-full rounded-xl border border-white/[.08] bg-black/20 px-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'h-11 min-w-0 max-w-full rounded-xl border border-white/[.08] bg-[#111722] px-3.5 text-sm text-slate-300 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
export function Badge({ children, tone = 'slate', className }) {
  const tones = {
    slate: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    cyan: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
    violet: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
    green: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    amber: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    red: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  }
  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center whitespace-normal break-words rounded-lg border px-2 py-1 text-left text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
export function Progress({ value = 0, className }) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-white/[.06]', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
export function Avatar({ initials = 'RS', className }) {
  return (
    <div
      className={cn(
        'grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-slate-950',
        className,
      )}
    >
      {initials}
    </div>
  )
}
export function Label({ children }) {
  return <label className="mb-2 block text-sm font-medium text-slate-300">{children}</label>
}
export function Switch({ active = true }) {
  return (
    <span
      className={cn(
        'flex h-6 w-11 rounded-full p-1 transition',
        active ? 'justify-end bg-cyan-400' : 'justify-start bg-slate-700',
      )}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow" />
    </span>
  )
}
