# Portfolio ReBalancer & DCA Planner

**The privacy-first portfolio rebalancer built for Canadian investors.**

A free, open-source web app that helps you manage your TFSA, RRSP, and custom investment accounts with intelligent rebalancing, dollar-cost averaging schedules, withholding tax optimization, and curated stock recommendations — all without connecting a single bank account.

---

## The Problem It Solves

Canadian investors face a set of challenges that nearly every portfolio tool on the market ignores:

### 1. Two accounts with radically different tax rules
Every Canadian investor manages at least two registered accounts — a **TFSA** and an **RRSP** — that behave completely differently from a tax perspective. The wrong security in the wrong account costs you real money every year, silently.

A US stock paying a 2% dividend held in your **TFSA** loses 15% of that dividend to IRS withholding tax — money you never see, never get back, and most portfolio apps never tell you about. The same stock in your **RRSP** pays 0% withholding under the Canada-US tax treaty.

Most tools treat all accounts the same. This app treats them differently, because they are.

### 2. Rebalancing shouldn't force you to sell
Most rebalancing calculators tell you to sell overweight positions. In a **non-registered account**, selling means triggering capital gains tax. In a registered account during a volatile year, selling locks in losses. The smarter approach for most Canadians is **cash-only rebalancing** — deploying new contribution room and new savings to bring underweight positions up, without touching what you already own.

This app defaults to cash-only rebalancing. It takes your available cash and calculates exactly how much of each security to buy to move closer to your target allocation — no forced sells.

### 3. DCA is more than just "invest monthly"
Dollar-cost averaging means spreading purchases over time to reduce timing risk. But if you're buying 8 different securities across two accounts with $10,000, which security do you buy this week? How much? Tracking this manually in a spreadsheet is error-prone and easy to abandon.

This app generates a **week-by-week purchase schedule** — not just totals, but a calendar of exactly which ticker to buy each week and for how much.

### 4. Knowing what you paid matters more than knowing what you own
Most portfolio trackers show your current value but not your true profit/loss, because they don't know your cost basis. This app lets you enter your **average cost per position** and instantly shows your unrealized P&L — both in dollars and percentage — for every holding and for your total portfolio.

### 5. Most tools require you to hand over your financial data
The dominant portfolio trackers (Empower, Wealthica, Personal Capital, Mint) require you to link your brokerage account, enter your banking credentials, or create an account with a third party. Your complete financial picture then lives on their servers, exposed to breaches, sold to advertisers, or held hostage behind a subscription paywall.

**This app stores nothing on any server.** Your data lives in your browser's localStorage. No login. No account. No cloud sync. Just your numbers, on your device.

---

## What the App Does

### Rebalance Tab
The core of the app. Enter how much cash you have available to invest, and the app calculates the optimal purchase amounts across all your holdings to move your portfolio toward your target allocations.

- **Cash-only mode** (default): Only shows buy actions. Overweight positions are flagged but not sold. Buys are proportionally scaled if your available cash is less than what a full rebalance would require.
- **Full rebalance mode**: Shows both buy and sell amounts for a complete rebalance to targets.
- **Cash quick-add buttons**: $500, $1,000, $2,500, $5,000, $7,000, $10,000 — one click to model a contribution.
- **Concentration warnings**: Automatically flags any position that exceeds 20% of your portfolio value.
- **Per-position P&L**: Shows unrealized gain/loss for every holding directly in the rebalance table.
- **2026 contribution limits**: TFSA ($7,000/yr) and RRSP ($32,490/yr) shown as reference.

### DCA Plan Tab
Takes your total buy amount and spreads it intelligently over the number of weeks you choose (4–26 weeks).

- **Slider control**: Drag to pick your DCA window from 1 month to 6 months.
- **Weekly allocation table**: Shows exactly how much to buy of each security every week, sorted by buy priority.
- **Calendar view**: A week-by-week card for the first 12 weeks showing dates, tickers, and dollar amounts.
- **Weekly spend summary**: Shows your total weekly spend so you can match it to your regular income schedule.

### Edit Targets Tab
Your portfolio editor. Every holding is a row with editable fields.

| Column | What it does |
|---|---|
| Current $ | The current market value of this position |
| Cost Basis $ | What you paid for it (average cost) |
| P&L $ / % | Unrealized gain or loss, calculated live |
| Target % | Your desired allocation percentage |
| CAGR % | Estimated annual growth rate (editable) |
| 10yr / 15yr / 20yr | Projected value at your CAGR using compound interest |

- **Totals row**: Shows your total portfolio value, total invested, total P&L, sum of target %, and portfolio-wide 10/15/20yr projections.
- **Target balance check**: Turns red if your target percentages don't add up to 100%.
- **Add ticker**: Add any security with full fields — ticker, name, current value, cost basis, target %, dividend yield, CAGR estimate, and notes.
- **Remove ticker**: Inline confirmation (no browser popups) to remove any position.

