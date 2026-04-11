import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { askClaudeJSON } from '@/lib/claude'
import { PROMPTS } from '@/lib/prompts'
import { JobListing } from '@/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, country, city, level, cvText } = await req.json()
    if (!title || !cvText) {
      return NextResponse.json({ error: 'title and cvText are required' }, { status: 400 })
    }

    const jobs = await askClaudeJSON<JobListing[]>(
      PROMPTS.searchJobs(title, country || 'France', city || '', level || 'senior', cvText.substring(0, 400)),
      2000
    )

    // Validate and sanitize
    const validJobs = (Array.isArray(jobs) ? jobs : []).map((j, idx) => ({
      id: j.id || idx + 1,
      title: j.title || title,
      company: j.company || 'Entreprise',
      location: j.location || city || country || '',
      salary: j.salary || '',
      type: j.type || 'CDI',
      source: j.source || 'LinkedIn',
      posted: j.posted || 'Récent',
      description: j.description || '',
      requirements: Array.isArray(j.requirements) ? j.requirements : [],
      score: Math.min(100, Math.max(0, Number(j.score) || 70)),
    }))

    return NextResponse.json({ jobs: validJobs })
  } catch (err: any) {
    console.error('Search error:', err)
    return NextResponse.json({ error: err.message || 'Search failed' }, { status: 500 })
  }
}
