import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          {
            type: 'text',
            text: `Extract all hourly rates and task/trade information from this document. Return JSON only:
{
  "rates": [
    {"task": "task or trade name", "ratePerHour": number, "currency": "AUD", "notes": "any notes"}
  ],
  "personName": "name if visible",
  "company": "company if visible",
  "effectiveDate": "date if visible"
}`,
          },
        ],
      }],
    })

    const text = response.content.map((b: Anthropic.ContentBlock) => b.type === 'text' ? b.text : '').join('')
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    let extracted
    try {
      extracted = JSON.parse(cleaned)
    } catch {
      extracted = { rates: [], error: 'Could not extract rates' }
    }

    return NextResponse.json({ extracted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OCR failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
