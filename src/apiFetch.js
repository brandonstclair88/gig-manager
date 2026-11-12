import { supabase } from './supabase'

/**
 * fetch() for the dashboard's /api routes. Attaches the signed-in user's
 * Supabase access token so the server can confirm it is the owner.
 */
export async function apiFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
}
