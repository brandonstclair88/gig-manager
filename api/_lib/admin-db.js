/**
 * Server-only Supabase access using the service-role key, for jobs with no
 * signed-in user (Stripe webhook, weekly backup). Never import from src/.
 */
const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export function adminConfigured() { return Boolean(URL && KEY) }

export async function adminRest(path, { method = 'GET', body, prefer } = {}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`Supabase ${method} ${path}: ${r.status} ${text}`)
  return text ? JSON.parse(text) : null
}
