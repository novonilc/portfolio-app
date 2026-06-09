# Market Pulse & Claude AI

The Market Pulse tab is the app's AI-powered market dashboard. It shows the current market regime, macro signals, recent news with portfolio impact, 3/6-month scenarios, and an Action Center where you can buy and reduce positions without leaving the tab.

The **Ideas tab** also includes a daily **BNN Bloomberg Market Call** section — expert analyst stock picks from the last 5 broadcast days, parsed and structured automatically by Claude AI. See [BNN Bloomberg Picks](#bnn-bloomberg-market-call-picks) below.

> **Also see:** The [🧠 AI Advisor tab](../README.md#ai-advisor-tab) (Pro plan) provides 10 expert prompt templates that auto-inject your portfolio context, letting you ask open-ended questions like "run a risk management review" or "analyse semiconductor exposure" without copying your holdings manually.

---

## Requirements

**AI refresh requires the Pro plan.** Basic plan users see an upgrade link in place of the Refresh button.

No Anthropic API key is needed — Claude is accessed through the app's secure backend proxy, included in the Pro subscription. You get **10 AI calls per day** (resets midnight UTC). Typical usage is 2–3 calls per day.

---

## Using the AI refresh

### Automatic vs. manual

There are now **two levels of automation**:

| Level | How it works | Who controls it |
|---|---|---|
| **Scheduled server refresh** | A Vercel Cron Job calls `api/refresh-pulse` on a configurable schedule (default: every Monday 6am UTC). The result is saved to Vercel Blob and loaded automatically by every user on their next app open. No license required to benefit — all users get it. | Configured in `vercel.json` |
| **Manual AI refresh** | You click ⚡ Refresh with AI. The app fetches live signals, includes your personal holdings, and calls Claude. Result is cached in your browser. | Pro plan, 10 calls/day |

The scheduled refresh provides **generic macro data** (no user-specific portfolio actions, since the server doesn't know your holdings). The manual refresh produces **personalised actions** referencing your actual tickers. Use both: the schedule keeps the background data current; click Refresh before an important rebalance to personalise the Action Center.

#### Changing the refresh schedule

Edit `vercel.json` in the project root:

```json
"crons": [
  { "path": "/api/refresh-pulse", "schedule": "0 6 * * 1" }
]
```

Common schedules:

| Schedule | Cron expression |
|---|---|
| Every Monday at 6am UTC | `0 6 * * 1` |
| Every day at 6am UTC | `0 6 * * *` |
| Twice a week (Mon + Thu) | `0 6 * * 1,4` |
| First of the month | `0 6 1 * *` |

After editing `vercel.json`, push to deploy — Vercel picks up the new schedule automatically.

#### Triggering a manual server refresh (admin)

```bash
curl -X POST https://your-app.vercel.app/api/refresh-pulse \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

`CRON_SECRET` is set in Vercel → Settings → Environment Variables. Vercel also injects it automatically for cron invocations.

### Option 1 — One-click AI refresh (Pro plan)

Click **⚡ Refresh with AI** in the Market Pulse tab.

The app:
1. Fetches live data from Yahoo Finance, FRED, and the CNN Fear & Greed API
2. Builds a prompt that includes the live signals and your current holdings
3. Sends it to the Anthropic API using `claude-sonnet-4-6`
4. Parses the JSON response and updates the tab in place
5. Caches the result in `localStorage` so it survives a page reload

This takes 10–30 seconds. The "last refreshed" timestamp appears next to the button.

### Option 2 — Copy prompt / paste response (any plan)

If you prefer to use [claude.ai](https://claude.ai) directly, or if you've used your daily AI calls:

1. Click **📋 Copy Prompt** — the full prompt is copied to your clipboard
2. Open [claude.ai](https://claude.ai) (free account works) and paste the prompt
3. Copy Claude's response (the raw JSON)
4. Click **📥 Paste Response** in the app and paste the JSON
5. The tab updates immediately — no AI call is counted against your daily limit

### How often to refresh

| Event | Recommended action |
|---|---|
| Monthly routine | Full AI refresh |
| After FOMC meeting | Refresh — rate signals and risk meter will change |
| After major earnings (NVDA, MSFT, etc.) | Refresh — regime description and actions may change |
| After significant geopolitical event | Refresh — bear catalysts and news signals update |
| Daily routine | Not needed — the data is strategic, not real-time |

---

## Reading the Action Center

The Action Center is the first thing you see in the Market Pulse tab. Every action card has:

| Element | What it means |
|---|---|
| Priority badge (🔴 High / 🟡 Medium / ⚫ Low) | How time-sensitive the action is |
| Action type (Buy / Hold / Reduce / Watch / Rebalance) | What Claude recommends doing |
| Ticker chip | The security affected. If you hold it, the chip shows the account and current value |
| Action text | The specific rationale and trigger condition |

### Executing a Buy

1. Click **↑ Buy / Add** on any card
2. An inline panel expands with:
   - Account selector (TFSA / RRSP / any custom portfolio)
   - CAD amount input
   - Live preview: "Currently C$X,XXX → C$Y,YYY after"
3. Enter an amount and press **Enter** or click **Confirm Buy**
4. The holding updates immediately and the trade is logged

### Executing a Reduce

1. Click **↓ Reduce** on any card
2. An inline panel expands with:
   - A percentage slider (5–100% in 5% steps)
   - Live preview: "−25% → C$3,710 remaining"
3. Drag the slider to your target reduction
4. Click **Confirm Reduce**
5. The holding value updates and the trade is logged

Both Buy and Reduce update `holdings` state and persist to `localStorage` immediately. You do not need to go to Edit Targets to see the change — the header stat cards update in real time.

---

## Reading the Risk-On/Risk-Off gauge

The gauge runs from 0 (Extreme Risk-Off) to 100 (Strong Risk-On).

| Score range | Zone | Meaning |
|---|---|---|
| 0–20 | Extreme Risk-Off | Defensive positioning — cash, bonds, gold |
| 20–40 | Risk-Off | Reduce equity exposure; favour defensives |
| 40–60 | Neutral | Balanced — neither aggressive nor defensive |
| 60–80 | Risk-On | Lean into growth equities |
| 80–100 | Strong Risk-On | Full equity deployment; growth over value |

The track fills from the left only up to the current score. A score of 44 shows a yellow fill from 0 to 44 — zones above 44 stay dark. The needle glows in the zone colour.

---

## The News Flash panel

Located between the macro signals grid and the yield curve, the News Flash panel shows up to 6 recent headlines from Bloomberg, CNBC, Reuters, Financial Times, or WSJ.

Each card shows:
- **Source badge** and date
- **Headline**
- **Portfolio impact line** — names the specific tickers you hold that are affected and explains how

Left-border colour: green = bullish for your portfolio, red = bearish, yellow = neutral.

To update news manually: edit the `newsSignals` array in `src/data/marketPulse.json`. See [docs/data-customization.md](data-customization.md) for the full field reference.

---

## The Trade Log

Every Buy and Reduce action taken from the Action Center is recorded in the Trade Log at the bottom of the Market Pulse tab.

Each entry shows:
- Timestamp
- Ticker and account
- Action type (Buy / Reduce)
- Amount or percentage
- Notes from the action card

The log persists across sessions (stored in `localStorage`). Clear it with the **Clear Log** button when it becomes too long.

---

## BNN Bloomberg Market Call Picks

### What it is

Every weekday morning, BNN Bloomberg airs its *Market Call* segment — a live show where guest analysts from Canadian investment firms share their current buy, hold, and sell recommendations on specific stocks. Portfolio Rebalancer Pro parses these picks automatically and makes them available in the **💡 Ideas** tab.

### How it works

1. A Vercel Cron Job (`/api/refresh-bnn`) runs on weekdays at **1:00 PM UTC (9:00 AM ET)** — shortly after the live broadcast
2. It fetches the latest analyst calls from a public aggregator
3. Claude AI extracts structured data: ticker, analyst name, firm, action (Buy / Hold / Sell), and a one-sentence rationale
4. The result is saved to Vercel Blob and loaded automatically the next time you open the app
5. Picks are organised into three sections: **Canadian stocks**, **US stocks**, and **ETFs**

### Refresh schedule

```json
{ "path": "/api/refresh-bnn", "schedule": "0 13 * * 1-5" }
```

This runs Monday–Friday. Weekend calls are not parsed (BNN does not air Market Call on weekends). Monday morning's tab shows Friday's picks until the Monday broadcast is processed.

### Reading the picks

The BNN section shows the **last 5 broadcast days**. The most recent session loads expanded; earlier days collapse behind a toggle so the tab stays scannable. Each day's header shows the broadcast date and a count of picks.

Each pick card shows:

| Field | Example |
|---|---|
| Ticker | `CNQ` |
| Company | Canadian Natural Resources |
| Analyst | Peter Hodson · 5i Research |
| Action | **▲ BUY** / **→ HOLD** / **▼ SELL** |
| Rationale | One-sentence summary of the analyst's thesis |

Cards are colour-coded by action: green border for Buy, amber for Hold, red for Sell. Picks are organised into three sections per day: **Canadian stocks**, **US stocks**, and **ETFs**.

### Caveats

- These are **third-party analyst opinions**, not investment advice from Portfolio Rebalancer Pro
- Analyst calls reflect conditions at the time of broadcast — macro or company news since then may make them stale
- Not every broadcast session is parsed — occasional network or parsing failures are possible; the tab shows the most recently successful refresh
- Holdings in your own portfolio are not cross-referenced against BNN picks automatically — use the Ideas tab to manually evaluate whether a pick fits your allocation

---

## Troubleshooting

### "AI Market Pulse refresh requires the Pro plan"

Your active license is Basic. Click **Upgrade →** next to the button to go to the Pro checkout, or use the Copy Prompt / Paste Response fallback with [claude.ai](https://claude.ai) instead.

### "Daily AI limit reached"

You've used all 10 AI calls for today. The limit resets at midnight UTC. In the meantime, use the Copy Prompt / Paste Response fallback — it doesn't consume a daily call.

### "Response is missing required fields — try again"

Claude occasionally returns a partial or malformed response under load. Click Refresh again — the second attempt almost always succeeds.

### The gauge shows the wrong colour

The gauge colour is determined by `riskMeter.color` in `marketPulse.json`, not by the score automatically. If they're out of sync, edit the JSON to match. See [docs/data-customization.md](data-customization.md).

### Action cards reference tickers I don't hold

The AI refresh prompt includes your current holdings. If the actions don't match your portfolio, the cached data is stale — click Refresh to regenerate with your latest holdings.
