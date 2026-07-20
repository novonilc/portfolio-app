# Vertical Spread Scanner

The Spread Scanner is a daily automated technical analysis tool inside the Options tab. It scans 69 liquid optionable tickers every morning at **5:30 PM ET (after close)**, scores each one for vertical spread suitability using eight technical signals, and surfaces a clear recommendation with a full trade ticket — so you spend your time evaluating setups, not hunting for them or working out strikes by hand.

---

## How to access it

1. Open the app and go to the **⚡ Options** tab
2. Click the **📊 Spread Scanner** sub-tab
3. The latest scan loads automatically — no button required
4. Click **⟳ Refresh** to pull the latest blob if you want to re-check during the day

---

## What it scans

The scanner covers **69 liquid optionable tickers** across major sectors:

| Category | Tickers |
|---|---|
| Mega-cap tech | AAPL, MSFT, NVDA, AMD, META, GOOGL, AMZN, TSLA, PLTR, ARM |
| Cloud / SaaS | SNOW, DDOG, CRWD, ZS, NET, MDB, TEAM |
| Semiconductors | AVGO, QCOM, MU, SMCI, AMAT, LRCX |
| Financials | JPM, BAC, GS, V, BRK.B, SCHW, MS, C |
| Healthcare & Pharma | LLY, JNJ, ISRG, NVO, UNH, MRNA, ABBV |
| Energy | XOM, CVX, CNQ, OXY |
| Defense / Industrial | RTX, AXON, GE, BA |
| Consumer & Retail | COST, SHOP, NFLX, SBUX, HD, NKE |
| Fintech & Payments | SQ, PYPL, HOOD |
| EV & Mobility | RIVN, F, GM |
| High-beta / speculative | SOFI, COIN, MARA |
| ETFs (highest liquidity) | SPY, QQQ, IWM, XLF, XLE, XLK, GLD, XBI |

These tickers were chosen for **options liquidity** — tight bid/ask spreads, high open interest, and enough average daily volume to fill vertical spread orders at reasonable prices.

---

## The eight signals

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

### 6. ATR% (14-period Average True Range)

**What it measures:** The 14-period Average True Range as a percentage of the current price — how wide the stock's typical daily range is.

**Why it matters for spreads:** Tighter daily ranges mean the underlying is less likely to gap through a short strike between now and expiry, which favours defined-risk premium selling. Very wide ranges increase the odds of a fast move blowing through both legs.

| ATR% | Signal |
|---|---|
| < 1.5% | Tight range — favourable for premium selling |
| 1.5% – 3.5% | Normal |
| > 5.0% | Wide — size down or avoid |

### 7. HV20 (20-day historical volatility)

**What it measures:** Annualised historical volatility computed from the last 20 days of log returns — the scanner's proxy for implied volatility, since it doesn't have access to a live options chain.

**Why it matters for spreads:** This is also what drives the trade ticket's credit estimate (`IV ≈ HV20 × 1.25`, see below). A moderate HV20 means enough premium to make a spread worthwhile without being priced for wild, unpredictable moves.

| HV20 (annualised) | Signal |
|---|---|
| 18% – 45% | Sweet spot — meaningful premium, not chaotic |
| > 55% | Elevated — verify against live IV before sizing |

### 8. Bollinger Band position (20-period, 2σ)

**What it measures:** Where the current price sits within its 20-day Bollinger Bands, from 0 (lower band) to 1 (upper band).

**Why it matters for spreads:** Mid-range readings suggest a range-bound stock — good Iron Condor territory. Readings near either extreme suggest the stock is stretched and more likely to continue or snap back, which favours a directional put or call spread over a neutral condor.

| BB position | Signal |
|---|---|
| 0.25 – 0.75 | Mid-range — Iron Condor territory |
| < 0.20 | Near lower band — bullish mean-reversion bias |
| > 0.80 | Near upper band — bearish mean-reversion bias |

---

## The spread score (0–100)

All eight signals are combined into a single **Spread Score**:

| Score | Recommendation | Meaning |
|---|---|---|
| ≥ 65 + bullish signals | **Bull Put Spread** | Sell a put spread below current support |
| ≥ 65 + bearish signals | **Bear Call Spread** | Sell a call spread above current resistance |
| ≥ 65 + neutral | **Iron Condor** | Sell both sides — low directional conviction, range-bound |
| 48–65 | **Caution** | Tradeable but verify each signal individually before sizing up |
| < 48 | **Skip** | Insufficient signal clarity or poor liquidity |

