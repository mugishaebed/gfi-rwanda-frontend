import DashboardTopbar from './DashboardTopbar'

export default function DashboardFrame({
  sidebar,
  name,
  email,
  roleLabel,
  children,
}: {
  sidebar: React.ReactNode
  name?: string
  email?: string
  roleLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-white text-[#1f1724]">
      {sidebar}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <DashboardTopbar name={name} email={email} roleLabel={roleLabel} />
        <main className="flex-1 overflow-y-auto px-5 py-5 lg:px-7 lg:py-6">
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
