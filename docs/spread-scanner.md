# Vertical Spread Scanner

The Spread Scanner is a daily automated technical analysis tool inside the Options tab. It scans 35+ liquid US optionable tickers every morning at **7:00 AM PST**, scores each one for vertical spread suitability using five technical signals, and surfaces a clear recommendation — so you spend your time evaluating setups, not hunting for them.

---

## How to access it

1. Open the app and go to the **⚡ Options** tab
2. Click the **📊 Spread Scanner** sub-tab
3. The latest scan loads automatically — no button required
4. Click **⟳ Refresh** to pull the latest blob if you want to re-check during the day

---

## What it scans

The scanner covers **35+ liquid optionable tickers** across major sectors:

| Category | Tickers |
|---|---|
| Mega-cap tech | AAPL, MSFT, NVDA, AMD, META, GOOGL, AMZN, TSLA, PLTR, ARM |
| Financials | JPM, BAC, GS, V, BRK.B |
| Healthcare | LLY, JNJ, ISRG, NVO |
| Energy | XOM, CVX, CNQ |
| Defense / Industrial | RTX, AXON |
| Consumer | COST, SHOP |
| High-beta / speculative | SOFI, COIN, MARA |
| ETFs (highest liquidity) | SPY, QQQ, IWM, XLF, XLE, XLK |

These tickers were chosen for **options liquidity** — tight bid/ask spreads, high open interest, and enough average daily volume to fill vertical spread orders at reasonable prices.

---

## The five signals

Each ticker is analysed using one year of daily OHLCV data fetched from Yahoo Finance.

### 1. Volume Ratio (vs. 20-day average)

**What it measures:** How much the current day's volume deviates from the trailing 20-day average.

**Why it matters for spreads:** Higher volume = tighter bid/ask spreads in the options chain. A ratio below 0.6× is a yellow flag — fills on the short leg of a spread may be poor at the mid price.

| Ratio | Signal |
|---|---|
| ≥ 2.0× | Strong — excellent liquidity |
| ≥ 1.5× | Good |
| 1.0–1.5× | Normal |
| < 0.6× | Low — widen your limit orders |

### 2. RSI (14-period)

**What it measures:** Relative Strength Index using Wilder smoothing over the last 14 daily closes.

**Why it matters for spreads:** Extreme RSI values carry gap risk. The **35–65 zone** is ideal for premium sellers — the stock has directional momentum but hasn't reached an extreme that invites a reversal gap against your short strike.

| RSI | Signal |
|---|---|
| 35–65 | Sweet spot for premium selling |
| 28–35 or 65–73 | Acceptable but be selective |
| < 28 or > 73 | Avoid — gap risk is elevated |

### 3. MACD (12 / 26 / 9)

**What it measures:** The difference between 12-period and 26-period EMAs (the MACD line), smoothed by a 9-period EMA (the Signal line). The histogram = MACD minus Signal.

**Why it matters for spreads:** A positive histogram with rising magnitude indicates bullish momentum → **Bull Put Spread** territory. A negative histogram with falling magnitude → **Bear Call Spread**. A flat histogram near zero → consider a neutral **Iron Condor**.

| Histogram | Interpretation |
|---|---|
| Positive and growing | Bullish — consider selling put spreads below support |
| Negative and falling | Bearish — consider selling call spreads above resistance |
| Near zero / crossing | Neutral — condor or wait for clarity |

### 4. SMA 50 & SMA 200

**What it measures:** Simple moving averages of the last 50 and 200 daily closing prices.

**Why it matters for spreads:**

- **Price above SMA 50:** Medium-term uptrend — bullish bias, put spreads align with trend
- **SMA 50 > SMA 200 (Golden Cross):** Long-term uptrend confirmed — high-conviction bullish setups
- **SMA 50 < SMA 200 (Death Cross):** Long-term downtrend — call spreads or flat trades only
- **Price well below SMA 50:** Strong downtrend — avoid bull put spreads regardless of RSI

The scanner flags Golden Cross and Death Cross on each card.

### 5. VWAP (20-day volume-weighted average price)

**What it measures:** The volume-weighted average of the Typical Price `(H+L+C)/3` over the last 20 trading days.

**Why it matters for spreads:** Price clustering near the 20-day VWAP signals a stable, range-bound stock — ideal conditions for defined-risk spreads where you're collecting premium without a strong trend running against you. Price far from VWAP in either direction suggests momentum that may continue.

| Distance from VWAP | Signal |
|---|---|
| Within ±1.5% | Stable — good for range spreads |
| ±1.5% – ±4% | Some momentum, directional trades possible |
| > ±4% | Extended — trend may continue or mean-revert sharply |

---

## The spread score (0–100)

All five signals are combined into a single **Spread Score**:

| Score | Recommendation | Meaning |
|---|---|---|
| ≥ 65 + bullish signals | **Bull Put Spread** | Sell a put spread below current support |
| ≥ 65 + bearish signals | **Bear Call Spread** | Sell a call spread above current resistance |
| ≥ 65 + neutral | **Iron Condor** | Sell both sides — low directional conviction, range-bound |
| 48–65 | **Caution** | Tradeable but verify each signal individually before sizing up |
| < 48 | **Skip** | Insufficient signal clarity or poor liquidity |

