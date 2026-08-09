-- ============================================================================
--  Contract signing for anonymous clients
--  Run once in the Supabase SQL Editor.
-- ============================================================================
--
--  The problem
--  -----------
--  SignPage read the gig directly with the anonymous key. Row level security
--  correctly refuses that, so every client who opened a contract link saw
--  "Contract not found." It only appeared to work for the account owner,
--  whose browser carries a session.
--
--  Why not simply allow anonymous reads of `gigs`
--  ----------------------------------------------
--  Because the anon key is embedded in the public JavaScript bundle. A policy
--  permitting anonymous SELECT would expose every fee, client email, venue
--  address and payment record to anyone who opened dev tools.
--
--  The approach
--  ------------
--  `gigs` stays locked. Two SECURITY DEFINER functions run with the owner's
--  privileges and expose exactly two capabilities, each keyed on a random
--  per-contract token rather than the gig id:
--
--    get_contract(token)          read the contract fields, nothing else
--    sign_contract(token, name)   set the signature once, and only once
--
--  Everything is idempotent; running it twice is harmless.
-- ============================================================================


-- ── 1. Per-contract token ───────────────────────────────────────────────────
-- A separate secret from the gig id, which appears in dashboard URLs and may
-- be shared or logged. Rotating a token invalidates one contract link without
-- touching anything else.

alter table public.gigs
  add column if not exists contract_token uuid;

update public.gigs
   set contract_token = gen_random_uuid()
 where contract_token is null;

alter table public.gigs
  alter column contract_token set default gen_random_uuid();

alter table public.gigs
  alter column contract_token set not null;

create unique index if not exists gigs_contract_token_key
  on public.gigs (contract_token);


-- ── 2. Read a contract ──────────────────────────────────────────────────────
-- Returns an allowlisted subset as jsonb. Building the allowlist by removing
-- unlisted keys (rather than naming columns in a RETURNS TABLE clause) means
-- the function neither breaks if a column is missing, nor silently starts
-- leaking a column added to `gigs` later.

create or replace function public.get_contract(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  contract jsonb;
  allowed  text[] := array[
    'id', 'title', 'client', 'client_email',
    'venue', 'venue_address', 'date', 'time', 'duration_hours',
    'fee', 'deposit', 'bride_name', 'groom_name',
    'signed_by', 'signed_at', 'performer_signature', 'performer_signed_at'
  ];
  k text;
begin
  select to_jsonb(g) into contract
    from public.gigs g
   where g.contract_token = p_token;

  if contract is null then
    return null;                       -- unknown token: reveal nothing
  end if;

  for k in select jsonb_object_keys(contract) loop
    if not (k = any(allowed)) then
      contract := contract - k;
    end if;
  end loop;

  return contract;
end;
$$;


-- ── 3. Sign a contract ──────────────────────────────────────────────────────
-- The only write anonymous visitors can make. `signed_at is null` in the WHERE
-- clause makes it one-way: a signature cannot be overwritten or replaced, so
-- nobody can alter an executed agreement by replaying the link.

create or replace function public.sign_contract(p_token uuid, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  signed_id uuid;
begin
  if p_name is null or btrim(p_name) = '' then
    return jsonb_build_object('ok', false, 'reason', 'name_required');
  end if;

  update public.gigs
     set signed_by       = btrim(p_name),
         signed_at       = now(),
         contract_status = 'signed'
   where contract_token = p_token
     and signed_at is null
  returning id into signed_id;

  if signed_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found_or_already_signed');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;


-- ── 4. Grants ───────────────────────────────────────────────────────────────
-- Anonymous visitors may execute these two functions and nothing else. The
-- `gigs` table itself remains unreadable to them.

revoke all on function public.get_contract(uuid)        from public;
revoke all on function public.sign_contract(uuid, text) from public;

grant execute on function public.get_contract(uuid)        to anon, authenticated;
grant execute on function public.sign_contract(uuid, text) to anon, authenticated;


-- ── 5. Check your work ──────────────────────────────────────────────────────
-- Should return one row per gig, each with a distinct token.
--
--   select id, title, contract_token from public.gigs order by date desc;
--
-- Paste a token in below; it should return the contract fields and nothing
-- else — no paid, no notes, no user_id.
--
--   select public.get_contract('paste-a-token-here');
