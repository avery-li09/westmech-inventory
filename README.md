# Western Mechatronics parts inventory

Scan the QR label on a bin with your phone camera. The label opens that part here, you tap Take (or Return), and the club's ledger records who took what and when. Vivian's admin view shows live stock, a buy list, and which returnable parts are still out.

Live at https://avery-li09.github.io/westmech-inventory/

## How it fits together

- This repo is the app: static HTML on GitHub Pages, installable on a phone, works offline for scanning (writes queue and send when back online).
- The data is a Google Sheet, "Western Mechatronics — Inventory" (Parts, Transactions, Stock, Coaches, Bins, Alerts). Transactions is an append-only ledger; on hand is the sum of a part's rows, so two coaches scanning at once can never overwrite each other.
- The API is an n8n workflow ("WM Inventory API") at `https://n8n.ambrosia-ai.org/webhook/wm-inv-*`. A second workflow ("WM Inventory Alerts") emails the Sunday digest.
- Labels: `labels.html` prints Avery 5160 / 5520 / 8160 sheets (30 per page) or plain paper. Each label's QR is a plain URL, so the native camera app reads it; no scanner is built into the app.

## Sign-in

Each coach has a name and a 4-digit PIN in the Coaches tab of the sheet. The PIN is an honesty system, not security: nothing here moves money, and anyone reading the page source could forge a request. Admins (role `admin` in the sheet) get the Stock, Buy, Out and Count screens and can edit parts. To add a coach, add a row to the Coaches tab.

## Endpoints

| Method | Path | Body or query | Returns |
|---|---|---|---|
| GET | `wm-inv-catalog` | | parts with on hand, bins, coaches (names only) |
| POST | `wm-inv-auth` | `{coach_id, pin}` | `{token, name, role}` |
| POST | `wm-inv-txn` | `{token, items:[{client_txn_id, part_id, qty_delta, kind, team, note}]}` | applied rows, duplicates skipped, low-stock crossings |
| GET | `wm-inv-activity` | `?token=&coach=&part=&since=&limit=` | recent rows and open returnables |
| POST | `wm-inv-part` | `{token, part:{…}}` or `{token, printed:[ids]}` | admin upsert, or stamp labels as printed |

`client_txn_id` makes every write idempotent, which is what lets the offline queue retry safely.

## Deploying a change

Edit, then bump `CACHE` in `sw.js` and the `?v=` on the `sw.js` registration in `index.html`, commit, push. GitHub Pages serves `main` from the repo root.

## Build scripts

The seed, the catalog-freeze report, and the n8n workflow generator live in the Ambrosia repo under `projects/westmech-inventory/` (not here).
