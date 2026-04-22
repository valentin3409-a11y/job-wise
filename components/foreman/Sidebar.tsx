'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Zap, DollarSign, Ruler, HardHat, CalendarDays, Users, AlertTriangle,
  CheckSquare, MessageSquare, Mail, Bell, Brain, BarChart3, FolderOpen,
  Settings, ChevronDown, Menu, X, Building2
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/command-center', icon: Zap,           label: 'Command Center' },
  { href: '/financials',     icon: DollarSign,    label: 'Financials' },
  { href: '/takeoff',        icon: Ruler,         label: 'Takeoff' },
  { href: '/site',           icon: HardHat,       label: 'Site' },
  { href: '/planning',       icon: CalendarDays,  label: 'Planning' },
  { href: '/labour',         icon: Users,         label: 'Labour' },
  { href: '/risks',          icon: AlertTriangle, label: 'Risks', badge: 4 },
  { href: '/tasks',          icon: CheckSquare,   label: 'Tasks' },
  { href: '/chat',           icon: MessageSquare, label: 'Chat' },
  { href: '/emails',         icon: Mail,          label: 'Emails', badge: 7 },
  { href: '/alerts',         icon: Bell,          label: 'Alerts', badge: 3 },
  { href: '/ai-assistant',   icon: Brain,         label: 'AI Assistant' },
  { href: '/reports',        icon: BarChart3,     label: 'Reports' },
  { href: '/documents',      icon: FolderOpen,    label: 'Documents' },
  { href: '/settings',       icon: Settings,      label: 'Settings' },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <span className="text-white font-bold text-lg tracking-widest uppercase">Foreman</span>
        </div>
      </div>

      {/* Project selector */}
      <div className="px-3 py-3 border-b border-slate-800">
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-sm text-slate-300 transition-colors group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />
            <div className="min-w-0 text-left">
              <div className="truncate font-medium text-slate-200">Tour Belvédère</div>
              <div className="text-xs text-slate-500 truncate">Paris 15e • En cours</div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-slate-400" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none ${
                  item.href === '/alerts' || item.href === '/risks'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            V
          </div>
          <div className="min-w-0">
            <div className="text-slate-200 text-sm font-medium truncate">Valentin</div>
            <div className="text-slate-500 text-xs">Chef de projet</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-slate-900 min-h-screen flex-shrink-0 sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 rounded-lg text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-56 bg-slate-900 z-50 overflow-y-auto shadow-2xl">
            <NavContent onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}
