import Sidebar from '@/components/foreman/Sidebar'

export const metadata = {
  title: 'Foreman — Cockpit de pilotage chantier',
  description: 'Pilotez vos chantiers avec précision. Budget, planning, équipes et risques en un seul tableau de bord.',
}

export default function ForemanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
