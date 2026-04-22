import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY manquante — configure-la sur Vercel' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { message, systemPrompt, history } = await req.json()

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message vide' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        ...(history ?? []),
        { role: 'user', content: message },
      ],
    })

    const encoder = new TextEncoder()
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of stream.textStream) {
            controller.enqueue(encoder.encode(text))
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    console.error('JARVIS error:', err)
    return new Response(
      JSON.stringify({ error: err?.message ?? 'Erreur système JARVIS' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
