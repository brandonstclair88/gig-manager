# Replacing the Sales Orders spreadsheet

The `Sales orders` tab of `PC records.xlsx` is now part of the app. After the
two steps below you don't need to open the spreadsheet again — keep the file
somewhere safe as an archive, but stop editing it, or the two will drift.

## What to run

Both of these go in the **Supabase SQL Editor** (Supabase → SQL Editor → New
query → paste → Run). Not a terminal.

**Step 1 — `sales-orders.sql`**
Adds the new columns. Takes a second, changes no existing data apart from
setting every gig's booking type to "One-time", which is what the form would
have defaulted to anyway.

**Step 2 — `import-sales-orders.sql`**
Loads all 79 historical bookings, October 2021 through October 2026.

Run them in that order. Both are safe to run twice — step 2 deletes anything a
previous run of itself inserted before it inserts, so if something needs
correcting you can regenerate and re-run without ending up with 158 gigs.

Then push the code and let Vercel redeploy.

## What the import contains

| | |
|---|---|
| Bookings | 79 |
| Total booked | $28,850.00 — matches the spreadsheet's own SUM exactly |
| Collected | $27,100.00 |
| Hours | 121.75 |
| Comped performances | 9 |
| Cancellations | 3 |

Collected is $1,750 below booked, and both figures are correct:

- **$1,650** — three 2026 weddings marked "Deposit recieved". The spreadsheet
  recorded *that* a deposit arrived but never *how much*. Rather than invent a
  number and quietly corrupt every balance that depends on it, these are
  imported as unpaid with a note on the gig telling you to fill in the amount.
  They're the only three gigs that will show as outstanding.
- **$100** — a fundraiser that was quoted and then canceled.

## How the columns moved

| Spreadsheet | App |
|---|---|
| Client | Split in two — see below |
| # of hrs | Duration (hours) |
| Preformance type | Booking Type + Event Category |
| Payment status | Paid / Deposit / Invoice Status |
| Date | Date |
| Price | Fee |
| Sales platform | How They Found You |
| Point of contact | Client |
| Notes | Notes |

The `Client` column had been doing two jobs: for venue accounts it held a real
account name (University Village, The Reserve), but for one-off work it held a
*kind* of event — "Bride" twenty times over, "Misc.", "Funeral". The account
names stayed put; the event kinds moved to **Event Category**, and the real
name came across from **Point of contact**, which is where it always was.

A few very early bookings recorded no contact name at all. Those have no client
rather than a client called "Bride".

## What's new that the spreadsheet couldn't do

**Finance → Where Bookings Come From.** Revenue by channel and by event type,
with average hourly rate and comp counts. On the imported history:

| Source | Gigs | Collected |
|---|---|---|
| Return customer | 32 | $10,175 |
| Family / friend | 10 | $4,650 |
| Cold outreach | 11 | $4,100 |
| Website | 8 | $4,050 |
| Social media | 3 | $2,100 |
| Word of mouth | 5 | $1,275 |
| Promo offer | 7 | $750 |

Overall average is **$272.51/hr** across billed work.

**Hourly rate** appears live in the gig form as you type a fee, on the gig
detail panel, in the CSV export, and as a sort option on the Gigs page.

**Lead source now survives the inquiry → gig conversion.** Public site
submissions are tagged "Website" automatically; anything you add by hand has a
dropdown. Previously the origin of a booking was lost the moment it became
revenue, which is the only moment it matters.

## One correctness note

Canceled bookings are excluded from every money total — income, booked,
outstanding, tax summary, the monthly chart, top clients, and the calendar.
Previously only *archived* gigs were excluded, so a canceled event would have
sat in the outstanding figure as revenue you were still owed for something
that never happened.

## Regenerating the import

If a mapping decision needs changing, edit `scripts/import-sales-orders.py`
and:

```
python3 scripts/import-sales-orders.py "PC records.xlsx" > supabase/import-sales-orders.sql
```

Then re-run step 2. `npm test` covers the reporting arithmetic; `npm run check`
covers unresolved identifiers and hook ordering. Neither proves the pages
render — check the deployment signed out as well as signed in.