### Ideas Tab (Recommendations)
A curated set of 20 stock and ETF recommendations written specifically for Canadian investors in April 2026, with full investment theses.

Each recommendation card shows:
- Ticker, company name, sector, conviction level (High/Medium)
- Whether it's best held in TFSA, RRSP, or either — and why
- Dividend yield (or "No dividend — growth only")
- 3–5 sentence investment thesis covering the business model, growth drivers, risks, and tax angle
- Relevant tags (e.g. AI, Dividend, CAD, Defense)
- Whether it fills a detected gap in your current portfolio
- One-click add to either TFSA or RRSP

**Portfolio gap detection**: The app scans your combined TFSA + RRSP holdings and identifies which major sectors you have no exposure to (Healthcare, Financials, Defense, Fixed Income, Real Estate, International, Energy Infrastructure). Recommendations that fill those gaps are tagged and highlighted.

**Market context panel**: Key macro themes relevant to the recommendations (tariff volatility, AI buildout, healthcare demographics, rate cuts, defense surge, EM rotation).

**Filters**: All ideas, Best for TFSA, Best for RRSP, Fills Gaps — already-owned tickers are automatically excluded from results.

### Ticker Search Tab
Look up any ticker symbol against the curated database.

- **Instant lookup**: Type a ticker and press Enter. If it's in the database, you get the full analysis card with thesis, conviction, CAGR, and compound growth projections.
- **20 quick-access chips**: One-click to pull up any curated recommendation.
- **Unknown tickers**: If the ticker isn't in the database, the app gives you a ready-to-paste prompt formatted for Claude AI (claude.ai) — asking for a Canadian investor analysis covering business model, fair value, dividend treatment, TFSA vs RRSP placement, and CAGR estimate.
- **Add to any portfolio**: From a search result, add the security directly to any of your portfolios.
- **Browse view**: When no search is active, shows all 20 curated tickers as a scannable grid.

### Custom Portfolios
Beyond TFSA and RRSP, create portfolios for any account type.

- **Add portfolio**: Click `+ Portfolio`, type a name (e.g. `TAXABLE`, `JOINT`, `CORPORATE`, `PENSION`), press Enter.
- **Per-portfolio accent color**: Each portfolio gets a unique color — TFSA is gold, RRSP is cyan, custom portfolios cycle through purple, green, orange, pink, blue.
- **Per-portfolio cash and holdings**: Each portfolio is fully independent with its own cash balance, holdings, targets, and DCA plan.
- **Delete custom portfolios**: Any non-TFSA/RRSP portfolio can be deleted. TFSA and RRSP are permanent.
- **Full export/import**: All portfolios including custom ones are saved in the export JSON.

### Summary Cards (top of every tab)
Always-visible at the top of the screen:

| Card | What it shows |
|---|---|
| Cash | Editable — your available cash to deploy |
| Total Invested | Sum of all cost basis entries (what you paid) |
| Portfolio Value | Current market value of all holdings |
| Unrealized P&L | Total gain/loss with percentage (shown only when cost basis is entered) |
| Annual Dividends | Estimated annual dividend income across all holdings |
| WHT estimate | Estimated withholding tax drag in TFSA (shown only when relevant) |
| After Deploy | Portfolio value if you deploy all available cash |
| To Buy | Total dollars of buy orders from the current rebalance |
| Cash Remaining | How much cash is left after buys (or To Sell in full rebalance mode) |

---

## How It Handles Canadian Tax Intelligence

The app has specific knowledge about Canadian registered accounts baked in:

### Withholding Tax (WHT) Optimization
US-listed securities that pay dividends lose **15% of those dividends to IRS withholding tax** when held in a TFSA (the treaty exemption only applies to RRSPs). The app:

- Knows which tickers are **Canadian-listed and WHT-exempt**: CNQ, XIU, VFV.TO, BTCC, GOLD, ZAG.TO, XRE.TO, XEG.TO and others
- Estimates your annual WHT drag in TFSA based on current holdings and dividend yields
- Flags WHT-paying holdings in TFSA with a "MOVE TO RRSP" recommendation in the default data
- Shows "$X lost to WHT/yr" on the dividend income card when applicable

### Account Placement Logic
The curated recommendations explicitly tell you which account each security belongs in and why. For example:
- No-dividend growth stocks (NVDA, AMZN, PLTR) → TFSA, because all gains are tax-free
- US dividend payers (MSFT, TSM, ADI) → RRSP, because the treaty eliminates WHT
- High-yield Canadian securities (ENB, CNQ) → TFSA, because Canadian dividends have no WHT and get the dividend tax credit treatment
- Long-duration bonds (TLT) → RRSP, to shelter interest income from full marginal taxation

