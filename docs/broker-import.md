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

- Your **Anthropic API key** must be entered in the Market Pulse tab before using this feature.
  - Get a free key at [console.anthropic.com](https://console.anthropic.com)
  - In the app: go to **Market Pulse** tab → paste your key in the "Anthropic API Key" field → the key saves automatically to localStorage
- A holdings CSV from your broker (see export instructions below)

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

### Step 3 — Review the preview modal

A modal appears with a summary of what Claude found:

```
┌─────────────────────────────────────────────────┐
│  Broker import ready                            │
│                                                 │
│  Claude analysed your holdings CSV.             │
│                                                 │
│  TFSA     15 positions  ·  C$42,318             │
│  RRSP     17 positions  ·  C$88,741             │
│  RESP     11 positions  ·  C$39,617             │
│  Crypto    2 positions  ·     C$93              │
│                                                 │
│  [ ✓ Import 45 holdings ]  [ Cancel ]           │
└─────────────────────────────────────────────────┘
```

- Click **✓ Import** to apply — existing holdings in those accounts are replaced
- Click **Cancel** (or click outside the modal) to discard without changes

### Step 4 — Review targets in Edit Targets

After import, switch to the **Edit Targets** tab and review:

1. **Target % column** — Claude's suggestions. Adjust any that don't match your actual plan.
2. **Target sum** — each account should sum to exactly 100%. The total row turns red if it doesn't.
3. **Cost basis** — verify these match your actual average cost from your brokerage.
4. **CAGR** — Claude estimates these; override with your own view.

### Step 5 — Run a rebalance

Once targets are set, go to **Rebalance** tab. Enter your available cash and review the buy/sell recommendations before executing any trades.

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

### "Enter your Anthropic API key in the Market Pulse tab first"

You haven't entered an API key yet. Go to the **Market Pulse** tab, scroll to the API key field, and paste your key.

### "API error 401"

Your API key is invalid or has been revoked. Generate a new key at [console.anthropic.com](https://console.anthropic.com).

### "API error 429"

You've hit the Anthropic rate limit. Wait 30–60 seconds and try again. If you're on the free tier, usage may be exhausted for the day.

### "Claude returned no holdings"

The CSV was too short, empty, or in a format Claude couldn't parse. Verify the file opens correctly in Excel/Numbers and contains at least one row with a non-zero Quantity.

### Targets don't sum to 100% after import

This is expected if Claude's estimates are imprecise. Go to **Edit Targets**, check the red total, and adjust one or two positions to bring the sum to exactly 100%.

### Positions are in the wrong account

The importer uses the `Account Type` column from your broker CSV. If Wealthsimple labels a managed RRSP account differently (e.g. as `RRSP` vs. `Managed RRSP`), those positions may land in a separate portfolio bucket. You can rename or merge portfolios manually via the `+ Portfolio` controls.

---

## Privacy note

The raw CSV text (ticker symbols, quantities, market values) is sent to the Anthropic API. No account numbers, names, or SINs are included in the broker CSV export. Your API key is stored only in your browser's localStorage — it is never transmitted to this app's server (there is no server). See [Privacy Model](../README.md#privacy-model) in the README for full details.
