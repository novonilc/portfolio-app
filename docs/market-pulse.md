# Market Pulse & Claude API

The Market Pulse tab is the app's AI-powered market dashboard. It shows the current market regime, macro signals, recent news with portfolio impact, 3/6-month scenarios, and an Action Center where you can buy and reduce positions without leaving the tab.

---

## Setting up your Anthropic API key

The Market Pulse AI refresh and the Broker CSV Import both require an Anthropic API key.

### Get a key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up for a free account (no credit card required for limited usage)
3. Navigate to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

### Enter the key in the app

1. Open the **Market Pulse** tab
2. Scroll to the field labelled **Anthropic API Key**
3. Paste your key — it saves automatically to `localStorage` on every keystroke
4. The key field uses `type="password"` so it is masked on screen

The key is stored only in your browser's `localStorage`. It is never sent anywhere except directly to `api.anthropic.com` when you trigger a refresh or a broker import.

---

## Using the AI refresh

### Automatic vs. manual

Market Pulse data does **not** refresh automatically. The data in `src/data/marketPulse.json` is the baseline — it displays until you trigger a refresh or paste a Claude response.

### Option 1 — Direct API refresh (recommended)

Click **⚡ Refresh with Claude** in the Market Pulse tab.

The app:
1. Fetches live data from Yahoo Finance, FRED, and the CNN Fear & Greed API
2. Builds a prompt that includes the live signals and your current holdings
3. Sends it to the Anthropic API using `claude-sonnet-4-6`
4. Parses the JSON response and updates the tab in place
5. Caches the result in `localStorage` so it survives a page reload

This takes 10–30 seconds. The "last refreshed" timestamp appears next to the button.

### Option 2 — Copy prompt / paste response

If you prefer to use [claude.ai](https://claude.ai) directly (free tier, no API key needed):

1. Click **📋 Copy Prompt** — the full prompt is copied to your clipboard
2. Open [claude.ai](https://claude.ai) and paste the prompt
3. Copy Claude's response (the raw JSON)
4. Click **📥 Paste Response** in the app and paste the JSON
5. The tab updates immediately

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

## Troubleshooting

### "Enter your Anthropic API key first"

Scroll to the API key field in Market Pulse, paste your key, and try again.

### "Response is missing required fields — try again"

Claude occasionally returns a partial or malformed response under load. Click Refresh again — the second attempt almost always succeeds.

### The gauge shows the wrong colour

The gauge colour is determined by `riskMeter.color` in `marketPulse.json`, not by the score automatically. If they're out of sync, edit the JSON to match. See [docs/data-customization.md](data-customization.md).

### Action cards reference tickers I don't hold

The AI refresh prompt includes your current holdings. If the actions don't match your portfolio, the cached data is stale — click Refresh to regenerate with your latest holdings.
