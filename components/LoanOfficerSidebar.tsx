'use client'

import DashboardSidebar from './DashboardSidebar'

const SECTIONS = [
  {
    title: 'Menu',
    items: [
      {
        label: 'Overview',
        href: '/dashboard/loan-officer',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5.5v-6h-5v6H4a1 1 0 01-1-1v-8.5z" />
          </svg>
        ),
      },
      {
        label: 'Clients',
        href: '/dashboard/loan-officer/clients',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z" />
          </svg>
        ),
      },
      {
        label: 'Loans',
        href: '/dashboard/loan-officer/loans',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        label: 'Repayments',
        href: '/dashboard/loan-officer/repayments',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        label: 'Online Payments',
        href: '/dashboard/loan-officer/online-payments',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5h16M6 5h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zm2 9h4m5-3.5h.01M17 14h.01" />
          </svg>
        ),
      },
      {
        label: 'Reports',
        href: '/dashboard/loan-officer/reports',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Others',
    items: [
      {
        label: 'Notifications',
        href: '/dashboard/loan-officer/notifications',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17H9.143m10.286 0H20a2 2 0 01-2-2v-3.586a2 2 0 00-.586-1.414L16 8.586A2 2 0 0115.414 7V6a3.414 3.414 0 10-6.828 0v1a2 2 0 01-.586 1.414L6.586 10A2 2 0 006 11.414V15a2 2 0 01-2 2h.571m10.286 0a2.857 2.857 0 11-5.714 0" />
          </svg>
        ),
      },
    ],
  },
]

export default function LoanOfficerSidebar() {
  return (
    <DashboardSidebar
      brand="Loan Officer"
      sections={SECTIONS}
    />
  )
}
