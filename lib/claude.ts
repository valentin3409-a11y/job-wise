import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function askClaude(prompt: string, maxTokens = 1500): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}

export async function askClaudeJSON<T>(prompt: string, maxTokens = 1500): Promise<T> {
  const text = await askClaude(prompt, maxTokens)
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/)
    if (match) return JSON.parse(match[0]) as T
    throw new Error(`Claude returned invalid JSON. Raw: ${cleaned.substring(0, 200)}`)
  }
}
