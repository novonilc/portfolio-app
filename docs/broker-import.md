# Broker CSV Import

Upload your brokerage's holdings export and let Claude parse, convert, and import every position automatically — no manual data entry required.

---

## Overview

The **🏦 Import from Broker** button (gold-highlighted, next to Restore / Import in the header) reads your broker's native CSV format and uses the Claude API to:

- Group positions by account (TFSA, RRSP, RESP, Crypto)
- Convert USD market values to CAD at the app's current FX rate
- Suggest target allocations optimised per account type
- Estimate dividend yield and CAGR per position
- Write a one-line rationale for each suggested target

A preview modal shows the result before anything is applied, so you can review and cancel without any changes being made.

---

## Prerequisites

- An active **Pro subscription** — Broker CSV Import uses Claude AI and is not available on the Basic plan. If you're on Basic, the Import button shows an upgrade link.
- A holdings CSV from your broker (see export instructions below)

No Anthropic API key is needed — Claude access is included in the Pro plan and routed through the app's secure backend proxy.

---

## Exporting from Wealthsimple

### Web app

1. Log in at [my.wealthsimple.com](https://my.wealthsimple.com)
2. Go to **Trade** → click your account name → **Activity**
3. Click the **Download** icon → **Export holdings as CSV**
4. Save the file (typically named `holdings-report-YYYY-MM-DD.csv`)

### Mobile app

1. Open the app → tap your portfolio balance
2. Tap the **⋯** (more) menu → **Export holdings**
3. Share or save the CSV file to your device

The export contains all accounts (TFSA, RRSP, RESP, Crypto) in a single file — you do not need to export each account separately.

---

## Column mapping

The importer reads these columns from the Wealthsimple CSV:

| CSV column | App field | Notes |
|---|---|---|
| `Account Type` | `account` | TFSA, RRSP, RESP, or Crypto |
| `Symbol` | `ticker` | Uppercased automatically |
| `Name` | `name` | Full security name |
| `Market Value` | `current` | Converted to CAD if currency is USD |
| `Market Value Currency` | `currencyOverride` | Sets USD/CAD flag per position |
| `Book Value (CAD)` | `costBasis` | Always in CAD — used as-is |
| `Quantity` | — | Used to exclude zero-quantity positions |

---

## Import walkthrough

### Step 1 — Click Import from Broker

Click **🏦 Import from Broker** in the header controls.

```
💾 Backup  📂 Restore / Import  🏦 Import from Broker
```

### Step 2 — Select your CSV file

A file picker opens filtered to `.csv` files. Select your broker export.

The button label changes to **⏳ Analysing…** while Claude processes the file (typically 5–15 seconds depending on portfolio size).

### Step 3 — Map your accounts

Before the preview, an **account mapping modal** appears. For each account type detected in the CSV, you can:

- **Rename** — the broker's raw account label (e.g. "Tax-Free Savings Account", "Retirement Savings Plan") is matched to your app portfolio. The app pre-fills a normalised name (TFSA, RRSP, RESP, Crypto) — override it if needed.
- **Mode** — choose how the import interacts with existing data in that portfolio:
  - **Replace** — overwrites all existing holdings in that portfolio with the imported rows. Use this for a clean re-import.
  - **Merge** — updates holdings that already exist (matching by ticker), appends new tickers, and leaves everything else untouched. Use this to top-up without wiping the portfolio.

Click **Continue** when the mapping is set.

### Step 4 — Review the preview modal

A modal appears with a summary of what will be imported:

```
┌─────────────────────────────────────────────────┐
│  Broker import ready                            │
│                                                 │
│  Claude analysed your holdings CSV.             │
│                                                 │
│  TFSA     15 positions  ·  C$42,318  (Replace)  │
│  RRSP     17 positions  ·  C$88,741  (Replace)  │
│  RESP     11 positions  ·  C$39,617  (Merge)    │
│  Crypto    2 positions  ·     C$93   (Merge)    │
│                                                 │
│  [ ✓ Import 45 holdings ]  [ Cancel ]           │
└─────────────────────────────────────────────────┘
```

- Click **✓ Import** to apply
- Click **Cancel** (or click outside the modal) to discard without changes

### Step 5 — Review targets in Edit Targets

After import, switch to the **Edit Targets** tab and review:

1. **Target % column** — Claude's suggestions. Adjust any that don't match your actual plan.
2. **Target sum** — each account should sum to exactly 100%. The total row turns red if it doesn't.
3. **Cost basis** — verify these match your actual average cost from your brokerage.
4. **CAGR** — Claude estimates these; override with your own view.

### Step 6 — Run a rebalance

Once targets are set, go to **Rebalance** tab. Enter your available cash and review the buy/sell recommendations before executing any trades.

---

## Multi-account import workflow

Wealthsimple exports all accounts in a single CSV. But if you manage separate accounts at different brokers, or if you want to import your accounts incrementally, here is the recommended pattern:

### All accounts in one file (standard Wealthsimple export)

1. Click **🏦 Import from Broker** and select the CSV
2. In the mapping modal, confirm each account name is mapped correctly
3. Set all accounts to **Replace** for a clean first import, or **Merge** to update without overwriting
4. Click **Continue → ✓ Import**

### Separate files per account

1. Import the first file (e.g. TFSA). Set TFSA → **Replace**. All other accounts: leave unmapped or set to **Merge** (harmless if they don't exist yet).
2. Import the second file (e.g. RRSP). Set RRSP → **Replace**. The TFSA data is untouched because Replace only affects the mapped account.
3. Repeat for additional accounts (RESP, Crypto, non-registered).

### Incremental update (top-up without wiping)

Use **Merge** mode for any account you want to partially update:
- Tickers that already exist in the portfolio are updated to the imported value
- New tickers from the CSV are appended
- Tickers you added manually (not in the CSV) are left alone

This is useful after a partial portfolio change — you don't need to re-import your entire history, just the updated positions.

---

## What Claude optimises per account

### TFSA

Favours positions with no or minimal dividends — since US dividends in a TFSA are subject to 15% IRS withholding tax that cannot be recovered:

- Growth stocks (NVDA, AMZN, GOOG, NOW) get higher targets
- Canadian-listed ETFs (XEQT, BTCC, MDA) have no WHT — they can be held here
- US dividend payers (RTX, V, GLD) get lower targets as a nudge to consider RRSP placement

### RRSP

Favours US-listed income and dividend payers — since the Canada-US tax treaty eliminates the 15% IRS withholding tax in RRSP:

- US ETFs (QQQM, SGOV, VXUS, CIBR) are core positions
- Individual US dividend stocks (AVGO, V, TSM) get higher targets
- CAD-denominated positions (HISA, ZEQT) are still valid as cash parking or Canadian core exposure

### RESP

Targets are set proportionally to current market values (i.e. roughly maintaining the existing managed allocation):

- The RESP is typically a managed portfolio — Claude mirrors current weights rather than imposing an opinionated allocation
- Bond ETFs (ZAG, ZCB, ZUAG.F) and equity ETFs (QCN, QUU, ZEA) are kept balanced

### Crypto

Targets are split proportionally to current market value between BTC, ETH, and any Bitcoin ETFs held (BTCC).

---

## Troubleshooting

### "AI Broker Import requires the Pro plan"

Your active license is Basic. Click the **Import from Broker — Pro only →** link to upgrade, then re-activate your new Pro license key.

### "Daily AI limit reached"

You've used all 10 AI calls for today. The limit resets at midnight UTC. Try the import again tomorrow, or export your CSV and manually enter the key positions in Edit Targets.

### "Invalid or expired license"

Your license key failed validation. Re-enter it in the license gate, or check your subscription status at [lemonsqueezy.com](https://app.lemonsqueezy.com).

### "Claude returned no holdings"

The CSV was too short, empty, or in a format Claude couldn't parse. Verify the file opens correctly in Excel/Numbers and contains at least one row with a non-zero Quantity.

### Targets don't sum to 100% after import

This is expected if Claude's estimates are imprecise. Go to **Edit Targets**, check the red total, and adjust one or two positions to bring the sum to exactly 100%.

### Positions are in the wrong account

Use the **account mapping modal** (Step 3) to rename accounts before applying. The app pre-fills normalised names (TFSA, RRSP, etc.) but you can override any mapping. If you already applied an import with the wrong account name, re-import with the correct mapping and use **Replace** mode to overwrite.

### I accidentally overwrote my existing holdings

Re-import the original file with **Replace** mode, or restore from a `portfolio-backup-YYYY-MM-DD.json` export. This is why exporting a backup before any import is strongly recommended.

### I want to import TFSA and RRSP from separate files without losing either

Use **Merge** mode for the second import (after the first has already loaded one account). Merge updates existing tickers by value, appends new ones, and leaves everything else unchanged — so the first account's data is safe when you import the second file.

---

## Privacy note

When you click Import, the raw CSV text (ticker symbols, quantities, and market values) is sent from your browser to the app's secure `/api/claude` backend proxy. The proxy validates your Pro license key against Lemon Squeezy in real time and forwards only the portfolio prompt to Claude — never the raw CSV. No account numbers, names, or SINs are included in the Wealthsimple CSV export.

Your Anthropic API key is never in your browser — it lives only in the Vercel server environment. Your portfolio data (imported or manually entered) is automatically synced to a private Vercel Blob storage path keyed to your Lemon Squeezy customer ID. The blob is not publicly accessible and requires server-side token authentication to read. See [Privacy Model](../README.md#privacy-model) in the README for full details.