**Direction** is determined by comparing bull signals (RSI > 50, positive MACD, price above SMA 50, price above VWAP) versus bear signals. A 3-signal margin in either direction calls it directional; otherwise the ticker is rated Neutral.

---

## Reading a scanner card

Each ticker card shows:

```
NVDA  ▲  [Bull Put Spread]  [Golden ✕]
$897.40  +1.2%

SPREAD SCORE  ──────────────── 82

VOLUME RATIO   VWAP (20d)       RSI (14)
1.8×           $851.20          54.2
vs 20d avg     +5.4% vs VWAP   Neutral zone

SMA 50         SMA 200          MACD
$821.40        $718.90          ▲ +0.840
↑ 9.3% above   ↑ 25.0% above   Bullish momentum

52w: $415.40 – $974.00
Bias: sell put spreads below support
```

- **Direction indicator** (▲ bullish / ▼ bearish / ◈ neutral)
- **Recommendation badge** in matching colour
- **Golden Cross / Death Cross** badge when SMA 50/200 relationship is significant
- **Price change** since prior close
- **Score bar** colour-coded: green ≥ 65 · amber 48–65 · red < 48
- **Six signal cells** — each shows the computed value plus a one-line context label
- **52-week range** for strike selection context
- **Bias line** — plain-English suggestion on which side to sell

---

## How to use the scanner in your workflow

### Before selecting a spread

1. Open the scanner — tickers are sorted by score (highest first)
2. Filter to stocks you already hold or have conviction on
3. Look for score ≥ 65 + recommendation matching your directional view
4. Cross-check RSI (not at an extreme) and Volume ratio (≥ 1.0×)
5. Verify the setup in your broker's live options chain before placing

### Combining with the CC / CSP tabs

- **Bull Put Spread candidate** → go to the CSP tab for the same ticker to size your collateral and check strike suggestions
- **Bear Call Spread candidate** → go to the CC tab to model a short call position above resistance
- After placing the trade, log it in the **📋 Trade Log**

### Combining with AI Analysis (Pro)

The AI Options Analysis (Pro) uses your actual holdings and cash to suggest CC and CSP trades. The Spread Scanner is complementary — it surfaces tickers worth investigating across the broader market, not just your portfolio. Use the scanner first to build a watchlist, then run AI Analysis to get trade-specific suggestions on what you actually hold.

---

## Automatic refresh schedule

The scanner is powered by a **Vercel Cron Job** (`/api/refresh-options-signals`) that runs every day at 7:00 AM PST (15:00 UTC):

```json
{ "path": "/api/refresh-options-signals", "schedule": "0 15 * * *" }
```

This means:
- Data is fresh by the time US pre-market opens (9:30 AM ET is 6:30 AM PST — scanner fires 30 minutes before that)
- Weekends still refresh, so Monday morning data is ready when the market opens
- The "Last refresh" timestamp on the scanner tab shows when the data was computed

To manually trigger a refresh (admin / self-hosting):

```bash
curl -X GET https://your-domain.vercel.app/api/refresh-options-signals \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Customizing the ticker list

The scanner list is defined in `api/refresh-options-signals.js` at the top of the file:

```js
const SCAN_TICKERS = [
  "AAPL", "MSFT", "NVDA", ...
];
```

To add or remove tickers, edit this array and redeploy to Vercel. No other changes are needed — the indicator computation is fully dynamic and adapts to any optionable ticker available on Yahoo Finance.

**Tips for adding tickers:**
- Stick to US-listed tickers with weekly options (most liquid)
- Avoid penny stocks, micro-caps, or OTC tickers — Yahoo Finance data quality is poor for these
- Canadian tickers (e.g. `CNQ.TO`) can be added but options liquidity on the TSX is limited
- ETFs with weekly options (SPY, QQQ, IWM, GLD, TLT) work especially well

---

## Limitations and important caveats

- **Signals are computed on daily closing data** — intraday price action is not reflected until the next day's close
- **Premium estimates are not provided** — use your broker's live options chain to check bid/ask and IV
- **The score does not account for upcoming earnings** — never sell short-premium spreads into a scheduled earnings release; the IV crush or beat/miss can blow through your short strike
- **MACD and SMA require sufficient history** — tickers with less than 30 days of trading history are excluded from the scan
- **Not financial advice** — the scanner identifies technical conditions that historically favour defined-risk spread trades. Market conditions change; always size positions appropriately and verify in your broker's platform before trading.

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| "No scan data yet" shown | The cron hasn't run yet. Click **⟳ Refresh** to pull the latest, or wait until 7 AM PST |
| Ticker missing from results | It may have been excluded due to insufficient data or a Yahoo Finance fetch error. Check `errors` in the raw API response |
| Score seems wrong | Scores reflect the prior day's close — intraday moves aren't captured until overnight |
| Refresh button returns an error | The Vercel Blob hasn't been populated yet. Trigger the cron manually (admin only) |

---

*Not financial advice. Technical signals are educational tools — always verify with your broker before placing any trade.*
