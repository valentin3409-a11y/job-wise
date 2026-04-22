export type Lang = 'fr' | 'en'
export type AppStatus = 'draft' | 'applied' | 'interview' | 'offer' | 'rejected'

export interface JobListing {
  id: number
  title: string
  company: string
  location: string
  salary?: string
  type: string
  source: string
  posted: string
  description: string
  requirements: string[]
  score: number
}

export interface MatchResult {
  score: number
  strengths: string[]
  gaps: string[]
  deal_breakers: string[]
  honest_summary: string
}

export interface TailoredBullet {
  original: string
  revised: string
  reason: string
}

export interface LinkedInMessage {
  label: string
  text: string
}

export interface ScreeningQA {
  question: string
  answer: string
}

export interface AIOutputs {
  match: MatchResult
  tailored_bullets: TailoredBullet[]
  cover_letter: string
  linkedin_messages: LinkedInMessage[]
  screening_qa: ScreeningQA[]
}

export interface BatchItem extends JobListing {
  status: 'pending' | 'analyzing' | 'ready' | 'error'
  approved: boolean
  rejected: boolean
  match?: MatchResult
  cover?: string
  bullets?: TailoredBullet[]
  linkedin?: LinkedInMessage[]
  qa?: ScreeningQA[]
  applicationId?: string
}
