import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { planAnalysis, scope, siteId } = await req.json()

    const systemPrompt = `You are a senior quantity surveyor for construction projects in Australia. Generate detailed, accurate quantity takeoffs based on plan analysis. Respond with valid JSON only.`

    const userPrompt = `Based on this plan analysis and work scope, generate a complete quantity takeoff.

Plan: ${JSON.stringify(planAnalysis)}
Scope of work: ${scope || 'General construction as shown on plan'}

Return JSON:
{
  "materials": [
    {
      "id": "unique_id",
      "category": "concrete|steel|formwork|masonry|timber|insulation|waterproofing|finishes|mep|earthworks|landscaping|other",
      "name": "material name",
      "specification": "spec details e.g. 32MPa concrete, N20 bars",
      "unit": "m3|m2|lm|kg|tonne|each|set|ls",
      "quantity": number,
      "wastagePercent": number (typically 5-15),
      "totalWithWastage": number,
      "estimatedUnitRate": number (AUD),
      "estimatedTotal": number (AUD),
      "notes": "optional notes"
    }
  ],
  "labour": [
    {
      "trade": "concretor|steel_fixer|carpenter|bricklayer|plumber|electrician|laborer|supervisor|other",
      "description": "task description",
      "unit": "hr|day|ls|m2|m3",
      "quantity": number,
      "estimatedRate": number (AUD per unit),
      "estimatedTotal": number (AUD)
    }
  ],
  "subtotalMaterials": number,
  "subtotalLabour": number,
  "subtotal": number,
  "contingency": number (10% of subtotal),
  "total": number,
  "currency": "AUD",
  "notes": "important assumptions or exclusions"
}`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = msg.content.map((b: Anthropic.ContentBlock) => b.type === 'text' ? b.text : '').join('')
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    let takeoff
    try {
      takeoff = JSON.parse(cleaned)
    } catch {
      takeoff = { materials: [], labour: [], subtotal: 0, total: 0, error: 'Parse failed' }
    }

    return NextResponse.json({ takeoff })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Takeoff failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
