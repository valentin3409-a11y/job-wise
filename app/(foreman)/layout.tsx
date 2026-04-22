import ClientLayout from '@/components/foreman/ClientLayout'

export const metadata = {
  title: 'Foreman — Cockpit de pilotage chantier',
  description: 'Pilotez vos chantiers avec précision. Budget, planning, équipes et risques en un seul tableau de bord.',
}

export default function ForemanLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>
}
