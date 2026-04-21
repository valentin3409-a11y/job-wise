import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const HEADS = [
  {
    id: 'technical',
    name: 'Technical Expert',
    emoji: '⚙️',
    color: '#3B82F6',
    system: 'You are a senior structural/civil engineer with 20+ years on major construction sites. Analyze from a technical engineering perspective: safety, structural integrity, methodology, sequencing, compliance. Be precise, practical, concise. Max 120 words.',
  },
  {
    id: 'commercial',
    name: 'Commercial Lead',
    emoji: '💰',
    color: '#F59E0B',
    system: 'You are a construction commercial manager expert in cost control, contracts, procurement and risk. Analyze from cost, budget, schedule and contract perspective. Be specific with numbers when possible. Max 120 words.',
  },
  {
    id: 'risk',
    name: 'Risk & Safety',
    emoji: '🛡️',
    color: '#8B5CF6',
    system: 'You are a WHS/Safety and risk management specialist for construction. Analyze from safety, risk, compliance and hazard perspective. Identify the top risks and mitigation. Be direct and action-oriented. Max 120 words.',
  },
]

export async function POST(req: NextRequest) {
  try {
    const { question, context } = await req.json()

    const userMsg = context ? `Context: ${context}\n\nQuestion: ${question}` : question

    // Call all 3 in parallel
    const responses = await Promise.all(
      HEADS.map(head =>
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: head.system,
          messages: [{ role: 'user', content: userMsg }],
        }).then(msg => ({
          ...head,
          response: msg.content.map((b: Anthropic.ContentBlock) => b.type === 'text' ? b.text : '').join(''),
        }))
      )
    )

    // Synthesis
    const synthMsg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 250,
      system: 'You are a senior project director. Synthesize the 3 expert opinions into a single clear recommendation. Be decisive. Max 100 words.',
      messages: [{
        role: 'user',
        content: `Question: ${question}\n\nTechnical: ${responses[0].response}\n\nCommercial: ${responses[1].response}\n\nRisk: ${responses[2].response}\n\nSynthesize into one clear recommendation.`
      }],
    })

    const synthesis = synthMsg.content.map((b: Anthropic.ContentBlock) => b.type === 'text' ? b.text : '').join('')

    return NextResponse.json({ heads: responses, synthesis })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Multi-AI failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
