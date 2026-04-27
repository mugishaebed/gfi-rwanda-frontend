'use client'

export default function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-medium text-[#587360] transition-colors hover:border-[#b8dcc4] hover:text-[#36e07b]"
      >
        Sign out
      </button>
    </form>
  )
}
