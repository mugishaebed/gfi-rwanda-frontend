export default function DashboardError() {
  return (
    <div className="dashboard-panel animate-fade-up flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.01M10.34 3.94l-7.5 12.99A1.5 1.5 0 004.14 19.5h15.72a1.5 1.5 0 001.3-2.57l-7.5-12.99a1.5 1.5 0 00-2.62 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-[#1f1724]">We couldn’t load your dashboard</h2>
      <p className="mt-2 max-w-md text-sm text-gray-400">
        The summary service didn’t respond. Refresh the page in a moment — if it keeps happening,
        contact support.
      </p>
    </div>
  )
}
