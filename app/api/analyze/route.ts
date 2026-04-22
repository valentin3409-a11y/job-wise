import { NextRequest, NextResponse } from 'next/server'
import { askClaude, askClaudeJSON } from '@/lib/claude'
import { PROMPTS } from '@/lib/prompts'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const {
      cvText, jobTitle, company, location, salary,
      jobType, source, jobDescription, lang = 'fr', country = 'France',
    } = await req.json()

    if (!cvText || !jobDescription) {
      return NextResponse.json({ error: 'cvText and jobDescription are required' }, { status: 400 })
    }

    const jdText = `${jobTitle} — ${company} (${location})\n${jobDescription}`

    // Run all prompts in parallel
    const [match, bullets, coverLetter, linkedinMessages, screeningQA] = await Promise.all([
      askClaudeJSON(PROMPTS.matchScore(cvText, jdText, lang)),
      askClaudeJSON(PROMPTS.tailorCV(cvText, jdText, lang)),
      askClaude(PROMPTS.coverLetter(cvText, jdText, lang, country), 1200),
      askClaudeJSON(PROMPTS.linkedinMessages(cvText, jdText, lang)),
      askClaudeJSON(PROMPTS.screeningQA(cvText, jdText, lang)),
    ])

    return NextResponse.json({
      match,
      tailored_bullets:  bullets,
      cover_letter:      coverLetter,
      linkedin_messages: linkedinMessages,
      screening_qa:      screeningQA,
    })
  } catch (err: any) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: err.message || 'Analysis failed' }, { status: 500 })
  }
}
