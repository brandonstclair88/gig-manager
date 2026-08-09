/**
 * Unit tests for the money and sales-order rollups.
 *
 *     npm test
 *
 * `npm run check` is static analysis — it proves the code parses and every
 * identifier resolves, and nothing more. These tests actually execute the
 * arithmetic that decides what Paige sees on the Finance page. They caught a
 * bug on their first run: salesSummary counted cancellations from the
 * unarchived gigs only, and since a canceled booking is almost always archived
 * at the same moment, it reported zero every time.
 *
 * utils.js and salesOrder.js are deliberately free of React and browser APIs
 * so they can run under plain Node. The only obstacle is that the app imports
 * './utils' without a file extension — Vite resolves that, Node does not — so
 * the two modules are copied to a temp directory with the extension added.
 * That is a build-tool difference, not a change to the logic under test.
 */

import { mkdtempSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const dir = mkdtempSync(join(tmpdir(), 'gm-test-'))

copyFileSync(join(SRC, 'utils.js'), join(dir, 'utils.js'))
writeFileSync(
  join(dir, 'salesOrder.js'),
  readFileSync(join(SRC, 'salesOrder.js'), 'utf8').replace("from './utils'", "from './utils.js'")
)

const { byLeadSource, byEventCategory, salesSummary, gigHourlyRate, isComp, UNRECORDED } =
  await import(pathToFileURL(join(dir, 'salesOrder.js')).href)
const { reportableGigs, isCanceledGig } =
  await import(pathToFileURL(join(dir, 'utils.js')).href)

rmSync(dir, { recursive: true, force: true })

let pass = 0, fail = 0
const is = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  ok ? pass++ : fail++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}`)
  if (!ok) console.log(`      got  ${JSON.stringify(actual)}\n      want ${JSON.stringify(expected)}`)
}

const G = o => ({ duration_hours: 1, fee: 0, paid: 0, ...o })

const gigs = [
  G({ id: 1, fee: 500, paid: 500, duration_hours: 2, lead_source: 'Website',         event_category: 'Wedding',       performance_type: 'One-time' }),
  G({ id: 2, fee: 300, paid: 300, duration_hours: 1, lead_source: 'Website',         event_category: 'Wedding',       performance_type: 'One-time' }),
  G({ id: 3, fee: 0,   paid: 0,   duration_hours: 2, lead_source: 'Promo offer',     event_category: 'Community',     performance_type: 'Promotional' }),
  G({ id: 4, fee: 150, paid: 150, duration_hours: 1, lead_source: 'Return customer', event_category: 'Senior living', performance_type: 'Recurring' }),
  G({ id: 5, fee: 100, paid: 0,   duration_hours: 1, lead_source: 'Return customer', event_category: 'Fundraiser',    performance_type: 'Canceled', archived: true }),
  G({ id: 6, fee: 900, paid: 900, duration_hours: 3, lead_source: 'Website',         event_category: 'Wedding',       performance_type: 'One-time', archived: true }),
  G({ id: 7, fee: 400, paid: 400, duration_hours: 2 }), // a row that predates these fields
]

console.log('\nexclusion rules')
is('canceled gig is detected', isCanceledGig(gigs[4]), true)
is('reportable drops archived and canceled', reportableGigs(gigs).map(g => g.id), [1, 2, 3, 4, 7])
is('a comp is $0 AND promotional, not merely unpaid', [isComp(gigs[2]), isComp(gigs[4])], [true, false])

console.log('\nhourly rate')
is('$500 over 2 hours is $250/hr', gigHourlyRate(gigs[0]), 250)
is('a comp is a real $0/hr', gigHourlyRate(gigs[2]), 0)
is('no hours recorded is null, not zero', gigHourlyRate({ fee: 500, duration_hours: 0 }), null)

console.log('\nlead source rollup')
const ls = byLeadSource(gigs)
is('sorted by collected, descending', ls.map(r => r.key), ['Website', 'Return customer', 'Promo offer', UNRECORDED])
is('collected excludes the archived Website gig', [ls[0].gigs, ls[0].paid], [2, 800])
is('average rate is $800 over 3 billed hours', +ls[0].avgRate.toFixed(2), 266.67)
is('canceled gig leaves Return customer at one', [ls[1].gigs, ls[1].paid], [1, 150])
is('a comp counts as a comp and does not drag the rate', [ls[2].comps, ls[2].avgRate], [1, null])
is('unrecorded sinks below every real source', ls[3].key, UNRECORDED)

console.log('\ncategory rollup')
is('grouped and ranked by collected', byEventCategory(gigs).map(r => r.key), ['Wedding', 'Senior living', 'Community', UNRECORDED])

console.log('\nsummary')
const s = salesSummary(gigs)
is('total collected', s.paid, 1350)
is('cancellations counted even though archived', s.canceled, 1)
is('coverage is 4 sources across 5 reportable gigs', [s.recorded, s.gigs, +s.coverage.toFixed(2)], [4, 5, 0.8])

console.log('\nedge cases')
is('empty array', byLeadSource([]), [])
is('null input does not throw', byLeadSource(null), [])
is('coverage of nothing is 0, not NaN', salesSummary([]).coverage, 0)

console.log(`\n${fail ? '❌ FAILED' : '✅ All passed'} — ${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
