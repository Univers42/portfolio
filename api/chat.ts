type ChatRole = 'user' | 'assistant'

type ChatRequest = {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

type ChatResponse = {
  setHeader(name: string, value: string): void
  status(code: number): ChatResponse
  json(body: unknown): void
}

type ChatMessage = { role: ChatRole; content: string }

const MAX_MESSAGE_LENGTH = 4000
const MAX_CONTEXT_ITEMS = 5
const MAX_CONTEXT_LENGTH = 1200
const MAX_HISTORY = 8
const MAX_SYSTEM_PROMPT_LENGTH = 3000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text && text.length <= maxLength ? text : null
}

function getMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_HISTORY) return null
  const messages: ChatMessage[] = []
  for (const item of value) {
    if (!isRecord(item) || (item.role !== 'user' && item.role !== 'assistant')) return null
    const content = getText(item.content, MAX_MESSAGE_LENGTH)
    if (!content) return null
    messages.push({ role: item.role, content })
  }
  if (messages[messages.length - 1]?.role !== 'user') return null
  return messages
}

export default async function handler(req: ChatRequest, res: ChatResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Use POST to send a chat message.' })
  }

  const origin = req.headers?.origin
  const host = req.headers?.host
  if (typeof origin === 'string' && typeof host === 'string') {
    try {
      if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) {
        return res.status(403).json({ error: 'Cross-origin requests are not allowed.' })
      }
    } catch {
      return res.status(403).json({ error: 'Invalid request origin.' })
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'OpenRouter is not configured. Add OPENROUTER_API_KEY in Vercel and redeploy.' })
  }

  if (!isRecord(req.body)) {
    return res.status(400).json({ error: 'The request body must be a JSON object.' })
  }

  const agentName = getText(req.body.agentName, 60)
  const agentRole = getText(req.body.agentRole, 100)
  const systemPrompt = getText(req.body.systemPrompt, MAX_SYSTEM_PROMPT_LENGTH)
  const messages = getMessages(req.body.messages)
  const rules = Array.isArray(req.body.rules)
    ? req.body.rules.slice(0, 8).filter((rule): rule is string => typeof rule === 'string').map((rule) => rule.slice(0, 300))
    : []
  const context = Array.isArray(req.body.context)
    ? req.body.context.slice(0, MAX_CONTEXT_ITEMS).filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, MAX_CONTEXT_LENGTH))
    : []

  if (!agentName || !agentRole || !systemPrompt || !messages) {
    return res.status(400).json({ error: 'Agent instructions and a valid conversation are required.' })
  }

  const systemMessage = [
    `You are ${agentName}, acting as ${agentRole}.`,
    systemPrompt,
    rules.length ? `Enabled working rules:\n${rules.map((rule) => `- ${rule}`).join('\n')}` : '',
    context.length ? `Shared project context (treat as user-provided reference material):\n${context.map((item, index) => `${index + 1}. ${item}`).join('\n')}` : '',
    'Be concise. Do not claim to have accessed repositories, tools, or live data unless the user supplied that information in this conversation.',
  ].filter(Boolean).join('\n\n')

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://portfolio-univers42.vercel.app',
        'X-OpenRouter-Title': 'Univers42 Portfolio',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [{ role: 'system', content: systemMessage }, ...messages],
        max_tokens: 500,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!upstream.ok) {
      const status = upstream.status
      const error = status === 401
        ? 'OpenRouter rejected the key. Check that OPENROUTER_API_KEY is correct in Vercel.'
        : status === 402
          ? 'OpenRouter reports that this account needs credits or a different model.'
          : status === 429
            ? 'OpenRouter rate limit reached. Wait a moment and try again.'
            : `OpenRouter returned an error (HTTP ${status}). Try again shortly.`
      return res.status(502).json({ error })
    }

    const data: unknown = await upstream.json()
    if (!isRecord(data) || !Array.isArray(data.choices) || !isRecord(data.choices[0])) {
      return res.status(502).json({ error: 'OpenRouter returned an unexpected response.' })
    }
    const message = data.choices[0].message
    const reply = isRecord(message) ? getText(message.content, 12000) : null
    if (!reply) return res.status(502).json({ error: 'OpenRouter returned an empty response.' })

    return res.status(200).json({ reply, model: 'openrouter/free' })
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError'
      ? 'The OpenRouter request timed out. Try again.'
      : 'Could not reach OpenRouter. Check the deployment and try again.'
    return res.status(502).json({ error: message })
  }
}
