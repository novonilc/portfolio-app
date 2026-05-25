# Customizing Data Files

The Ideas tab and Market Pulse tab are driven by two JSON files in `src/data/`. You can update either file in any text editor without touching application code. The dev server hot-reloads instantly on save; for production, rebuild with `npm run build`.

---

## File locations

```
src/data/
├── recommendations.json   # Ideas tab + Ticker Search quick-access grid
└── marketPulse.json       # Market Pulse tab — all panels and data
```

---

## recommendations.json

### File structure

```json
{
  "lastUpdated": "2026-05-24",
  "marketContext": { ... },
  "recommendations": [ ... ]
}
```

### Adding a recommendation

Add an object to the `recommendations` array:

```json
{
  "ticker":     "COST",
  "name":       "Costco Wholesale",
  "sector":     "Consumer Staples",
  "bestFor":    "TFSA",
  "conviction": "High",
  "divYield":   0.6,
  "cagr":       12,
  "thesis":     "Membership moat insulates Costco from tariff/recession cycles. Volume pricing power means margins hold even as consumers trade down. $50B+ in annual membership fees grows regardless of macro.",
  "tags":       ["Retail", "Defensive", "Consumer"],
  "fills":      ["consumer"]
}
```

#### Field reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `ticker` | string | Yes | Uppercase. Used for search and gap detection |
| `name` | string | Yes | Full company name |
| `sector` | string | Yes | Shown on card and search grid |
| `bestFor` | `"TFSA"` \| `"RRSP"` \| `"Either"` | Yes | Drives filter bar and WHT placement badge |
| `conviction` | `"High"` \| `"Medium"` | Yes | High = core sizing (8–15%); Medium = satellite (3–7%) |
| `divYield` | number | Yes | Annual yield as % (e.g. `1.5` = 1.5%); use `0` for no dividend |
| `cagr` | number | Yes | Your estimated 5-year annual growth rate |
| `thesis` | string | Yes | 3–5 sentences covering business model, edge, risk, and Canadian tax angle |
| `tags` | string[] | No | Display chips on the card — no functional effect |
| `fills` | string[] | No | Sector gap identifiers (see below) |

#### Sector gap identifiers

The app detects which sector categories are missing from the combined portfolio. Valid values for `fills`:

```
"healthcare"     "financials"    "defense"       "fixed income"
"real estate"    "international" "energy infra"  "oil & gas"     "consumer"
```

A recommendation with `"fills": ["healthcare"]` is labelled "Fills Gap" when the user has no healthcare exposure. If the user already holds a healthcare ticker (LLY, UNH, etc.), the gap disappears automatically.

#### Account placement rule

```
bestFor = "RRSP"   → any US-listed security paying dividend above ~1%
bestFor = "TFSA"   → growth stocks (0% or near-0% dividend), Canadian-listed securities
bestFor = "Either" → low-dividend US stocks, Canadian ETFs, sector-neutral choices
```

### Removing a recommendation

Delete its object from the `recommendations` array. The ticker is removed from the quick-access grid automatically on next build/reload.

### Updating the market context panel

```json
"marketContext": {
  "period":           "May 2026",
  "conflictAlert":    "ACTIVE CONFLICT — Middle East",
  "conflictInsights": [
    { "label": "Defense supercycle", "desc": "NATO allies spending 2%+ GDP on defense." }
  ],
  "themes": [
    {
      "icon":  "🛡️",
      "label": "Defense supercycle",
      "color": "#f97316",
      "desc":  "NATO rearming; LMT, RTX, NOC at decade highs."
    }
  ]
}
```

- Remove `conflictAlert` and `conflictInsights` entirely when no active conflict is relevant
- `themes` should reflect 5–8 macro drivers for the current quarter
- `color` conventions: red/orange = risks, yellow = caution, green = tailwinds, purple = growth themes

---

## marketPulse.json

### File structure overview

```
marketPulse.json
├── lastUpdated           ISO date string
├── period                Human label, e.g. "May 2026"
├── regime                Current market regime object
├── riskMeter             Risk-On / Risk-Off score and label
├── yieldCurve            Full curve data, spreads, recession probability
├── macroSignals          Array of 6 signal panel objects
├── newsSignals           Array of recent headline objects
├── outlooks              Array of 3-month and 6-month scenario panels
├── catalysts             Bull and bear factor lists
└── portfolioImplication  Summary + prioritised action list
```

### regime

```json
"regime": {
  "label":       "Cautious Bull",
  "sublabel":    "Recovery Mode",
  "color":       "#fbbf24",
  "description": "One paragraph. What is the key tension? What is driving the regime?",
  "score":       48
}
```

| Field | Notes |
|---|---|
| `score` | 0–100. Should match `riskMeter.score` |
| `color` | `#22c55e` (bull) / `#fbbf24` (caution) / `#ef4444` (bear) |

### riskMeter

```json
"riskMeter": {
  "score":    48,
  "label":    "Mildly Risk-Off",
  "sublabel": "One sentence explaining the score.",
  "color":    "#f97316"
}
```

