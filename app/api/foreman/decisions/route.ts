import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { issue, projectContext } = await req.json()
    if (!issue?.trim()) return Response.json({ error: 'Issue required' }, { status: 400 })

    const prompt = `Tu es un expert en management de projets de construction BTP en France avec 30 ans d'expérience.

CONTEXTE PROJET :
${JSON.stringify(projectContext, null, 2)}

PROBLÈME DÉTECTÉ : ${issue}

Génère une analyse décisionnelle complète. Retourne UNIQUEMENT un JSON valide :
{
  "issue": "<résumé concis du problème>",
  "severity": "<critical|high|medium>",
  "financialExposure": <montant en € d'exposition financière>,
  "options": [
    {
      "id": "A",
      "title": "<titre court>",
      "description": "<description concrète de l'action à mener>",
      "costImpact": <impact en €, négatif = surcoût>,
      "timeImpact": <impact en jours, négatif = retard>,
      "riskLevel": "<low|medium|high>",
      "marginImpact": <impact sur la marge en points de %, peut être négatif>,
      "pros": ["<avantage 1>", "<avantage 2>"],
      "cons": ["<inconvénient 1>", "<inconvénient 2>"],
      "effort": "<low|medium|high>",
      "timeToExecute": "<délai d'exécution ex: 48h>"
    },
    { "id": "B", ... },
    { "id": "C", ... }
  ],
  "recommendation": "A",
  "recommendationReason": "<explication claire pourquoi cette option est la meilleure — sois direct, ne sois jamais neutre>",
  "urgency": "<immediate|today|this_week>",
  "nextSteps": ["<action concrète 1>", "<action concrète 2>", "<action concrète 3>"]
}

Règles : Ne sois jamais neutre. Toujours recommander la meilleure option. Penser comme un directeur travaux responsable de la marge. Chiffrer TOUJOURS les impacts financiers.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return Response.json({ error: 'Pas de JSON trouvé' }, { status: 500 })

    return Response.json({ success: true, data: JSON.parse(jsonMatch[0]) })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