---

## How It Compares to the Alternatives

### vs. Wealthica / Empower / Personal Capital
These tools are **aggregators** — their value proposition is connecting all your accounts in one place. That connection requires handing over your banking credentials or linking your brokerage accounts. Their business model is your data.

| | Portfolio ReBalancer | Wealthica / Empower |
|---|---|---|
| Data privacy | Stored in your browser only | Stored on their servers |
| Login required | No | Yes |
| Cost | Free forever | Freemium / subscription |
| Canadian tax rules | Built-in WHT, TFSA/RRSP logic | Minimal |
| Rebalancing | Cash-constrained DCA mode | Basic or none |
| Account linking | Not required | Required for most features |

### vs. Passiv (passiv.com)
Passiv is the closest Canadian competitor. It integrates directly with Questrade and automatically executes trades. It is genuinely useful if you only use Questrade.

| | Portfolio ReBalancer | Passiv |
|---|---|---|
| Broker support | All brokers (manual entry) | Questrade, Interactive Brokers |
| Auto-trade execution | No (manual — by design) | Yes |
| Cost | Free | Free tier limited; Elite ~$99/yr |
| Privacy | Browser-only | Account linked to broker |
| Custom portfolios | Unlimited | Limited on free tier |
| Ticker research | Built-in analysis + AI prompts | None |
| DCA calendar | Week-by-week schedule | One-time or recurring |
| Offline use | Yes | No |

**The key philosophical difference**: Passiv connects to your broker and can place real trades. This app never touches your broker. Every decision is yours — the app is a calculation and planning tool, not an execution layer.

### vs. Google Sheets / Excel Templates
Many Canadian investors use community-built spreadsheets (Canadian Couch Potato, Reddit r/PersonalFinanceCanada templates).

| | Portfolio ReBalancer | Spreadsheet |
|---|---|---|
| Setup time | Zero | 30–60 min |
| Mobile experience | Responsive, installable as PWA | Poor |
| Automatic calculations | Real-time as you type | Manual recalculation |
| DCA scheduling | Built-in calendar | Manual |
| Recommendations | Curated with theses | None |
| Backup | Export JSON | Save file manually |
| Version control | Git-tracked, deployable | Email yourself a copy |

### vs. Portfolio Visualizer / Morningstar Portfolio Manager
These are US-centric tools built for US investors with US tax rules.

- No concept of TFSA or RRSP
- No withholding tax modeling
- No CAD-denominated ETF awareness
- US-denominated calculations throughout
- Morningstar requires a subscription for portfolio features
- No DCA scheduling

### vs. Robo-Advisors (Wealthsimple Managed, Questrade Portfolios, JustWealth)
Robo-advisors charge a **management fee (0.4–0.7% MER)** on top of the ETF's own MER. On a $100,000 portfolio, that's $400–700/year in fees that compound against you over decades. In exchange, they handle rebalancing automatically.

This app is for investors who want to **self-direct** — they understand the value of keeping that fee, they want to choose their own securities, and they're willing to spend 30 minutes per quarter reviewing their plan. The app makes that 30 minutes productive.

### vs. Your Brokerage's Built-in Tools (Questrade, IBKR, RBC DI)
Brokerage tools are siloed. They only see what you hold with them, not your complete picture across accounts. If your TFSA is at Questrade and your RRSP is at RBC, no brokerage tool shows you the whole picture. This app does — you enter values from anywhere.

---

## Privacy Model

This app has no backend. There is no server that receives your data. There is no database. There is no analytics tracker. There is no login.

Your portfolio data is stored in `localStorage` — a browser-sandboxed storage that never leaves your device unless you explicitly export it. If you host the app on Vercel or GitHub Pages, those services only serve the static HTML/JS/CSS files; they never see your data.

The only network requests the app makes are:
1. Loading the Google Fonts stylesheet (DM Sans, JetBrains Mono, Instrument Serif) — no financial data is sent
2. Nothing else

To verify this yourself: open DevTools → Network tab → use the app → see that no requests go to any server containing your portfolio data.

**Consequence**: If you clear your browser cache, your data is gone. Export a backup JSON regularly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Styling | Inline styles (no CSS framework dependency) |
| Data persistence | Browser localStorage |
| Fonts | Google Fonts (DM Sans, JetBrains Mono, Instrument Serif) |
| Hosting | Vercel or GitHub Pages (free) |
| Bundle size | < 200KB gzipped |

No backend. No database. No authentication library. No charting library. No state management library. The entire application logic is in a single file: `src/App.jsx`.

