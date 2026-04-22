'use client'

import { ProjectProvider } from '@/lib/foreman/project-context'
import Sidebar from './Sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </ProjectProvider>
  )
}
