-- ════════════════════════════════════════════════════════════════
-- Sales order fields on gigs
--
-- Replaces the "Sales orders" tab of PC records.xlsx. A sales order
-- row and a gig row are the same thing — one performance, one date,
-- one price — so these are columns on gigs rather than a second table.
-- Logging a gig now records the sale; there is nothing to keep in sync.
--
-- The spreadsheet's "# of hrs" already exists as gigs.duration_hours, so
-- only three of its columns are genuinely new: lead_source, event_category
-- and performance_type.
--
-- No change is needed to contract-signing.sql. get_contract() builds its
-- response by removing unlisted keys from the row, so columns added here are
-- invisible to anonymous visitors by default rather than leaking on sight.
--
-- Safe to run more than once.
-- Run this in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- Where the booking came from. The spreadsheet called this "Sales platform".
-- Left NULL on existing rows: the app shows "Not recorded" rather than
-- inventing a channel, because a guessed lead source would quietly
-- corrupt the very report this column exists to produce.
alter table public.gigs add column if not exists lead_source text;

-- What kind of event it was. The spreadsheet packed this into the "Client"
-- column, which is why "Bride" appeared twenty times where a client name
-- belonged. Client now holds a real name; the kind of event lives here.
alter table public.gigs add column if not exists event_category text;

-- Booking cadence: One-time / Recurring / Annual / Promotional / Canceled.
alter table public.gigs add column if not exists performance_type text;

-- 'One-time' is the neutral default and the same value the form defaults to,
-- so backfilling it asserts nothing that the UI wouldn't have.
update public.gigs set performance_type = 'One-time' where performance_type is null;

-- Marks rows that came from a bulk import rather than from the app. Exists so
-- the historical import can be re-run after a correction without doubling the
-- history, and so imported rows can be told apart from Paige's own entries if
-- one of the mapping decisions later turns out to be wrong. NULL for anything
-- created through the dashboard.
alter table public.gigs add column if not exists import_tag text;
create index if not exists gigs_import_tag_idx on public.gigs (import_tag);

-- Inquiries carry the source too, so it survives the conversion to a gig.
-- Without this, a lead's origin is lost at exactly the moment it becomes
-- revenue — which is the only moment the channel report cares about.
-- Not backfilled. Existing inquiries could have come from the public form or
-- from the dashboard's own Add Inquiry button, and there is no way to tell
-- them apart after the fact.
alter table public.inquiries add column if not exists lead_source text;

-- These columns are filtered and grouped on every Finance page load.
create index if not exists gigs_lead_source_idx    on public.gigs (user_id, lead_source);
create index if not exists gigs_event_category_idx on public.gigs (user_id, event_category);

-- Deliberately no CHECK constraints. The vocabularies are enforced by the
-- dropdowns in GigModal; a database constraint would mean a migration every
-- time Paige books a kind of event she hasn't booked before, and a failed
-- save with a Postgres error string in an alert() box is a poor way to
-- find that out.

-- ── Verify ──────────────────────────────────────────────────────
-- select column_name, data_type
--   from information_schema.columns
--  where table_name = 'gigs'
--    and column_name in ('lead_source', 'event_category', 'performance_type');
