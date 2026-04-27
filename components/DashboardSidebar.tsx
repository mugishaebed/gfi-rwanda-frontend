'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
}

export default function DashboardSidebar({
  brand,
  sections,
}: {
  brand: string
  sections: NavSection[]
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href.endsWith('/loan-officer') || href.endsWith('/general-manager')) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto border-r border-[#d7eadf] bg-[#fbfefb] transition-[width] duration-300 ${
        collapsed ? 'w-[96px]' : 'w-[290px]'
      }`}
    >
      <div
        className={`relative flex min-h-[126px] bg-[#36e07b] py-7 text-white transition-all duration-300 ${
          collapsed ? 'items-start justify-center px-4 pt-16' : 'items-center justify-between px-7'
        }`}
      >
        <div>
          <div className={`${collapsed ? 'flex justify-center' : 'overflow-hidden'}`}>
            <img
              src="/logo.svg"
              alt="GFI Rwanda logo"
              width={56}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </div>
          {!collapsed && (
            <>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                GFI Rwanda
              </p>
              <p className="mt-1 text-lg font-semibold">{brand}</p>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((current) => !current)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/8 text-white/80 transition-all ${
            collapsed ? 'absolute right-3 top-3' : ''
          }`}
        >
          <svg
            className={`h-5 w-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M8 12h8M8 18h8M5 6h.01M5 12h.01M5 18h.01" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col px-6 py-8">
        <div className="space-y-7">
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#6d9e82]">
                  {section.title}
                </p>
              )}
              <nav className="space-y-1.5">
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group flex rounded-2xl py-3 text-[15px] font-medium transition-all ${
                        active
                          ? 'bg-[#36e07b] text-white'
                          : 'text-[#52685b] hover:bg-[#edf9f0] hover:text-[#164d2e]'
                      } ${
                        collapsed
                          ? 'justify-center px-3'
                          : 'items-center gap-3 px-4'
                      }`}
                    >
                      <span className={active ? 'text-white' : 'text-[#77a288] group-hover:text-[#36e07b]'}>
                        {item.icon}
                      </span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
