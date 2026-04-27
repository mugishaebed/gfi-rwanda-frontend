export default function NotificationsPage() {
  return (
    <div className="flex h-full min-h-[calc(100vh-80px)] items-center justify-center">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#edf9f0]">
            <svg
              className="h-10 w-10 text-[#36e07b]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17H9.143m10.286 0H20a2 2 0 01-2-2v-3.586a2 2 0 00-.586-1.414L16 8.586A2 2 0 0115.414 7V6a3.414 3.414 0 10-6.828 0v1a2 2 0 01-.586 1.414L6.586 10A2 2 0 006 11.414V15a2 2 0 01-2 2h.571m10.286 0a2.857 2.857 0 11-5.714 0"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <p className="mt-2 text-sm text-gray-500">This feature is coming soon.</p>
        <p className="mt-1 text-sm text-gray-400">
          You'll be able to manage all your alerts and updates here.
        </p>
      </div>
    </div>
  )
}