---

## Getting Started

### Run Locally

```bash
# 1. Clone or download the repo
git clone https://github.com/novonilc/portfolio-app.git
cd portfolio-app

# 2. Install dependencies (one-time)
npm install

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:5173
```

Requirements: Node.js 18+ (download from nodejs.org)

### Deploy to Vercel (Free — Recommended)

1. Fork this repository to your GitHub account (keep it **Private** — your portfolio data is in your browser, but keeping the repo private is good practice)
2. Go to vercel.com → Add New Project → select your fork
3. Vercel auto-detects Vite. Click **Deploy**
4. Done. You get a URL like `portfolio-rebalancer-xyz.vercel.app`

Any push to `main` auto-deploys to Vercel. Your data in localStorage is unaffected by deployments.

### Deploy to GitHub Pages

```bash
# 1. Add to vite.config.js:
#    base: "/portfolio-app/"   ← your repo name

# 2. Install gh-pages
npm install -D gh-pages

# 3. Add to package.json scripts:
#    "deploy": "vite build && gh-pages -d dist"

# 4. Deploy
npm run deploy
```

Enable Pages in your repo Settings → Pages → Source: `gh-pages` branch.

### Install on Your Phone (PWA)

Once hosted on Vercel or GitHub Pages:

- **iPhone**: Safari → Share → "Add to Home Screen"
- **Android**: Chrome → Menu → "Add to Home Screen"

The app opens fullscreen like a native app with no browser chrome.

---

## File Structure

```
portfolio-app/
├── package.json          # Dependencies (react, vite only)
├── index.html            # Entry point
├── vite.config.js        # Vite configuration
└── src/
    ├── main.jsx          # React root mount
    └── App.jsx           # Entire application (~1,600 lines)
```

The app is intentionally monolithic — no component splitting, no separate data files, no API layer. This makes it easy to fork, customize, and understand.

---

## Customizing for Your Portfolio

Everything is in `src/App.jsx`. The key areas to modify:

### Change the default TFSA holdings (`INITIAL_TFSA` array, line ~7)
```js
const INITIAL_TFSA = [
  { ticker:"NVDA", name:"Nvidia", current:4947, target:14, divYield:0, ... },
  // Add or remove entries here
];
```

### Change the default RRSP holdings (`INITIAL_RRSP` array, line ~26)
Same structure as TFSA.

### Add CAGR estimates for your tickers (`DEFAULT_CAGR` object, line ~208)
```js
const DEFAULT_CAGR = {
  NVDA:18, AMZN:15, NOW:16, GOOG:12,
  // Add your tickers: TICKER: estimatedAnnualGrowthPct
};
```

### Add WHT-exempt Canadian tickers (`CAD_EXEMPT` set, line ~223)
```js
const CAD_EXEMPT = new Set(["CNQ","XIU","VFV.TO","ZAG.TO","XRE.TO",
  // Add any CAD-listed ETF or stock that pays no US WHT
]);
```

After changing defaults, run `npm run dev` to see the changes. The app automatically saves to localStorage on any edit, so default data only loads on first use (or after a reset).

---

## Data Backup and Portability

### Export
Click **Export** in the header. Downloads a `portfolio-backup-YYYY-MM-DD.json` file with all portfolios, cash balances, cost basis, targets, and custom CAGR values.

### Import
Click **Import** and select a previously exported JSON file. This restores all data including custom portfolios. The old format (without the `portfolios` array) is also supported for backwards compatibility.

### Export format
```json
{
  "portfolios": ["TFSA", "RRSP", "TAXABLE"],
  "holdings": {
    "TFSA": [
      {
        "ticker": "NVDA",
        "name": "Nvidia",
        "current": 4947,
        "costBasis": 2800,
        "target": 14,
        "divYield": 0,
        "cagr": 18,
        "locked": "✅ Keep",
        "notes": "..."
      }
    ],
    "RRSP": [...],
    "TAXABLE": [...]
  },
  "cashHolding": {
    "TFSA": 5000,
    "RRSP": 2000,
    "TAXABLE": 0
  }
}
```

---

## Disclaimer

This application is for **personal financial planning and educational purposes only**. It is not financial advice. The recommendations, CAGR estimates, investment theses, and market commentary are opinions, not guarantees. Past performance does not predict future results.

Always verify your allocation and trade calculations with your brokerage before executing any transaction. Consult a licensed **Certified Financial Planner (CFP)** or **Investment Advisor** before making significant investment decisions.

Tax rules, contribution limits, and withholding tax treaties are subject to change. This app reflects rules as understood at the time of development (April 2026).

---

## License

MIT License — free to use, modify, fork, and deploy for personal use. Attribution appreciated but not required.
