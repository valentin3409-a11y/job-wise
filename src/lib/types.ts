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

export interface PlanAnalysisResult {
  discipline: string
  planType: string
  title: string
  scale?: string
  revision?: string
  date?: string
  level?: string
  north?: boolean
  elements: Array<{ type: string; description: string; estimatedCount?: number }>
  rooms: Array<{ name: string; estimatedArea?: string }>
  keyDimensions: string[]
  notes: string[]
  summary: string
  confidence: number
}

export interface Plan {
  id: string
  siteId: string
  name: string
  discipline: string
  planType: string
  category: string
  uploadDate: string
  uploadedBy: string
  imageBase64?: string
  mediaType?: string
  analysis?: PlanAnalysisResult
  duplicateOf?: string
  isDuplicate?: boolean
  revision?: string
  title?: string
}

export interface Material {
  id: string
  category: string
  name: string
  specification: string
  unit: string
  quantity: number
  wastagePercent: number
  totalWithWastage: number
  estimatedUnitRate?: number
  estimatedTotal?: number
  notes?: string
}

export interface LabourItem {
  trade: string
  description: string
  unit: string
  quantity: number
  estimatedRate: number
  estimatedTotal: number
}

export interface Takeoff {
  id: string
  siteId: string
  planId?: string
  planName?: string
  scope: string
  date: string
  materials: Material[]
  labour: LabourItem[]
  subtotalMaterials: number
  subtotalLabour: number
  subtotal: number
  contingency: number
  total: number
  currency: string
  notes?: string
}

export interface WorkerRate {
  userId: string
  task: string
  ratePerHour: number
  currency: string
  effectiveDate?: string
  notes?: string
}

export interface MultiAIHead {
  id: string
  name: string
  emoji: string
  color: string
  response: string
}

export interface MultiAIResponse {
  heads: MultiAIHead[]
  synthesis: string
}
