import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export const maxDuration = 120

type FileData = {
  name: string
  type: string
  data: string // base64 for images, plain text for text files
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { files, planText, projectType, projectName } = body

    // Backwards-compat: old single-text API
    const inputFiles: FileData[] = files?.length
      ? files
      : planText
        ? [{ name: 'plan.txt', type: 'text/plain', data: planText }]
        : []

    if (!inputFiles.length) {
      return Response.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const imageFiles = inputFiles.filter(f => f.type.startsWith('image/')).slice(0, 20)
    const textFiles  = inputFiles.filter(f => !f.type.startsWith('image/'))

    const userContent: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = []

    if (imageFiles.length > 0) {
      userContent.push({
        type: 'text',
        text: `Voici ${imageFiles.length} plan(s) de construction à analyser ensemble. Analyse-les tous pour comprendre le projet dans sa globalité avant de générer le métré.`,
      })
      for (const img of imageFiles) {
        const mediaType = img.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: img.data },
        })
      }
    }

    let textContext = ''
    for (const tf of textFiles) {
      textContext += `\n[Fichier: ${tf.name}]\n${tf.data.slice(0, 6000)}\n`
    }
    if (textContext) {
      userContent.push({ type: 'text', text: `Contenu textuel des documents:\n${textContext}` })
    }

    const analysisPrompt = `Tu es un expert en métrés et quantitatifs pour la construction en France.

Projet : ${projectName || 'Non précisé'}
Type : ${projectType || 'Bâtiment résidentiel'}
Documents fournis : ${inputFiles.length} fichier(s) — ${imageFiles.length} image(s), ${textFiles.length} fichier(s) texte

Analyse l'ensemble de ces documents et extrais les quantités. Retourne UNIQUEMENT un JSON valide avec cette structure :
{
  "surfaces": {
    "shob": <m², 0 si inconnu>,
    "shon": <m², 0 si inconnu>,
    "plancher": <m², 0 si inconnu>,
    "facade": <m², 0 si inconnu>
  },
  "items": [
    {
      "description": "<description précise>",
      "category": "<Gros oeuvre|Plomberie|Électricité|Menuiserie|Peinture|Carrelage|VRD|Autre>",
      "unit": "<m²|m³|ml|u|tonne|forfait>",
      "quantity": <nombre>,
      "unitCost": <prix unitaire € marché français 2025>
    }
  ],
  "confidence": "<high|medium|low>",
  "notes": "<observations sur les plans>",
  "extractedInfo": {
    "levels": <niveaux détectés>,
    "logements": <logements si résidentiel>,
    "surface_totale": <m² estimé>
  }
}

Si les documents ne contiennent pas de données claires, génère des estimations typiques pour ce type de projet avec confidence "low".`

    userContent.push({ type: 'text', text: analysisPrompt })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "Impossible d'extraire les données JSON" }, { status: 500 })
    }

    return Response.json({ success: true, data: JSON.parse(jsonMatch[0]) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return Response.json({ error: message }, { status: 500 })
  }
}
