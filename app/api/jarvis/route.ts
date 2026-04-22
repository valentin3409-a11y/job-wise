import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { message, systemPrompt, history } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const messages: Anthropic.MessageParam[] = [
      ...(history || []),
      { role: 'user', content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const block = response.content[0]
    const text = block.type === 'text' ? block.text : ''

    return NextResponse.json({ response: text })
  } catch (err) {
    console.error('JARVIS API error:', err)
    return NextResponse.json({ error: 'JARVIS system failure' }, { status: 500 })
  }
}
