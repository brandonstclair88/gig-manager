import { reportableGigs, isCanceledGig, gigFee, gigPaid } from './utils'

/* ──────────────────────────────────────────────────────────────
   Sales order vocabulary and reporting.

   These three fields replace the "Sales orders" tab of the old
   spreadsheet. They are plain text columns on gigs, not enums —
   the lists below are the source of truth for the dropdowns, and
   anything already in the database that isn't on a list still
   reports correctly (it just sorts to the end).
   ────────────────────────────────────────────────────────────── */

/** Spreadsheet column: "Sales platform". */
export const LEAD_SOURCES = [
  'Website',
  'Word of mouth',
  'Return customer',
  'Cold outreach',
  'Promo offer',
  'Social media',
  'Family / friend',
  'Other',
]

/** Split out of the old "Client" column, which mixed venues with event kinds. */
export const EVENT_CATEGORIES = [
  'Wedding',
  'Funeral',
  'Senior living',
  'Fundraiser',
  'Corporate',
  'Community',
  'Private party',
  'Other',
]

/** Spreadsheet column: "Preformance type", minus the wedding-role values. */
export const PERFORMANCE_TYPES = [
  'One-time',
  'Recurring',
  'Annual',
  'Promotional',
  'Canceled',
]

/**
 * Shown wherever a gig predates these fields. Kept distinct from 'Other',
 * which is a choice Paige made — this is the absence of one.
 */
export const UNRECORDED = 'Not recorded'

export function leadSource(g)    { return g?.lead_source    || UNRECORDED }
export function eventCategory(g) { return g?.event_category || UNRECORDED }
export function performanceType(g) { return g?.performance_type || 'One-time' }

export function gigHours(g) {
  const h = Number(g?.duration_hours ?? 0)
  return Number.isFinite(h) && h > 0 ? h : 0
}

/**
 * Booked rate per hour. Uses fee, not paid: this answers "what do I charge",
 * which is a pricing question, not a collections one.
 *
 * Returns null rather than 0 when it can't be computed, so callers can tell
 * "no hours recorded" apart from "played for free" — a comp is a real $0/hr
 * and belongs in the comp count, not dragging down an average rate.
 */
export function gigHourlyRate(g) {
  const hours = gigHours(g)
  if (!hours) return null
  return gigFee(g) / hours
}

/** A comp is a gig deliberately performed for nothing, not an unpaid invoice. */
export function isComp(g) {
  return gigFee(g) === 0 && performanceType(g) === 'Promotional'
}

/**
 * Canceled bookings are history, not pipeline. The predicate itself lives in
 * utils.js alongside the rest of the money model; re-exported here so the
 * sales-order code reads in one vocabulary.
 */
export const isCanceled = isCanceledGig

function blankGroup(key) {
  return {
    key,
    gigs: 0,
    fee: 0,
    paid: 0,
    hours: 0,
    comps: 0,
    compHours: 0,
    // Rate is averaged over billed work only — see gigHourlyRate.
    billedFee: 0,
    billedHours: 0,
  }
}

function addToGroup(group, g) {
  group.gigs++
  group.fee += gigFee(g)
  group.paid += gigPaid(g)
  group.hours += gigHours(g)
  if (isComp(g)) {
    group.comps++
    group.compHours += gigHours(g)
  } else if (gigFee(g) > 0 && gigHours(g) > 0) {
    group.billedFee += gigFee(g)
    group.billedHours += gigHours(g)
  }
}

function finishGroup(group) {
  group.avgRate = group.billedHours > 0 ? group.billedFee / group.billedHours : null
  return group
}

/**
 * Group gigs by one of the sales-order fields.
 *
 * Archived and canceled gigs are excluded. Archived gigs are excluded
 * everywhere else in the app for the same reason — they are records, not
 * activity — and counting a canceled booking as a lead-source win would
 * make the worst channels look like the best ones.
 */
export function groupBy(gigs, pick) {
  const live = reportableGigs(gigs)
  const map = new Map()
  for (const g of live) {
    const key = pick(g)
    if (!map.has(key)) map.set(key, blankGroup(key))
    addToGroup(map.get(key), g)
  }
  return [...map.values()]
    .map(finishGroup)
    // Collected revenue first — that's the question this table answers.
    // "Not recorded" sinks to the bottom regardless of size; it isn't a
    // channel and shouldn't sit at the top of a channel ranking.
    .sort((a, b) => {
      if (a.key === UNRECORDED) return 1
      if (b.key === UNRECORDED) return -1
      return b.paid - a.paid
    })
}

export function byLeadSource(gigs)    { return groupBy(gigs, leadSource) }
export function byEventCategory(gigs) { return groupBy(gigs, eventCategory) }

/** Headline numbers for the sales panel. */
export function salesSummary(gigs) {
  const live = reportableGigs(gigs)
  const total = blankGroup('all')
  for (const g of live) addToGroup(total, g)
  finishGroup(total)

  // Counted across every gig, not just the unarchived ones: cancellations are
  // routinely archived at the same time they're canceled, so filtering to
  // active rows first reported "0 canceled" no matter how many there were.
  const canceled = (gigs || []).filter(isCanceled)
  const recorded = live.filter(g => g.lead_source).length

  return {
    ...total,
    canceled: canceled.length,
    // How much of the history actually carries a lead source. Without this
    // the channel table looks authoritative when it might cover a third
    // of the bookings.
    recorded,
    coverage: live.length ? recorded / live.length : 0,
  }
}
