import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { system, user, maxTokens = 600 } = await req.json()

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const result = msg.content
    .map((b: Anthropic.ContentBlock) => (b.type === 'text' ? b.text : ''))
    .join('')
  return NextResponse.json({ result })
}