**Direction** is determined by comparing bull signals (RSI > 50, positive MACD, price above SMA 50, price above VWAP) versus bear signals. A 3-signal margin in either direction calls it directional; otherwise the ticker is rated Neutral.

### Strategy style toggle

A **Strategy style** control at the top of the scanner switches what each score turns into:

| Style | Bullish score ≥ 65 | Bearish score ≥ 65 | Neutral score ≥ 65 |
|---|---|---|---|
| **Premium Selling** (default) | Bull Put Spread | Bear Call Spread | Iron Condor |
| **Directional / Vol** | Long Call | Short Call ⚠ (undefined risk) | Long Straddle / Long Strangle when HV20 is unusually low |

Premium Selling recommends defined-risk credit spreads. Directional / Vol recommends debit trades instead — a straight long call or put on strong directional conviction, or a straddle/strangle when the setup is neutral but historical volatility is low (cheap options, coiled for a breakout). The Short Call recommendation carries an explicit undefined-risk warning since it's a naked short position, not a spread.

### Trade ticket

Every ticker scoring high enough for a recommendation (not Caution or Skip) gets a full trade ticket, not just a label:

- **Legs** — exact strikes to sell/buy, rounded to realistic increments for the stock's price
- **Credit / debit estimate** — a simplified Black-Scholes calculation using `IV ≈ HV20 × 1.25` as the volatility input (HV20 is the ticker's own measured 20-day historical volatility, not a market-wide guess)
- **Max loss / max gain**, per share and per contract
- **Breakeven price(s)**
- **Payoff diagram** — an SVG P&L-at-expiry chart with the breakeven and current price marked
- **Target expiry** (~35 DTE) and a one-line rationale (e.g. "Short put anchored near support")

These are estimates, not live quotes — always verify strikes and pricing in your broker's options chain before placing a trade.

### 🗓 Earnings guard

A weekly cron (`api/refresh-fmp?job=earnings-calendar`) pulls upcoming earnings dates for the scan universe from Financial Modeling Prep. If a ticker's next earnings date falls inside its trade ticket's ~35 DTE expiry window, the card shows a 🗓 badge and an inline warning — selling premium into an earnings report risks a sharp IV crush or a gap that jumps straight through your short strike, and price technicals alone can't see that coming. This is a heads-up, not a score adjustment: the Spread Score itself is unchanged, so use your own judgment on shortening the DTE, sizing down, or skipping the trade entirely.

---

## Reading a scanner card

Each ticker card shows:

```
NVDA  ▲  [Bull Put Spread]  [Golden ✕]  [🗓 Earnings Jul 24]
$897.40  +1.2%

SPREAD SCORE  ──────────────── 82

VOLUME RATIO   VWAP (20d)     RSI (14)      SMA 50
1.8×           $851.20        54.2          $821.40
vs 20d avg     +5.4% vs VWAP  Neutral zone  ↑ 9.3% above

SMA 200        MACD           ATR%          HV20
$718.90        ▲ +0.840       1.4%          32.1%
↑ 25.0% above  Bullish        Tight range   Sweet spot

P&L AT EXPIRY (per share)
[payoff diagram]

SELL $870 Put   BUY $865 Put
WIDTH $5   CREDIT $1.80   MAX LOSS $3.20   BREAK-EVEN $868.20

📅 ~35 DTE · target Aug 18          Short put anchored near support (SMA50 $821.40)
⚠ Earnings Jul 24 (12d away) — inside this trade's expiry window.
Expect an IV crush / gap risk; consider a shorter DTE or skip.

52w: $415.40 – $974.00
```

- **Direction indicator** (▲ bullish / ▼ bearish / ◈ neutral)
- **Recommendation badge** in matching colour, plus a 🗓 earnings badge when applicable
- **Golden Cross / Death Cross** badge when SMA 50/200 relationship is significant
- **Price change** since prior close
- **Score bar** colour-coded: green ≥ 65 · amber 48–65 · red < 48
- **Eight signal cells** — each shows the computed value plus a one-line context label
- **Payoff diagram** with the trade's legs, credit/debit, max loss/gain, and breakeven
- **Expiry + rationale** line, and an earnings warning line when the trade's window overlaps a report
- **52-week range** for strike selection context

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

The scanner is powered by a **Vercel Cron Job** (`/api/refresh-options-signals`) that runs **weekdays at 5:30 PM ET (21:30 UTC)** — after NYSE and TSX close:

```json
{ "path": "/api/refresh-options-signals", "schedule": "30 21 * * 1-5" }
```

This means:
- Signals reflect today's **complete** trading session (closing price, full-day volume, final MACD/RSI values) — not yesterday's stale data
- **Weekdays only** — no wasted runs Saturday/Sunday when options markets are closed and Yahoo Finance serves unchanged Friday data
- Data is ready for **evening review** (plan entries for tomorrow) and persists through the night for pre-market checks
- The "Last refresh" timestamp on the scanner tab shows when the data was computed

To manually trigger a refresh (admin / self-hosting):

```bash
curl -X GET https://your-domain.vercel.app/api/refresh-options-signals \
  -H "Authorization: Bearer $CRON_SECRET"
```

The 🗓 earnings guard is powered by a separate, weekly Vercel Cron Job (`/api/refresh-fmp?job=earnings-calendar`) that runs **Mondays at 11:00 UTC**:

```json
{ "path": "/api/refresh-fmp?job=earnings-calendar", "schedule": "0 11 * * 1" }
```

Earnings dates rarely change day to day, so a weekly refresh is enough. To manually trigger it (admin / self-hosting, e.g. right after first deploying so badges appear immediately instead of waiting for the next Monday):

```bash
curl -X GET "https://your-domain.vercel.app/api/refresh-fmp?job=earnings-calendar" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Note: `refresh-fmp` is a single consolidated Serverless Function shared by four weekly FMP-backed jobs (`analyst-ratings`, `insider-signals`, `institutional-flow`, `earnings-calendar`) — this keeps the project's total `/api` function count under Vercel's Hobby-plan limit of 12. Each job still runs on its own cron schedule; only the underlying file is shared.

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
- **Trade ticket premiums are estimates, not live quotes** — the credit/debit, max loss, and breakeven figures come from a simplified Black-Scholes model using measured HV20 as an IV proxy (`IV ≈ HV20 × 1.25`), not a real options chain. There is no live bid/ask, open interest, or actual implied volatility skew behind these numbers — always check your broker's live chain before sizing or placing a trade
- **The earnings guard is a warning, not a filter** — the 🗓 badge flags trades whose expiry window overlaps a known earnings date, but the Spread Score itself is not adjusted for it. A high-scoring ticker can still show the earnings warning; read it and decide for yourself whether to shorten the DTE, size down, or skip
- **Earnings dates depend on a weekly refresh** — the earnings calendar cron runs Mondays; a date change or newly announced report mid-week won't appear until the next refresh. Always double-check the actual earnings date with your broker or the company's investor relations page before relying on the absence of a badge
- **MACD and SMA require sufficient history** — tickers with less than 30 days of trading history are excluded from the scan
- **Not financial advice** — the scanner identifies technical conditions that historically favour defined-risk spread trades. Market conditions change; always size positions appropriately and verify in your broker's platform before trading.

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| "No scan data yet" shown | The cron hasn't run yet (fires 5:30 PM ET weekdays). Click **🔍 Scan Now** to run a live scan immediately, or **⟳ Load cache** to pull the latest scheduled snapshot |
| Ticker missing from results | It may have been excluded due to insufficient data or a Yahoo Finance fetch error |
| Score seems wrong | The scheduled cron reflects today's complete closing data. The manual Scan Now fetches live — if run mid-session, the most recent bar is partial |
| Refresh button returns an error | The Vercel Blob hasn't been populated yet. Trigger the cron manually (admin only) |
| No 🗓 earnings badges ever appear | The earnings-calendar cron hasn't run yet (fires Mondays). Trigger `/api/refresh-fmp?job=earnings-calendar` manually (admin only), or verify `FMP_API_KEY` is set — badges fail silently open (no warning shown) rather than blocking the scanner |

---

*Not financial advice. Technical signals are educational tools — always verify with your broker before placing any trade.*
