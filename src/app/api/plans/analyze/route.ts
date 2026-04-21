import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, mediaType, siteId, planName } = body
    // mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf'

    const systemPrompt = `You are an expert architectural plan analyzer for construction sites. Analyze the uploaded plan image and extract structured information. Always respond with valid JSON only, no markdown.`

    const userPrompt = `Analyze this architectural/construction plan. Return JSON with this exact structure:
{
  "discipline": "architectural|structural|mechanical|electrical|plumbing|civil|landscape|site|routing|other",
  "planType": "floor_plan|elevation|section|site_plan|detail|schedule|roof_plan|foundation|structural_framing|mep|landscape|road_routing|pond|drainage|other",
  "title": "detected plan title or name",
  "scale": "detected scale e.g. 1:100",
  "revision": "revision number if visible",
  "date": "date on plan if visible",
  "level": "basement|ground|level_1|level_2|etc or null",
  "north": true or false (compass north arrow visible),
  "elements": [
    {"type": "wall|column|door|window|stair|lift|room|road|pipe|beam|foundation|pond|tree|parking|other", "description": "brief description", "estimatedCount": number or null}
  ],
  "rooms": [{"name": "room name", "estimatedArea": "area in m2 if readable"}],
  "keyDimensions": ["list of key dimensions visible e.g. 10m x 8m"],
  "notes": ["important notes or specifications visible"],
  "summary": "2-3 sentence professional summary of this plan",
  "confidence": 0.0 to 1.0
}`

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          { type: 'text', text: userPrompt },
        ],
      }],
      system: systemPrompt,
    })

    const text = response.content.map((b: Anthropic.ContentBlock) => b.type === 'text' ? b.text : '').join('')

    // Parse JSON - strip any markdown code fences
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    let analysis
    try {
      analysis = JSON.parse(cleaned)
    } catch {
      analysis = { discipline: 'other', planType: 'other', title: planName || 'Unknown', summary: text, confidence: 0.5, elements: [], rooms: [] }
    }

    return NextResponse.json({ analysis })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
