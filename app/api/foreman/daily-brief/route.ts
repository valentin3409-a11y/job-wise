import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { projectContext, date } = await req.json()

    const prompt = `Tu es FOREMAN AI, le co-pilote IA d'un directeur travaux BTP expérimenté.

ÉTAT DU PROJET aujourd'hui ${date || new Date().toLocaleDateString('fr-FR')} :
${JSON.stringify(projectContext, null, 2)}

Génère le BRIEFING QUOTIDIEN du directeur travaux. Sois direct, précis, sans langue de bois.
Retourne UNIQUEMENT un JSON valide :
{
  "mood": "<critical|warning|stable|good>",
  "headline": "<phrase d'accroche de la situation du jour, max 80 chars>",
  "financialStatus": "<analyse financière en 1-2 phrases: marge, tendance, alerte>",
  "topPriorities": [
    {
      "rank": 1,
      "text": "<action concrète à mener aujourd'hui>",
      "urgency": "<critical|high|medium>",
      "category": "<financial|delay|safety|quality|team>",
      "impact": "<impact chiffré si possible>"
    },
    { "rank": 2, ... },
    { "rank": 3, ... }
  ],
  "risks": [
    {
      "description": "<risque identifié>",
      "probability": "<high|medium|low>",
      "financialImpact": <montant estimé en €>
    }
  ],
  "opportunity": "<1 opportunité concrète d'améliorer la marge ou le planning>",
  "blockers": ["<blocage 1>", "<blocage 2>"],
  "weatherImpact": "<impact météo si pertinent>",
  "advice": "<conseil du jour — direct et actionnable>"
}

Règles : Pense comme un directeur travaux responsable de la rentabilité. Chiffre tout ce que tu peux. Sois direct.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return Response.json({ error: 'Pas de JSON' }, { status: 500 })

    return Response.json({ success: true, data: JSON.parse(jsonMatch[0]) })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
