export async function callAI(system: string, user: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'AI call failed')
  return data.result as string
}