| Score | Zone | Color |
|---|---|---|
| 0–20 | Extreme Risk-Off | `#ef4444` |
| 20–40 | Risk-Off | `#f97316` |
| 40–60 | Neutral | `#eab308` |
| 60–80 | Risk-On | `#84cc16` |
| 80–100 | Strong Risk-On | `#22c55e` |

The gauge fills from the left up to the score. A score of 44 shows a yellow fill; green only appears at scores above 60.

### macroSignals

Six panels: `Equities`, `Rates & Bonds`, `Macro`, `Credit & Risk`, `Global & Commodities`, `Sentiment`.

Each signal inside a panel:

```json
{
  "label":  "VIX",
  "value":  "~20",
  "trend":  "down",
  "status": "caution",
  "note":   "Off April spike; still elevated vs. historical average"
}
```

| Field | Options | Notes |
|---|---|---|
| `label` | string | Indicator name |
| `value` | string | Human-readable (e.g. `"~4.2%"` not `"0.042"`) |
| `trend` | `"up"` \| `"down"` \| `"sideways"` | Drives ↑↓→ arrow |
| `status` | `"bullish"` \| `"bearish"` \| `"caution"` \| `"neutral"` | Overrides dot/label colour |
| `note` | string | One short line of context |

### newsSignals

Powers the News Flash panel. Include 4–8 entries:

```json
{
  "source":          "Bloomberg",
  "headline":        "Fed Officials Signal No Rate Cuts Before Year-End",
  "date":            "May 14, 2026",
  "impact":          "bearish",
  "portfolioImpact": "Keeps short-end yields elevated. Validates holding SGOV over TLT. Weighs on QQQM valuations near-term."
}
```

| Field | Options | Notes |
|---|---|---|
| `source` | string | News outlet — shown as badge |
| `headline` | string | The headline text |
| `date` | string | Human-readable date |
| `impact` | `"bullish"` \| `"bearish"` \| `"neutral"` | Left-border colour |
| `portfolioImpact` | string | **Name specific tickers from the user's portfolio and explain how the headline affects them.** This is the most important field. |

### outlooks

Two entries (3-month and 6-month), each with three scenario cards:

```json
{
  "label":         "Base case",
  "probability":   45,
  "color":         "#fbbf24",
  "icon":          "🟡",
  "trigger":       "What has to happen for this to play out.",
  "marketTarget":  "S&P 5,400–5,750",
  "canadianAngle": "TSX, oil, CAD implications for a Canadian investor.",
  "positioning":   "What to do in your TFSA/RRSP if this materialises."
}
```

- Three probabilities (Bull / Base / Bear) must sum to 100
- `color`: `#22c55e` = bull, `#fbbf24` = base, `#ef4444` = bear
- Keep `canadianAngle` specific — mention TSX level, WTI direction, or CAD rate

### portfolioImplication

```json
"portfolioImplication": {
  "summary": "2–3 sentences specific to a Canadian TFSA/RRSP investor.",
  "actions": [
    {
      "priority": "High",
      "type":     "Buy",
      "ticker":   "NVDA",
      "action":   "Specific guidance referencing this ticker and the current regime."
    },
    {
      "priority": "Medium",
      "type":     "Watch",
      "ticker":   "MU",
      "action":   "..."
    }
  ]
}
```

#### Action field reference

| Field | Options | Notes |
|---|---|---|
| `priority` | `"High"` \| `"Medium"` \| `"Low"` | Red / amber / grey badge. Aim for 3 High actions. |
| `type` | `"Buy"` \| `"Hold"` \| `"Reduce"` \| `"Watch"` \| `"Rebalance"` | `Buy` and `Rebalance` show a green Buy/Add button. `Reduce` shows a red slider panel. |
| `ticker` | string or `null` | The affected ticker. If in the portfolio, the card shows account and current value. Use `null` for general actions. |
| `action` | string | Specific guidance — name the trigger, the rationale, and any exit condition. |

---

## Recommended update cadence

| Event | What to update |
|---|---|
| Monthly | `lastUpdated`, `period`, macro signal values, `newsSignals` |
| After FOMC meeting | Fed funds rate signal, `riskMeter.score`, 3-month scenario probabilities |
| After major earnings season | `regime.description`, sentiment signals, `newsSignals`, `catalysts` |
| Significant geopolitical shift | `regime`, `riskMeter`, bear catalysts, `portfolioImplication.actions` |
| Quarterly | Full 6-month outlook and `portfolioImplication.actions` — ensure tickers match current holdings |

---

## Using the AI refresh to update marketPulse.json

Rather than editing the JSON manually, you can use the **Market Pulse AI refresh** to regenerate the entire file automatically.

See [docs/market-pulse.md](market-pulse.md) for setup instructions. After a successful refresh, the updated data is cached in `localStorage`. To make the changes permanent (so they survive a cache clear), copy the cached value and paste it into `src/data/marketPulse.json`:

1. Open DevTools → Application → Local Storage → `pulse:cache`
2. Copy the value
3. Paste into `src/data/marketPulse.json`
4. Rebuild with `npm run build`
