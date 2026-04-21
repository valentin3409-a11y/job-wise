export interface Doc {
  name: string
  date: string
}

export interface Email {
  id: string
  fromName: string
  from: string
  subject: string
  body: string
  date: string
  att: string | null
  read: boolean
  type: string
  siteId: string
}

export interface Message {
  id: string
  userId: string
  text: string
  time: string
  pinned: boolean
}

export interface Task {
  id: string
  text: string
  done: boolean
  priority: 'high' | 'med' | 'low'
  assign: string
  due: string
}

export interface Site {
  id: string
  name: string
  shortName: string
  address: string
  client: string
  color: string
  status: 'active' | 'delayed' | 'paused' | 'complete'
  progress: number
  budget: number
  spent: number
  phase: string
  teamIds: string[]
  emails: Email[]
  messages: Message[]
  tasks: Task[]
  docs: Doc[]
}

export interface TeamMember {
  id: string
  name: string
  role: 'pm' | 'ss' | 'tl' | 'sub'
  av: string
  online: boolean
}

export interface Notification {
  id: string
  siteId: string
  type: string
  text: string
  time: string
  read: boolean
}

export interface EmailAnalysis {
  category: string
  priority: string
  summary: string
  action: string
  isInvoice: boolean
  amount?: number
  dueDate?: string
}
