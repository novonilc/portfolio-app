# Portfolio ReBalancer & DCA Planner

**The privacy-first portfolio rebalancer built for Canadian investors.**

A free, open-source web app that helps you manage your TFSA, RRSP, and custom investment accounts with intelligent rebalancing, dollar-cost averaging schedules, withholding tax optimization, and curated stock recommendations — all without connecting a single bank account.

## Quick Start

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Table of Contents

- [Quick Start](#quick-start)
- [The Problem It Solves](#the-problem-it-solves)
- [What the App Does](#what-the-app-does)
- [How to Use the App Efficiently](#how-to-use-the-app-efficiently)
- [How It Compares to the Alternatives](#how-it-compares-to-the-alternatives)
- [Privacy Model](#privacy-model)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [File Structure](#file-structure)
- [Customizing for Your Portfolio](#customizing-for-your-portfolio)
- [Updating Curated Data](#updating-curated-data)
- [Data Backup and Portability](#data-backup-and-portability)
- [Investor Profile](#investor-profile)
- [Broker CSV Import](#broker-csv-import)
- [Disclaimer](#disclaimer)
- [License](#license)

### Wiki

In-depth guides for specific features live in the [`docs/`](docs/) folder:

| Guide | Description |
|---|---|
| [Broker CSV Import](docs/broker-import.md) | Step-by-step: export from Wealthsimple, upload, and let Claude import it |
| [Market Pulse & Claude API](docs/market-pulse.md) | Set up your Anthropic API key, configure Market Pulse, and use the Action Center |
| [TFSA vs RRSP Optimization](docs/canadian-tax-optimization.md) | Which securities belong in which account and why — with worked examples |
| [Investor Profile](docs/investor-profile.md) | Setting up your age, risk tolerance, and goal to personalise all AI features |
| [Customizing Data Files](docs/data-customization.md) | Editing `recommendations.json` and `marketPulse.json` without touching app code |

> **Recent changes:**
> - **Morning Radar** — a 4-cell status panel at the top of the Dashboard shows today's estimated day P&L (after a live price refresh), allocation drift alerts, expiring options count, and WHT status. One-click **📡 Refresh Prices** fetches closing prices for all holdings via Yahoo Finance.
> - **Live Price Refresh** — fetches the latest price for every ticker across all accounts in parallel. A day-change column (green/red) appears in the Combined Top Holdings table when prices are available.
> - **Dividend Income Calendar** — 12-month bar chart in the Dashboard projecting monthly dividend income with quarterly seasonality weighting, current-month highlight, and per-account breakdown.
> - **Contribution Room Tracker** — TFSA and RRSP room inputs with progress bars in the Dashboard health section; values persist across sessions.
> - **FX Sensitivity** — Dashboard shows the estimated CAD portfolio impact of a 5% USD/CAD move.
> - **Investor Profile** — one-time questionnaire (age, risk tolerance, goal, monthly contribution) personalises the Ideas tab and all three AI features. Access via **👤 Set Profile** in the header.
> - **Multi-CSV Import with Account Mapping** — import CSVs from multiple Wealthsimple accounts without overwriting existing holdings. A mapping modal lets you rename each account and choose Replace or Merge mode per account.
> - **AI Diversification Trim Alerts** — the Ideas tab Diversification Analysis now returns both new position suggestions *and* a Trim / Reduce Alerts section flagging overweight, misplaced, or redundant existing positions.
> - **AI Options Analysis** — a new sub-tab in the Options tab where Claude suggests specific Covered Call and Cash-Secured Put trades for your holdings, each rated Low / Medium / High risk with premium estimates and a pre-fill button.
> - **AI Target Suggestions** — a ✨ button in the Edit Targets tab sends current holdings to Claude, returning optimised target % allocations with WHT awareness and a before/after diff modal.
> - **Broker CSV Import** — upload your Wealthsimple CSV. Claude parses every position, converts currencies, groups by account, suggests targets, and auto-excludes managed/private-equity funds.
> - **Market Pulse** tab with Action Center, News Flash, Trade Log, and redesigned Risk-On/Risk-Off gauge.

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

This app generates a **cadence-aware purchase schedule** (weekly, bi-weekly, or monthly) — not just totals, but a calendar of exactly which ticker to buy and for how much each period.

### 4. Knowing what you paid matters more than knowing what you own
Most portfolio trackers show your current value but not your true profit/loss, because they don't know your cost basis. This app lets you enter your **average cost per position** and instantly shows your unrealized P&L — both in dollars and percentage — for every holding and for your total portfolio.

### 5. Most tools require you to hand over your financial data
The dominant portfolio trackers (Empower, Wealthica, Personal Capital, Mint) require you to link your brokerage account, enter your banking credentials, or create an account with a third party. Your complete financial picture then lives on their servers, exposed to breaches, sold to advertisers, or held hostage behind a subscription paywall.

**This app stores nothing on any server.** Your data lives in your browser's localStorage. No login. No account. No cloud sync. Just your numbers, on your device.

---

## What the App Does

### Dashboard Tab
A combined portfolio overview that sits above the per-account tabs. It shows both your TFSA and RRSP together in a single view — no switching required.

**Morning Radar (top of Dashboard):**

A 4-cell status panel designed to be the first thing you check each morning:

| Cell | What it shows |
|---|---|
| Today's Est. P&L | Live day gain/loss in C$ across all accounts (requires a price refresh) |
| Allocation Drift | Count of positions drifted >30% above or >35% below their target weight |
| Expiring Options | Count of open option trades expiring within the next 14 days |
| WHT Status | Whether any TFSA positions are actively losing dividends to IRS withholding |

Click **📡 Refresh Prices** in the Morning Radar to fetch the latest closing price for every ticker in parallel via Yahoo Finance (~5–15 seconds). This also populates the day-change column in the Combined Top Holdings table.

---

**Summary stat cards (always visible at the top):**

| Card | What it shows |
|---|---|
| Total Portfolio | Combined market value in C$ with US$ equivalent |
| TFSA | Account value with native USD / CAD split |
| RRSP | Account value with native USD / CAD split |
| Combined P&L | Total unrealized gain/loss in C$ and as a percentage |
| Annual Dividends | Combined dividend income across both accounts |
| USD Exposure | Total USD holdings in native US$ with % of portfolio |

**Account allocation bar:** A visual split bar showing what percentage of your total wealth sits in TFSA vs RRSP. Useful for spotting whether your accounts are growing proportionally to your plan.

**Combined currency donut:** An SVG donut chart breaking the full portfolio into USD-denominated holdings vs CAD-denominated holdings, with a line-item breakdown of exact dollar amounts in both native currency and CAD equivalent.

**WHT annual drag summary:** If your TFSA holds any US dividend-paying securities, this card shows the exact dollar amount lost to IRS withholding tax per year and explains how to recover it permanently by moving positions to RRSP under the Canada–US Tax Treaty.

**Per-account panels (TFSA and RRSP side by side):**

Each panel shows:
- Account total in C$ and unrealized P&L (if cost basis is set)
- **Currency exposure donut** with proportional bars for USD and CAD holdings — each showing the native amount (US$ or C$) and the CAD equivalent
- **Top holdings** ranked by market value with proportional bars, native currency value, account percentage, and a USD/CAD tag
- **Annual dividend income** with WHT deducted (TFSA only) and net income received
- **Target weight health** — shows the sum of your target percentages and flags when they deviate from 100%
- **Concentration warnings** — highlights any single position exceeding 20% of that account

**Combined top holdings table:** All positions from both accounts ranked together by market value in CAD, with account badge, proportional bar, native value, percentage of total portfolio, currency tag, and — when live prices have been refreshed — a **day change column** showing today's gain/loss percentage in green (positive) or red (negative). Covers up to 12 positions.

**Portfolio health cards:**
- **WHT recovery** — dollar amount reclaimed per year if US dividend payers are moved from TFSA to RRSP
- **Income breakdown** — TFSA dividends, WHT deducted, RRSP dividends, and net combined income in a single waterfall
- **Sector gaps** — sectors with no coverage across both accounts
- **Cost basis summary** — invested capital by account and combined total
- **FX Sensitivity** — estimated C$ portfolio impact of a 5% move in the CAD/USD rate, based on current USD-denominated holdings
- **Contribution Room Tracker** — editable TFSA and RRSP remaining room fields with a progress bar showing how much of the annual limit is still available; values persist across sessions

**Dividend Income Calendar (below health cards):**
A 12-month bar chart projecting monthly dividend income using quarterly seasonality weighting (Q1/Q3 months typically pay higher distributions). The current calendar month is highlighted in purple. Below the chart: per-account annual breakdown (TFSA net of WHT, RRSP gross), a quarterly income estimate, and the effective yield across all dividend-paying positions.

---

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
- **Contribution cadence toggle**: Choose Weekly, Bi-weekly, or Monthly cadence for the plan.
- **Cadence allocation table**: Shows exactly how much to buy of each security every contribution period, sorted by buy priority.
- **Schedule view**: Period-by-period cards (up to first 12 periods) showing dates, tickers, and amounts.
- **Cadence spend summary**: Shows your spend per selected cadence, including CAD/USD split.

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
A curated set of 20+ stock and ETF recommendations written specifically for Canadian investors, with full investment theses. Content lives in `src/data/recommendations.json` — see [Updating Curated Data](#updating-curated-data) to add or edit recommendations without touching app code.

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

**Investor Profile banner**: When a profile is set (see [Investor Profile](#investor-profile)), a coloured strip at the top of the tab shows your risk level, goal, and age context. Claude's diversification suggestions are weighted to match your situation. Without a profile, a dashed prompt invites you to set one up.

**AI Diversification Analysis**: The "Analyse my portfolio" button returns two sections:
- **New Positions to Add** — 3–6 sector-gap-filling suggestions with account placement rationale (TFSA vs RRSP), a suggested initial target weight, and a one-click Add button. Suggestions persist across sessions.
- **Trim / Reduce Alerts** — existing positions flagged as overweight (>30% above target), in the wrong account for tax efficiency, or redundant with a better alternative. Each alert shows the current allocation, a suggested reduced weight, and Claude's rationale for trimming.

### Ticker Search Tab
Look up any ticker symbol against the curated database.

- **Instant lookup**: Type a ticker and press Enter. If it's in the database, you get the full analysis card with thesis, conviction, CAGR, and compound growth projections.
- **20 quick-access chips**: One-click to pull up any curated recommendation.
- **Unknown tickers**: If the ticker isn't in the database, the app gives you a ready-to-paste prompt formatted for Claude AI (claude.ai) — asking for a Canadian investor analysis covering business model, fair value, dividend treatment, TFSA vs RRSP placement, and CAGR estimate.
- **Add to any portfolio**: From a search result, add the security directly to any of your portfolios.
- **Browse view**: When no search is active, shows all 20 curated tickers as a scannable grid.

---

### Options Tab

A covered-call and cash-secured-put planning tool for generating premium income on existing holdings. Four sub-tabs:

**Covered Calls (CC):** Enter ticker, current price, strike, DTE, and contracts. The calculator shows estimated premium, monthly yield, annualised yield, and assignment risk (in-the-money flag).

**Cash-Secured Puts (CSP):** Same fields. Shows cash required to secure the put, estimated premium, and effective purchase cost if assigned.

**Open Trades:** A log of active option positions with strike, DTE remaining, premium received, and a countdown to expiry. Positions expiring within 14 days trigger the **Expiring Options** Morning Radar cell.

**AI Analysis:** Claude scans every holding across all accounts and returns a ranked list of Covered Call and Cash-Secured Put trade suggestions. Each card shows:
- **Risk rating**: Low (far OTM, short DTE) / Medium / High (near/ITM, concentrated)
- **Verdict badge**: Recommended / Caution / Avoid
- Strike, DTE, contracts, estimated premium per share and total, monthly yield %
- Rationale and risk factors specific to that position
- **Pre-fill** button — auto-populates the CC or CSP calculator tab with the suggested parameters

Requires the same Anthropic API key as Market Pulse and Broker Import. If an Investor Profile is set, the AI Analysis weights suggestions by risk tolerance (Conservative profiles see Low-risk trades only; Aggressive profiles see all levels).

---

### Market Pulse Tab
A curated market dashboard that answers two questions — where is the market right now, and where is it likely heading — and then lets you act on the answers directly without leaving the tab.

**Action Center (top of tab):**
The most prominent section. Every action has a priority badge (High / Medium / Low), an action type (Buy / Hold / Reduce / Watch / Rebalance), and a ticker chip that shows the account and current value if you already hold the position.

- **↑ Buy / Add button** — expands an inline panel with an account selector (TFSA/RRSP) and a CAD amount input. As you type, it shows "Currently C$X,XXX → C$Y,YYY after". Press Enter or "Confirm Buy" to update the holding immediately.
- **↓ Reduce button** — expands a panel with a draggable slider (5–100% in 5% steps). The live preview shows "−25% → C$3,710 remaining" as you drag. "Confirm Reduce" updates the holding value.
- **Hold / Watch cards** — show the current account chip and position value but require no action.
- All trades update `holdings` state and persist to localStorage immediately.

**Trade Log (bottom of tab):**
A timestamped record of every buy and reduce action logged from the Action Center — ticker, type, account, amount, and outcome note. Persisted to localStorage across sessions and clearable with one click.

**Regime header + Risk-On/Risk-Off gauge:**
- Current market regime label with a one-paragraph description
- Redesigned **fill-up-to-score gauge**: the track fills from left only to the current score, so unvisited zones stay dark. A score of 44 shows red→orange→yellow fill — no green leaks in. The thumb glows in the zone colour (`risk.color`). Numeric score shown in top-right corner.

**News Flash panel (between macro signals and yield curve):**
Up to 6 recent headlines sourced from Bloomberg, CNBC, Reuters, Financial Times, or WSJ. Each card shows:
- Source badge + date
- Headline
- **Portfolio impact line** naming the specific tickers in your holdings that are affected and how (e.g. "Directly positive for NVDA (TFSA) — reinforces AI capex super-cycle thesis")
- Left-border colour: green = bullish, red = bearish, yellow = neutral

**Macro signals grid (6 panels):**

| Panel | What it covers |
|---|---|
| Equities | S&P 500, TSX Composite, VIX, Nasdaq |
| Rates & Bonds | Fed funds rate, 10Y Treasury, yield curve shape, real yield, breakeven inflation, BoC rate |
| Macro | US CPI, unemployment, oil (WTI), gold, USD/CAD |
| Credit & Risk | HY credit spread (CDX HY), IG credit spread, US HY default rate, bank lending standards |
| Global & Commodities | DXY (US Dollar Index), copper, China PMI, Eurozone CPI |
| Sentiment | Fear & Greed index, AAII bull/bear survey, put/call ratio, earnings revision direction |

Each signal is colour-coded: green = bullish, yellow = caution, red = bearish, white = neutral.

**Yield curve panel:** SVG line chart of the full 3M/2Y/5Y/10Y/30Y curve, spread table (3M–10Y, 2s10s, 5Y–30Y), NY Fed 12-month recession probability bar, inversion history note, trajectory outlook, and BoC/Canadian curve context.

**3-month and 6-month outlook panels:**
Each horizon has three scenario cards — Bull, Base, Bear — each showing probability, trigger condition, S&P 500 target range, Canadian angle (TSX, oil, CAD), portfolio positioning referencing actual held tickers, sector rotation guidance, and key calendar events.

**Bull catalysts vs Bear risks:** Two side-by-side panels listing the main arguments on each side.

> All content in this tab is curated in `src/data/marketPulse.json`. The AI refresh feature (see below) can regenerate the full JSON automatically using your live holdings as context. See [Updating Curated Data](#updating-curated-data) for how to edit it manually.

---

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

## How to Use the App Efficiently

### The recommended workflow

The app has six tabs that work best in a specific order. Follow this loop each time you sit down to manage your portfolio:

```
Market Pulse → Dashboard → Edit Targets → Rebalance → DCA Plan → Ideas (when adding new positions)
```

**Start on Market Pulse.** Check the regime label and Risk-On/Risk-Off score before doing anything else. If the outlook is "Cautious Bull" or "Risk-Off", bias toward a longer DCA window and keep more cash in reserve. If the Action Center has High-priority Buy actions, those are the highest-conviction moves for the current regime.

---

### Step 0 — Read the market environment and act on signals (Market Pulse tab)

Before touching any portfolio numbers, check Market Pulse:

1. **Read the Action Center first.** It sits at the top of the tab for a reason — High-priority actions are the most time-sensitive. If a High Buy is signalled, use the inline Buy panel to log it without switching tabs.
2. **Check the News Flash panel.** Scan the recent headlines — each one names the tickers in your portfolio that are directly affected. A bearish headline on a position you hold is a prompt to check its Reduce action card.
3. **What is the regime?** — "Cautious Bull", "Risk-Off", or "Bull" sets the tone for how aggressively you deploy cash this session.
4. **What does the base-case scenario say?** — If the 3-month base case targets a range below current levels, spread your deployment with a 12–16 week DCA window rather than deploying all at once.
5. **What are the bear risks?** — If the top bear risk is directly relevant to your largest holding, check whether your target allocation still makes sense.

The Action Center, News Flash, and Trade Log mean this tab is now a two-way tool — read it and act on it in the same place.

---

### Step 1 — Get the portfolio picture (Dashboard tab)

Open the Dashboard and start with the **Morning Radar** panel at the top. Click **📡 Refresh Prices** to fetch live closing prices for all holdings — the panel then shows today's estimated P&L, any positions that have drifted significantly from targets, options expiring within 14 days, and your WHT status. These four cells tell you immediately whether today requires active decisions.

Then check the three deeper questions below the Morning Radar:

1. **Am I losing money to WHT?** — The orange "WHT Annual Drag" card shows exactly how much the IRS is withholding from TFSA dividends each year. If the number is above $100/yr, moving the offending positions to RRSP should be your first action.
2. **Are my accounts growing proportionally?** — The TFSA/RRSP allocation bar shows the split. If one account has grown far beyond your intent, that account needs more attention in the rebalance.
3. **Is anything dangerously concentrated?** — The per-account panels flag any position above 20%. If you see a concentration warning, revisit that position's target percentage before running a rebalance.

Only after checking these points should you proceed to the other tabs.

---

### Step 2 — Set up your holdings (Edit Targets tab)

This is the foundation. Bad inputs here make every other tab unreliable.

**Enter every position accurately:**
- `Current $` — use your brokerage's "Market Value" number, not shares × price. Include all accounts separately.
- `Cost Basis $` — your average cost per position (total paid ÷ shares). If you don't have this, leave it blank for now; the P&L columns will show `—` until you fill it in.
- `Target %` — your desired allocation. These must sum to **exactly 100%** (the app turns the total red when they don't). Tip: start with round numbers (5%, 10%, 15%) and fine-tune later.
- `CAGR %` — your personal growth estimate. The default values are reasonable starting points. Change them if you have a different view. These only affect the 10/15/20yr projections — they don't affect rebalancing calculations.

**Recurring contribution field** (top right of Edit Targets): Enter your contribution amount and cadence (weekly, bi-weekly, or monthly) for this account. The app annualizes this and uses a monthly-equivalent flow for growth projections — so a recurring $500 contribution compounds very differently from $0.

> **Best practice**: Export a backup immediately after entering your data the first time (`⬆ Export` in the header). If your browser cache is ever cleared, this JSON is your only recovery option.

---

### Step 3 — Model your rebalance (Rebalance tab)

**Choose your mode:**
- **Cash-only** (default, recommended): Enter how much new cash you're deploying. The app tells you exactly what to buy without selling anything. This is optimal for registered accounts where you want to avoid realizing gains or triggering unnecessary transactions.
- **Full rebalance**: Use this once or twice a year if positions have drifted significantly. Shows both buys and sells. In registered accounts there's no immediate tax impact, so full rebalances are cleaner here than in taxable accounts.

**Use the quick-add buttons** ($500 / $1,000 / $2,500 / $5,000 / $7,000 / $10,000) to quickly model different contribution scenarios before committing. The $7,000 button maps to the 2026 TFSA annual limit.

**Read the buy table before acting:**
- The "Delta" column shows exactly how many dollars of each ticker to buy
- The "After buy %" shows where your allocation lands after the purchase — confirm this matches your intent
- Any concentration warning (>20% in a single position) means your targets may need revisiting

**When the buy amounts look odd:** it usually means your target %s don't sum to 100%, or your current values haven't been updated recently. Go back to Edit Targets and correct those first.

---

### Step 4 — Schedule your purchases (DCA Plan tab)

Once you know your total buy amount from the Rebalance tab, switch to DCA Plan.

**Choosing your DCA window:**
| Situation | Recommended weeks |
|---|---|
| Market is clearly down, high conviction | 4–6 weeks (deploy faster) |
| Market is near highs or uncertain | 12–16 weeks (spread the risk) |
| Very large lump sum (>$25,000) | 20–26 weeks |
| Regular contribution cadence (weekly/bi-weekly/monthly) | Match the cadence you actually fund from payroll |

**Reading the cadence table:** The tickers are sorted by buy priority (largest dollar gap first). Stick to this order — don't reorder based on daily price movement, that defeats the purpose of DCA.

**Currency awareness:** The Exchange column shows whether each ticker trades on the TSX (C$) or NYSE (US$). When your plan includes both currencies, check the `US$X · C$Y` breakdown in the summary — this tells you how to split each contribution-period purchase between CAD and USD accounts within your brokerage.

**The schedule cards:** Use these as a literal checklist. Execute each period as it comes due based on your selected cadence. The calendar view covers the first 12 periods; for longer DCA windows, per-period amounts remain constant.

---

### Step 5 — Optimize account placement (Ideas tab)

Use this tab when you're adding a new position or reviewing whether your existing holdings are in the right accounts.

**The gap detection banner** at the top tells you which sectors you have zero exposure to across both TFSA and RRSP combined. This is a useful prompt — not a mandate. If you see "Healthcare" flagged, filter by "Fills Gaps" to see targeted suggestions.

**The TFSA vs RRSP label on each card is the most important field.** Before adding any US-listed dividend payer to your TFSA, check whether it should be in RRSP instead. The 15% WHT drag on a 2% yield costs you $300/year on a $100,000 position — silently, every year.

**Conviction levels as a sizing guide:**
- `High` conviction → can be a core position (8–15% of portfolio)
- `Medium` conviction → better as a satellite position (3–7%)

**One-click add:** When you find a recommendation you want, click "Add to TFSA" or "Add to RRSP" directly from the card. It creates a placeholder with the ticker pre-filled. Then go to Edit Targets to enter your actual dollar amount and cost basis.

---

### Step 6 — Research unknown tickers (Search tab)

When you encounter a ticker that isn't in the curated list:
1. Type the ticker and press Enter
2. If it's in the database — full analysis appears instantly
3. If it's not — the app generates a **ready-to-paste Claude AI prompt** tailored for Canadian investors

The AI prompt asks specifically about: business model, fair value, dividend treatment, TFSA vs RRSP placement, and CAGR estimate. Copy it, paste it into [claude.ai](https://claude.ai), and you get a structured Canadian-investor analysis in seconds.

---

### Quarterly maintenance routine

A 20–30 minute review every quarter keeps the app accurate:

1. **Update current values** — go to Edit Targets, update each `Current $` to today's market value from your brokerage
2. **Open Dashboard** — check the combined snapshot. Note the TFSA/RRSP split, total USD exposure, WHT drag, and any concentration warnings before touching anything else
3. **Check drift** — switch to Rebalance tab. Positions with large deltas have drifted from targets
4. **Model your contribution** — enter your available cash and see what the rebalance recommends
5. **Review the WHT card** — if the withholding tax number in the Dashboard has grown, consider whether a TFSA→RRSP transfer makes sense at year-end
6. **Export a backup** — one click, keep the last 2–3 JSON files

**When to do a full rebalance instead of cash-only:**
- A position has grown to >25% of portfolio
- You've had a significant contribution room reset (new year TFSA room)
- You're consolidating accounts or transferring between TFSA and RRSP

---

### Common mistakes to avoid

| Mistake | What to do instead |
|---|---|
| Targets don't sum to 100% | The total row turns red — fix before rebalancing |
| Updating current values too infrequently | Stale values produce wrong buy amounts; update before each rebalance |
| DCA window too short on large lump sums | Timing risk increases; use 12+ weeks for amounts over $15,000 |
| US dividend payers in TFSA | Check the Ideas tab — if it says RRSP, move it |
| Never exporting a backup | Do it after every significant change; localStorage can be wiped by browser updates |
| Ignoring concentration warnings | A 25%+ position in a single stock means a bad quarter there tanks your portfolio |

---

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
2. **Market Pulse AI refresh (optional, on-demand only):** When you click "Refresh" or "Copy prompt", the app fetches live market data from Yahoo Finance, FRED, and the CNN Fear & Greed API — public endpoints that receive no portfolio data. If you use the API-key option, your Anthropic API key is stored in `localStorage` only; the prompt sent to the Anthropic API includes live market prices and your current holdings values, but no account numbers, cost basis, or personally identifying information.
3. **Broker CSV Import (optional, on-demand only):** When you upload a broker holdings CSV, its contents are sent to the Anthropic API along with the current USD/CAD rate. The CSV includes ticker symbols, quantities, and market values from your brokerage. No account numbers, names, or SINs are transmitted — only position data. Your API key is stored in `localStorage`; no data is stored server-side by this app.

All Claude API requests are never made automatically — only when you explicitly trigger them.

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
| Bundle size | ~125KB gzipped |

No backend. No database. No authentication library. No state management library. Charts (the Dashboard currency donuts and allocation bars) are rendered as pure SVG and CSS — no charting library dependency. The entire application logic is in a single file: `src/App.jsx`.

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

### Available Scripts

From the project root:

- `npm run dev` — start the local development server
- `npm run build` — produce a production build in `dist/`
- `npm run preview` — locally preview the production build

Typical production verification flow:

```bash
npm run build
npm run preview
```

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

### Troubleshooting

Common fixes when running locally:

- **Port already in use (`5173`)**: run `npm run dev -- --port 4173` to use a different port.
- **Blank page after pulling changes**: stop server, run `npm install`, then restart `npm run dev`.
- **Data missing after browser cleanup**: import your last `portfolio-backup-YYYY-MM-DD.json`.
- **Build errors**: run `npm run build` and fix the first error shown (usually a syntax issue in `src/App.jsx`).
- **Recommendations not appearing**: confirm the ticker is not already present in your active portfolio.

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
    ├── App.jsx           # Entire application (~7,500 lines)
    └── data/
        ├── recommendations.json   # Ideas tab — curated stock/ETF analysis
        └── marketPulse.json       # Market Pulse tab — regime, signals, outlooks
```

The app is intentionally monolithic — no component splitting, no API layer. Curated content lives in two JSON files under `src/data/` so it can be updated without touching application code. `App.jsx` is currently ~7,500 lines; the most recently modified sections are the Morning Radar and live price fetch logic (`fetchLivePrices`), investor profile modal and `profileContext()` helper, multi-account CSV import mapping (`applyCsvImport`, `brokerImportMapping`), AI diversification trim alerts, and the Options tab AI Analysis renderer.

In-depth feature guides live in `docs/`:

```
docs/
├── broker-import.md           # Wealthsimple CSV import walkthrough
├── market-pulse.md            # Market Pulse + Claude API setup
├── canadian-tax-optimization.md  # TFSA vs RRSP placement guide
└── data-customization.md      # Editing recommendations.json and marketPulse.json
```

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

### Add WHT-exempt Canadian tickers (`CAD_EXEMPT` set, line ~241)
```js
const CAD_EXEMPT = new Set(["CNQ","XIU","VFV.TO","ZAG.TO","XRE.TO",
  // Add any CAD-listed ETF or stock that pays no US WHT
]);
```

### Dashboard data is derived automatically
The Dashboard tab reads `holdings["TFSA"]` and `holdings["RRSP"]` directly — it always reflects the latest values you've entered in Edit Targets and respects the USD/CAD rate you've set in the header. No additional configuration is needed. The top-holdings limit (8 per account, 12 combined) can be changed by adjusting the `.slice()` calls inside the `tab === "dashboard"` IIFE, around line ~2460.

After changing defaults, run `npm run dev` to see the changes. The app automatically saves to localStorage on any edit, so default data only loads on first use (or after a reset).

---

## Updating Curated Data

The Ideas tab and Market Pulse tab are both driven by JSON files in `src/data/`. You can update either file in any text editor — no code changes required. After saving, the dev server hot-reloads instantly, or rebuild with `npm run build` for production.

---

### Updating `src/data/recommendations.json`

This file powers the **Ideas tab** and the **Ticker Search** quick-access grid.

#### File structure overview

```json
{
  "lastUpdated": "2026-04-29",
  "marketContext": { ... },
  "recommendations": [ ... ]
}
```

#### Adding a new stock/ETF

Add an object to the `recommendations` array:

```json
{
  "ticker":    "COST",
  "name":      "Costco Wholesale",
  "sector":    "Consumer Staples",
  "bestFor":   "TFSA",
  "conviction":"High",
  "divYield":  0.6,
  "cagr":      12,
  "thesis":    "Membership moat insulates Costco from tariff/recession cycles. Volume pricing power means margins hold even as consumers trade down.",
  "tags":      ["Retail", "Defensive", "Consumer"],
  "fills":     ["consumer"]
}
```

| Field | Type | Notes |
|---|---|---|
| `ticker` | string | Uppercase. Used for search lookup and gap detection |
| `name` | string | Full company name shown on the card |
| `sector` | string | Shown on card and search grid |
| `bestFor` | `"TFSA"` \| `"RRSP"` \| `"Either"` | Drives the filter bar and WHT placement badge |
| `conviction` | `"High"` \| `"Medium"` | High = core position sizing; Medium = satellite |
| `divYield` | number | Annual dividend yield as a percentage (e.g. `0.6` = 0.6%). Use `0` for no dividend |
| `cagr` | number | Your estimated annual growth rate — used in compound projections |
| `thesis` | string | 3–5 sentence investment case. Be specific: why now, what's the edge, what's the risk |
| `tags` | string[] | Used for display only (shown as chips on the card) |
| `fills` | string[] | Sector gap identifiers. Must match the gap categories the app tracks: `"healthcare"`, `"financials"`, `"defense"`, `"fixed income"`, `"real estate"`, `"international"`, `"energy"` |

> **Which account to recommend?** Use `"RRSP"` for any US-listed security paying a dividend above ~1% — the Canada-US treaty eliminates the 15% IRS withholding tax in RRSP. Use `"TFSA"` for growth stocks with zero or near-zero dividends, and for Canadian-listed securities where no WHT applies regardless of account.

#### Removing a stock

Delete its object from the `recommendations` array. The ticker is automatically removed from the quick-access grid.

#### Updating the market context panel

The `marketContext` object powers the banner at the top of the Ideas tab:

```json
"marketContext": {
  "period":           "May 2026",
  "conflictAlert":    "ACTIVE CONFLICT — Middle East",
  "conflictInsights": [
    { "label": "Defense supercycle", "desc": "Explanation of portfolio impact..." }
  ],
  "themes": [
    { "icon": "🛡️", "label": "Defense supercycle", "color": "#f97316", "desc": "One-line context..." }
  ]
}
```

- Remove `conflictAlert` and `conflictInsights` entirely when there is no active conflict
- `themes` should reflect the 6–8 macro drivers most relevant to the current quarter
- `color` accepts any CSS hex colour — use red shades for risks, yellow/orange for caution, green for tailwinds, purple for growth themes

---

### Updating `src/data/marketPulse.json`

This file powers the entire **Market Pulse tab**. Update it whenever the market regime, key data points, or your 3/6-month view changes materially — typically monthly or after significant macro events (FOMC meetings, major earnings seasons, geopolitical shifts).

#### File structure overview

```
marketPulse.json
├── lastUpdated          string    — ISO date shown in the tab header
├── period               string    — Human label, e.g. "May 2026"
├── regime               object    — Current market regime assessment
├── riskMeter            object    — Risk-On / Risk-Off score and label
├── yieldCurve           object    — Full yield curve data, spreads, recession probability
├── macroSignals         array     — 6 signal panels (Equities, Rates, Macro, Credit & Risk, Global & Commodities, Sentiment)
├── newsSignals          array     — Recent headlines from Bloomberg/CNBC/Reuters/FT/WSJ with portfolio impact
├── outlooks             array     — 3-month and 6-month scenario panels
├── catalysts            object    — Bull and bear factor lists
└── portfolioImplication object    — Summary + prioritised action list with type and ticker fields
```

#### Updating the regime

```json
"regime": {
  "label":       "Cautious Bull",
  "sublabel":    "Recovery Mode",
  "color":       "#fbbf24",
  "description": "One paragraph. What's the key tension in markets right now? What's driving the regime?",
  "score":       48
}
```

- `score` is 0–100 and only used internally to derive the Risk-On/Risk-Off needle position — set it consistently with `riskMeter.score`
- `color` sets the regime label colour: `#22c55e` (green, bull), `#fbbf24` (amber, caution), `#ef4444` (red, bear/risk-off)

#### Updating the Risk-On/Risk-Off meter

```json
"riskMeter": {
  "score":    48,
  "label":    "Mildly Risk-Off",
  "sublabel": "One sentence explaining the score.",
  "color":    "#f97316"
}
```

- `score` 0–100: `< 20` = Extreme Risk-Off, `20–40` = Risk-Off, `40–60` = Neutral, `60–80` = Risk-On, `> 80` = Strong Risk-On
- The gauge **fills from the left up to the score** — zones beyond the current score stay dark. A score of 44 shows a yellow fill; green only appears at scores above 60. The thumb glows in `color`.
- `color` should match the zone: `#ef4444` (< 20), `#f97316` (20–40), `#eab308` (40–60), `#84cc16` (60–80), `#22c55e` (> 80)

#### Updating macro signals

Each signal inside a `macroSignals` category has this shape:

```json
{ "label": "VIX", "value": "~20", "trend": "down", "status": "caution", "note": "Off April spike; still elevated" }
```

| Field | Options | Notes |
|---|---|---|
| `label` | string | Indicator name |
| `value` | string | Current value as a formatted string — be human-readable (e.g. `"~4.2%"` not `"0.042"`) |
| `trend` | `"up"` \| `"down"` \| `"sideways"` | Drives the ↑↓→ trend arrow |
| `status` | `"bullish"` \| `"bearish"` \| `"caution"` \| `"neutral"` | Overrides the colour. If omitted, colour is derived from `trend` |
| `note` | string | One short sentence of context — shown as the small grey annotation |

#### Updating 3-month and 6-month scenarios

Each entry in `outlooks` has `horizon` (`"3 months"` or `"6 months"`), `period` (target date label), `scenarios` (array of 3), and `keyEvents` (array of calendar items).

```json
{
  "label":          "Base case",
  "probability":    45,
  "color":          "#fbbf24",
  "icon":           "🟡",
  "trigger":        "What has to happen for this scenario to play out.",
  "marketTarget":   "S&P 5,400–5,750",
  "canadianAngle":  "TSX, oil, CAD implications for a Canadian investor.",
  "positioning":    "What to do in your TFSA/RRSP if this scenario materialises."
}
```

- The three probabilities across Bull/Base/Bear should sum to 100
- `color` conventions: `#22c55e` = bull, `#fbbf24` = base, `#ef4444` = bear
- Keep `canadianAngle` specific — mention TSX level, oil direction, or CAD rate

#### Adding news signals

The `newsSignals` array powers the News Flash panel. Each entry:

```json
{
  "source":          "Bloomberg",
  "headline":        "Fed Officials Signal No Rate Cuts Before Year-End as Services Inflation Stays Sticky",
  "date":            "May 14, 2026",
  "impact":          "bearish",
  "portfolioImpact": "Keeps short-end yields elevated; validates holding ZAG.TO short-duration over long TLT; weighs on VFV.TO and QQQM valuations."
}
```

| Field | Options | Notes |
|---|---|---|
| `source` | string | News outlet name — shown as a source badge |
| `headline` | string | The headline text |
| `date` | string | Human-readable date |
| `impact` | `"bullish"` \| `"bearish"` \| `"neutral"` | Controls the card's left-border and icon colour |
| `portfolioImpact` | string | **Name the specific tickers** held in the portfolio that are affected and how. This is the most important field — it connects the macro news to your actual positions. |

Include 4–8 entries covering the most market-moving headlines since the last update.

#### Updating the portfolio implication

```json
"portfolioImplication": {
  "summary": "2–3 sentence plain-English takeaway for a Canadian TFSA/RRSP investor.",
  "actions": [
    { "priority": "High",   "type": "Buy",  "ticker": "NVDA",  "action": "Specific action referencing the ticker and rationale." },
    { "priority": "High",   "type": "Hold", "ticker": "GOLD",  "action": "..." },
    { "priority": "Medium", "type": "Watch","ticker": "MU",    "action": "..." },
    { "priority": "Low",    "type": "Rebalance", "ticker": "VFV.TO", "action": "..." }
  ]
}
```

| Field | Options | Notes |
|---|---|---|
| `priority` | `"High"` \| `"Medium"` \| `"Low"` | Rendered as a colour-coded badge (red/amber/grey). Aim for at least 3 High actions. |
| `type` | `"Buy"` \| `"Hold"` \| `"Reduce"` \| `"Watch"` \| `"Rebalance"` | Controls the action button that appears on the card. `Buy` and `Rebalance` show a green Buy/Add button. `Reduce` shows a red Reduce button with a slider. |
| `ticker` | string or `null` | The ticker the action applies to. If held in your portfolio, the card shows the account and current value. Set to `null` for general (non-ticker) actions. |
| `action` | string | The guidance text. Be specific — name the ticker, the trigger condition, and the exit thesis. |

- Actions should reference tickers that exist in your portfolio. Generic advice ("stay diversified") wastes the card.
- The **Buy** and **Reduce** buttons directly update `holdings` state and persist to localStorage — no need to switch to Edit Targets.

#### Recommended update cadence

| Event | What to update |
|---|---|
| Monthly | `lastUpdated`, `period`, macro signal values and notes, `newsSignals` |
| After FOMC meeting | Fed funds rate signal, Risk-On/Risk-Off score, 3-month scenario probabilities |
| After major earnings season | Regime description, sentiment signals, catalysts list, `newsSignals` |
| Significant geopolitical shift | `regime`, `riskMeter`, bear catalysts, portfolio implication actions |
| Quarterly | Full review of 6-month outlook scenarios and `portfolioImplication.actions` — ensure tickers still reflect current holdings |

---

## Data Backup and Portability

### Export
Click **💾 Backup** in the header. Downloads a `portfolio-backup-YYYY-MM-DD.json` file with all portfolios, cash balances, cost basis, targets, and custom CAGR values.

### Restore / Import
Click **📂 Restore / Import** and select either:

- A previously exported **JSON** backup (restores all portfolios/settings), or
- An app-format **CSV** file to import holdings quickly.

JSON notes:
- Restores holdings, cash balances, custom portfolios, and contribution settings.
- Old format (without the `portfolios` array) is still supported for backwards compatibility.

App-format CSV notes:
- Required column: `ticker` (or `symbol`)
- Optional columns: `name`, `current`, `costBasis`, `target`, `divYield`, `cagr`, `currency`, `notes`, `account`
- If `account` is present, rows are grouped into matching portfolios (new portfolios are auto-created).
- If `account` is omitted, rows are imported into the currently selected account.

Example CSV:
```csv
ticker,name,current,costBasis,target,divYield,cagr,currency,account,notes
NVDA,Nvidia,5200,3100,14,0,18,USD,TFSA,Core AI growth
ENB,Enbridge,4200,3600,8,7.4,7,CAD,RRSP,Dividend income
```

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
  },
  "contribPlan": {
    "TFSA": { "amount": 500, "frequency": "weekly" },
    "RRSP": { "amount": 1000, "frequency": "monthly" },
    "TAXABLE": { "amount": 0, "frequency": "monthly" }
  }
}
```

---

---

## AI Target Suggestions

The **✨ Suggest Targets with AI** button (purple, in the Edit Targets tab header) analyses your current holdings and proposes optimised target allocations for the active account.

### What it does

1. Reads all holdings for the active account with their current CAD values
2. Checks the current Market Pulse regime and Risk-On/Risk-Off score for context
3. Sends the data to Claude with account-specific rules:
   - **TFSA** — minimise IRS withholding tax drag; favour no/low-dividend growth stocks
   - **RRSP** — favour US dividend payers (WHT-exempt under the Canada-US treaty); balance income and growth
   - **RESP** — conservative; mirror current market-value proportions
   - **Crypto** — split proportionally by market value
4. Returns targets that sum to exactly 100, a refreshed CAGR estimate, and a dividend yield per position
5. Shows a **before/after diff modal** — every ticker shows its old target, new target, and delta (green = increased, red = decreased), plus a one-line rationale

### Preview modal

```
Ticker   Was → Now    Δ      CAGR   Div%   Rationale
NVDA     14%  → 18%  +4%    18%    0.0%   AI compute moat; TFSA-optimal growth
AMZN     10%  → 12%  +2%    15%    0.0%   No WHT drag; cloud + retail flywheel
GLD       5%  →  4%  -1%     6%    0.0%   Reduce slightly; overweight vs. regime
──────────────────────────────────────────────────
TOTAL    100% → 100%
```

Click **✓ Apply targets** to update all targets, CAGRs, and dividend yields at once — or **Cancel** to discard.

### Requirements

- Anthropic API key set in the Market Pulse tab (same key as Market Pulse refresh and Broker Import)
- At least one holding in the active account

---

## Investor Profile

The **👤 Set Profile** button in the app header opens a four-question questionnaire. Answering it tells Claude who you are so every AI feature returns advice calibrated to your actual situation instead of a generic portfolio.

### The four questions

| Question | Options |
|---|---|
| Your current age | Free-text number |
| Target retirement age | Free-text number (default 65) |
| Risk tolerance | Conservative · Balanced · Growth · Aggressive |
| Primary investment goal | Retirement income · Wealth accumulation · Dividend income · Capital preservation |
| Monthly contribution capacity | Free-text CAD amount |

Answers are saved to `localStorage` immediately. The header button updates to a summary chip (e.g. `👤 38yr · growth`) so the active profile is always visible. Click it to re-open the questionnaire pre-filled with your current answers.

### How the profile personalises each AI feature

| Feature | Without profile | With profile |
|---|---|---|
| AI Diversification Analysis | Generic sector-gap suggestions | Sectors and weightings match your risk level and years-to-retirement |
| AI Target Suggestions | WHT-aware allocation defaults | Also factors income vs. growth weighting from your stated goal |
| AI Options Analysis | Standard premium suggestions | Conservative profiles receive Low-risk trades only; Aggressive profiles see all risk levels |
| Ideas Tab | Unfiltered recommendations | Profile strip shows context; Claude weights suggestions to your goal and timeline |

### Risk tolerance levels

| Level | What it means |
|---|---|
| Conservative | Capital preservation; heavier bonds, Canadian defensives, minimal volatility |
| Balanced | Mix of growth and income; moderate equity exposure, Low-risk options only |
| Growth | Maximise long-term wealth; tech-heavy, higher equity concentration, Medium-risk options |
| Aggressive | Maximum growth; concentrated positions, accepts significant drawdowns, all option risk levels |

> See [docs/investor-profile.md](docs/investor-profile.md) for the full guide including worked examples of how each risk level changes AI output.

---

## Broker CSV Import

The **🏦 Import from Broker** button (gold, next to Restore / Import) lets you upload your brokerage's holdings export directly. Claude reads the file, maps every column to the app's internal format, converts currencies, and suggests target allocations — all in one step.

### Supported brokers

Any CSV export that contains the columns below works. Tested with **Wealthsimple**.

| Column in export | Maps to |
|---|---|
| `Account Type` | Portfolio bucket (TFSA, RRSP, RESP, Crypto) |
| `Symbol` | Ticker |
| `Name` | Holding name |
| `Market Value` + `Market Value Currency` | Current value (converted to CAD at the live FX rate) |
| `Book Value (CAD)` | Cost basis |

### How to export from Wealthsimple

1. Open the Wealthsimple app or web → **Activity** → **Holdings**
2. Click **Export** (top right) → **CSV**
3. Save the file — it will be named something like `holdings-report-YYYY-MM-DD.csv`

### Import flow

1. Make sure your **Anthropic API key** is entered in the Market Pulse tab
2. Click **🏦 Import from Broker** in the header
3. Select your broker CSV file — you can import from multiple Wealthsimple accounts in separate passes
4. Claude analyses the file (~5–10 seconds)
5. An **account mapping modal** appears. For each account detected in the CSV (e.g. "Tax-Free Savings Account", "Retirement Savings Plan"), you can:
   - **Rename** — map the broker's account type string to your preferred portfolio name (TFSA, RRSP, Crypto, etc.)
   - **Mode** — choose **Replace** (overwrite existing holdings in that portfolio) or **Merge** (update existing tickers, append new ones, leave everything else untouched)
6. Click **Continue** to see the preview — position count and total CAD value per mapped account
7. Click **✓ Import** to apply — or **Cancel** to discard

**Multi-account import workflow** — importing TFSA and RRSP from separate CSV files:
1. Import the TFSA file. Set TFSA → Replace, skip or ignore any RRSP rows.
2. Import the RRSP file. Set RRSP → Replace. Because the mode is per-account, TFSA holdings are untouched.
3. To top-up a single account without wiping it: use **Merge** mode — tickers already present are updated by value; new tickers are appended; everything else is left exactly as it was.

### What Claude does automatically

- Groups all positions by `Account Type` (TFSA, RRSP, RESP, Crypto)
- Converts USD market values to CAD using the app's current FX rate
- Sets `currencyOverride` to `"USD"` for US-listed positions so the rebalance tab shows the correct native currency
- Suggests target % allocations per account (summing to 100 per account), optimised for:
  - **TFSA**: growth stocks with no or minimal dividends (no WHT drag)
  - **RRSP**: US dividend payers (WHT-exempt under the Canada–US treaty)
  - **RESP**: proportional to current market values (balanced)
  - **Crypto**: proportional to market value
- Estimates dividend yield and 5-year CAGR per ticker
- Writes a one-line rationale in the `notes` field for each position

### After importing

Targets are Claude's best suggestion — review them in the **Edit Targets** tab and adjust to match your actual investment plan. Run a **Full Rebalance** pass to see what changes the new targets imply before acting.

> For a detailed walkthrough with screenshots, see [docs/broker-import.md](docs/broker-import.md).

---

## Disclaimer

This application is for **personal financial planning and educational purposes only**. It is not financial advice. The recommendations, CAGR estimates, investment theses, and market commentary are opinions, not guarantees. Past performance does not predict future results.

Always verify your allocation and trade calculations with your brokerage before executing any transaction. Consult a licensed **Certified Financial Planner (CFP)** or **Investment Advisor** before making significant investment decisions.

Tax rules, contribution limits, and withholding tax treaties are subject to change. This app reflects rules as understood at the time of development (May 2026).

---

## License

MIT License — free to use, modify, fork, and deploy for personal use. Attribution appreciated but not required.
