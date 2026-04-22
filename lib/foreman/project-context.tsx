'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type ProjectStatus = 'active' | 'completed' | 'paused' | 'bid'

export type Project = {
  id: string
  name: string
  location: string
  status: ProjectStatus
  type: string
  budget: number
  progress: number
  color: string
  client: string
  startDate: string
  endDate: string
}

export type UserRole = 'owner' | 'manager' | 'supervisor' | 'client' | 'viewer'

export const ROLE_CONFIG: Record<UserRole, {
  label: string
  color: string
  bg: string
  border: string
  allowedSections: string[]
  description: string
}> = {
  owner: {
    label: 'Propriétaire',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    allowedSections: ['*'],
    description: 'Accès complet à tout le projet et aux paramètres',
  },
  manager: {
    label: 'Chef de projet',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    allowedSections: ['command-center','financials','takeoff','site','planning','labour','risks','tasks','chat','emails','alerts','ai-assistant','reports','documents'],
    description: 'Accès complet sauf paramètres entreprise',
  },
  supervisor: {
    label: 'Superviseur',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    allowedSections: ['site','planning','labour','tasks','chat','alerts','documents'],
    description: 'Terrain uniquement — pas de financials, pas de marges',
  },
  client: {
    label: 'Client',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    allowedSections: ['reports','documents'],
    description: 'Rapports et documents uniquement (lecture seule)',
  },
  viewer: {
    label: 'Invité',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    allowedSections: ['command-center','reports'],
    description: 'Vue aperçu lecture seule, aucune modification',
  },
}

export type TeamMember = {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  joinedAt: string
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Tour Belvédère',
    location: 'Paris 15e',
    status: 'active',
    type: 'Résidentiel',
    budget: 4_850_000,
    progress: 42,
    color: '#f59e0b',
    client: 'Promotion IDF',
    startDate: '2026-01-15',
    endDate: '2026-12-30',
  },
  {
    id: 'p2',
    name: 'Résidence Les Lilas',
    location: 'Vincennes (94)',
    status: 'bid',
    type: 'Résidentiel',
    budget: 2_200_000,
    progress: 0,
    color: '#3b82f6',
    client: 'Nexity',
    startDate: '2026-07-01',
    endDate: '2027-06-30',
  },
]

const DEFAULT_TEAM: TeamMember[] = [
  { id: 'm1', name: 'Valentin', email: 'valentin@btp.fr', role: 'owner', avatar: 'V', joinedAt: '2026-01-01' },
  { id: 'm2', name: 'Pierre M.', email: 'pierre@btp.fr', role: 'manager', avatar: 'P', joinedAt: '2026-01-15' },
  { id: 'm3', name: 'Sophie L.', email: 'sophie@btp.fr', role: 'supervisor', avatar: 'S', joinedAt: '2026-02-01' },
  { id: 'm4', name: 'Marc D.', email: 'marc@btp.fr', role: 'supervisor', avatar: 'M', joinedAt: '2026-02-01' },
  { id: 'm5', name: 'Direction IDF', email: 'direction@promotionidf.fr', role: 'client', avatar: 'D', joinedAt: '2026-01-15' },
]

type ProjectContextType = {
  projects: Project[]
  currentProject: Project
  setCurrentProject: (p: Project) => void
  addProject: (p: Omit<Project, 'id'>) => void
  currentRole: UserRole
  setCurrentRole: (r: UserRole) => void
  team: TeamMember[]
  addTeamMember: (m: Omit<TeamMember, 'id' | 'joinedAt'>) => void
  removeTeamMember: (id: string) => void
  canAccess: (section: string) => boolean
}

const ProjectContext = createContext<ProjectContextType | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS)
  const [currentProject, setCurrentProject] = useState<Project>(DEFAULT_PROJECTS[0])
  const [currentRole, setCurrentRole] = useState<UserRole>('owner')
  const [team, setTeam] = useState<TeamMember[]>(DEFAULT_TEAM)

  function addProject(data: Omit<Project, 'id'>) {
    const p: Project = { ...data, id: `p${Date.now()}` }
    setProjects(prev => [...prev, p])
    setCurrentProject(p)
  }

  function addTeamMember(data: Omit<TeamMember, 'id' | 'joinedAt'>) {
    const m: TeamMember = {
      ...data,
      id: `m${Date.now()}`,
      joinedAt: new Date().toISOString().split('T')[0],
    }
    setTeam(prev => [...prev, m])
  }

  function removeTeamMember(id: string) {
    setTeam(prev => prev.filter(m => m.id !== id))
  }

  function canAccess(section: string): boolean {
    const allowed = ROLE_CONFIG[currentRole].allowedSections
    return allowed.includes('*') || allowed.includes(section)
  }

  return (
    <ProjectContext.Provider value={{
      projects, currentProject, setCurrentProject, addProject,
      currentRole, setCurrentRole,
      team, addTeamMember, removeTeamMember,
      canAccess,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
