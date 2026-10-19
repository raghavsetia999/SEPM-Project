import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastBar, Toaster, toast } from 'react-hot-toast'
import { X } from 'lucide-react'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { AnalyticsProvider } from './context/AnalyticsContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AnalyticsProvider>
          <App />
          <Toaster
            position="top-right"
            containerStyle={{ top: 84 }}
            toastOptions={{
              duration: 5000,
              style: {
                background: '#111827',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,.09)',
              },
              success: { iconTheme: { primary: '#22d3ee', secondary: '#0f172a' } },
              error: { iconTheme: { primary: '#fb7185', secondary: '#0f172a' } },
            }}
          >
            {(currentToast) => (
              <ToastBar toast={currentToast}>
                {({ icon, message }) => (
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0">{icon}</span>
                    <div className="min-w-0 flex-1 break-words text-sm leading-5">{message}</div>
                    <button
                      type="button"
                      onClick={() => toast.dismiss(currentToast.id)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                      aria-label="Dismiss notification"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </ToastBar>
            )}
          </Toaster>
        </AnalyticsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
