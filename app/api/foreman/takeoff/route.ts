import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { planText, projectType, projectName } = await req.json()

    if (!planText?.trim()) {
      return Response.json({ error: 'Aucun contenu de plan fourni' }, { status: 400 })
    }

    const prompt = `Tu es un expert en métrés et quantitatifs pour la construction en France.

Voici le contenu extrait d'un plan de construction :
"""
${planText.slice(0, 8000)}
"""

Projet : ${projectName || 'Non précisé'}
Type : ${projectType || 'Bâtiment résidentiel'}

Analyse ce document et extrais les quantités. Retourne UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "surfaces": {
    "shob": <surface hors oeuvre brute en m², 0 si inconnue>,
    "shon": <surface hors oeuvre nette en m², 0 si inconnue>,
    "plancher": <surface de plancher en m², 0 si inconnue>,
    "facade": <surface façades en m², 0 si inconnue>
  },
  "items": [
    {
      "description": "<description précise>",
      "category": "<Gros oeuvre|Plomberie|Électricité|Menuiserie|Peinture|Carrelage|VRD|Autre>",
      "unit": "<m²|m³|ml|u|tonne|forfait>",
      "quantity": <nombre>,
      "unitCost": <prix unitaire estimé en € selon marché français 2025>
    }
  ],
  "confidence": "<high|medium|low>",
  "notes": "<observations importantes sur le plan>",
  "extractedInfo": {
    "levels": <nombre de niveaux détectés>,
    "logements": <nombre de logements si résidentiel>,
    "surface_totale": <estimation surface totale>
  }
}

Si le texte ne contient pas de données de plan claires, génère des estimations typiques pour le type de projet avec une confidence "low".`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Impossible d\'extraire les données' }, { status: 500 })
    }

    const data = JSON.parse(jsonMatch[0])
    return Response.json({ success: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return Response.json({ error: message }, { status: 500 })
  }
}
