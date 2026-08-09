/**
 * The account that owns this site's data.
 *
 * Anonymous visitors on the public site need to stamp an owner onto the rows
 * they create (inquiries, testimonials), but they cannot look one up: row
 * level security hides `gigs` from them entirely, and reading "any row from
 * some other table" returns whichever account happens to come first — which
 * is how inquiries ended up filed under a different user and vanished from
 * the dashboard.
 *
 * So the owner is configured explicitly rather than inferred. This is a user
 * id, not a credential: it grants nothing on its own, because every table is
 * still governed by row level security.
 */
export const OWNER_USER_ID = import.meta.env.VITE_OWNER_USER_ID || ''

/** True when the app is configured well enough to accept public submissions. */
export function hasOwner() {
  return /^[0-9a-f-]{36}$/i.test(OWNER_USER_ID)
}
