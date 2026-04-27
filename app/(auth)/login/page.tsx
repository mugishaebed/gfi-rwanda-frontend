'use client'

import React, { useState } from 'react'
import { getMicrosoftLoginUrl, getMicrosoftSignupUrl } from '@/lib/api'

type View = 'main' | 'signup'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [view, setView] = useState<View>('main')
  const params = React.use(searchParams)

  const errorMessages: Record<string, string> = {
    missing_params: 'Authentication failed. Please try again.',
    unauthorized: 'You are not authorized to access this application.',
    auth_failed: 'Microsoft authentication failed. Please try again.',
    session_expired: 'Your session has expired. Please sign in again.',
  }

  const error = params?.error ? errorMessages[params.error] ?? 'Something went wrong.' : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">GFI Rwanda</h1>
            <p className="mt-1 text-sm text-gray-500">Loan Management System</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {view === 'main' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center mb-4">
                Select your role to continue sign-in with Microsoft.
              </p>

              <a
                href={getMicrosoftLoginUrl('LOAN_OFFICER')}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <MicrosoftIcon />
                Sign in as Loan Officer
              </a>

              <a
                href={getMicrosoftLoginUrl('GENERAL_MANAGER')}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <MicrosoftIcon />
                Sign in as General Manager
              </a>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400">
                  <span className="bg-white px-3">New to GFI Rwanda?</span>
                </div>
              </div>

              <button
                onClick={() => setView('signup')}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Create an account
              </button>
            </div>
          )}

          {view === 'signup' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center mb-4">
                Select your role to continue sign-up with Microsoft.
              </p>

              <a
                href={getMicrosoftSignupUrl('LOAN_OFFICER')}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <MicrosoftIcon />
                Sign up as Loan Officer
              </a>

              <a
                href={getMicrosoftSignupUrl('GENERAL_MANAGER')}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <MicrosoftIcon />
                Sign up as General Manager
              </a>

              <button
                onClick={() => setView('main')}
                className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}
