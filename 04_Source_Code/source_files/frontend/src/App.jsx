import React, { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

const loadPage = (loader, name) =>
  lazy(() => loader().then((module) => ({ default: module[name] })))

const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))
const LandingPage = loadPage(() => import('./pages/PublicPages'), 'LandingPage')
const LoginPage = loadPage(() => import('./pages/PublicPages'), 'LoginPage')
const RegisterPage = loadPage(() => import('./pages/PublicPages'), 'RegisterPage')
const ForgotPasswordPage = loadPage(() => import('./pages/PublicPages'), 'ForgotPasswordPage')
const ResetPasswordPage = loadPage(() => import('./pages/PublicPages'), 'ResetPasswordPage')
const OnboardingPage = loadPage(() => import('./pages/PublicPages'), 'OnboardingPage')
const NotFoundPage = loadPage(() => import('./pages/PublicPages'), 'NotFoundPage')
const DashboardPage = loadPage(() => import('./pages/AnalyticsPages'), 'DashboardPage')
const AnalyzeHandlePage = loadPage(() => import('./pages/AnalyticsPages'), 'AnalyzeHandlePage')
const WeaknessReportPage = loadPage(() => import('./pages/AnalyticsPages'), 'WeaknessReportPage')
const RatingAnalysisPage = loadPage(() => import('./pages/AnalyticsPages'), 'RatingAnalysisPage')
const VerdictAnalysisPage = loadPage(() => import('./pages/AnalyticsPages'), 'VerdictAnalysisPage')
const UpsolvingPage = loadPage(() => import('./pages/ProductivityPages'), 'UpsolvingPage')
const ProgressPage = loadPage(() => import('./pages/ProductivityPages'), 'ProgressPage')
const ProfilePage = loadPage(() => import('./pages/ProductivityPages'), 'ProfilePage')
const SettingsPage = loadPage(() => import('./pages/ProductivityPages'), 'SettingsPage')
const ReportDetailsPage = loadPage(() => import('./pages/ProductivityPages'), 'ReportDetailsPage')

function PageFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Loading…</div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analyze" element={<AnalyzeHandlePage />} />
            <Route path="/weakness" element={<WeaknessReportPage />} />
            <Route path="/rating-analysis" element={<RatingAnalysisPage />} />
            <Route path="/verdict-analysis" element={<VerdictAnalysisPage />} />
            <Route path="/upsolving" element={<UpsolvingPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/report/:id" element={<ReportDetailsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
